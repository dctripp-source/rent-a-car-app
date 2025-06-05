// app/api/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/verify-token';

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' }, 
        { status: 401 }
      );
    }

    const reservations = await sql`
      SELECT 
        r.*,
        v.brand, v.model, v.year, v.registration_number, v.daily_rate,
        c.name as client_name, c.email as client_email, c.phone as client_phone
      FROM rentals r
      JOIN vehicles v ON r.vehicle_id = v.id AND v.user_id = ${userId}
      JOIN clients c ON r.client_id = c.id AND c.user_id = ${userId}
      WHERE r.user_id = ${userId} AND r.status = 'reserved'
      ORDER BY r.start_date ASC
    `;

    // Transform the flat data into nested structure
    const transformedReservations = reservations.map(reservation => ({
      id: reservation.id,
      vehicle_id: reservation.vehicle_id,
      client_id: reservation.client_id,
      start_date: reservation.start_date,
      end_date: reservation.end_date,
      start_datetime: reservation.start_datetime,
      end_datetime: reservation.end_datetime,
      total_price: parseFloat(reservation.total_price),
      status: reservation.status,
      notes: reservation.notes,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at,
      vehicle: {
        id: reservation.vehicle_id,
        brand: reservation.brand,
        model: reservation.model,
        year: reservation.year,
        registration_number: reservation.registration_number,
        daily_rate: parseFloat(reservation.daily_rate),
      },
      client: {
        id: reservation.client_id,
        name: reservation.client_name,
        email: reservation.client_email,
        phone: reservation.client_phone,
      },
    }));

    return NextResponse.json(transformedReservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      vehicle_id, 
      client_id, 
      start_date, 
      end_date, 
      start_datetime,
      end_datetime,
      total_price,
      notes 
    } = body;

    // Validate required fields
    if (!vehicle_id || !client_id || !start_date || !end_date || !total_price) {
      return NextResponse.json(
        { error: 'All required fields must be provided' }, 
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' }, 
        { status: 400 }
      );
    }

    // Check if vehicle exists and belongs to user
    const vehicleCheck = await sql`
      SELECT id, status FROM vehicles 
      WHERE id = ${vehicle_id} AND user_id = ${userId}
    `;

    if (vehicleCheck.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found' }, 
        { status: 404 }
      );
    }

    if (vehicleCheck[0].status !== 'available') {
      return NextResponse.json(
        { error: 'Vehicle is not available' }, 
        { status: 400 }
      );
    }

    // Check if client exists and belongs to user
    const clientCheck = await sql`
      SELECT id FROM clients 
      WHERE id = ${client_id} AND user_id = ${userId}
    `;

    if (clientCheck.length === 0) {
      return NextResponse.json(
        { error: 'Client not found' }, 
        { status: 404 }
      );
    }

    // Check for overlapping reservations/rentals
    const overlapCheck = await sql`
      SELECT id FROM rentals 
      WHERE vehicle_id = ${vehicle_id} 
        AND user_id = ${userId}
        AND status IN ('active', 'reserved')
        AND (
          (start_date <= ${end_date} AND end_date >= ${start_date})
        )
    `;

    if (overlapCheck.length > 0) {
      return NextResponse.json(
        { error: 'Vehicle is already booked for this period' }, 
        { status: 409 }
      );
    }

    // Create reservation
    const result = await sql`
      INSERT INTO rentals (
        vehicle_id, client_id, start_date, end_date, 
        start_datetime, end_datetime, total_price, 
        status, notes, user_id
      )
      VALUES (
        ${vehicle_id}, ${client_id}, ${start_date}, 
        ${end_date}, ${start_datetime || null}, ${end_datetime || null}, 
        ${total_price}, 'reserved', ${notes || null}, ${userId}
      )
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' }, 
      { status: 500 }
    );
  }
}