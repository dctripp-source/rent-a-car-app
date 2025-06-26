// app/api/rentals/route.ts - Ažurirana sa napomenama
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

    const rentals = await sql`
      SELECT 
        r.*,
        v.brand, v.model, v.year, v.registration_number, v.daily_rate,
        c.name as client_name, c.email as client_email, c.phone as client_phone
      FROM rentals r
      JOIN vehicles v ON r.vehicle_id = v.id AND v.user_id = ${userId}
      JOIN clients c ON r.client_id = c.id AND c.user_id = ${userId}
      WHERE r.user_id = ${userId}
      ORDER BY r.created_at DESC
    `;

    // Transform the flat data into nested structure
    const transformedRentals = rentals.map(rental => ({
      id: rental.id,
      vehicle_id: rental.vehicle_id,
      client_id: rental.client_id,
      start_date: rental.start_date,
      end_date: rental.end_date,
      total_price: parseFloat(rental.total_price),
      status: rental.status,
      notes: rental.notes, // Dodano polje za napomene
      created_at: rental.created_at,
      updated_at: rental.updated_at,
      vehicle: {
        id: rental.vehicle_id,
        brand: rental.brand,
        model: rental.model,
        year: rental.year,
        registration_number: rental.registration_number,
        daily_rate: parseFloat(rental.daily_rate),
      },
      client: {
        id: rental.client_id,
        name: rental.client_name,
        email: rental.client_email,
        phone: rental.client_phone,
      },
    }));

    return NextResponse.json(transformedRentals);
  } catch (error) {
    console.error('Error fetching rentals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rentals' }, 
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
    const { vehicle_id, client_id, start_date, end_date, total_price, notes } = body;

    // Validate required fields
    if (!vehicle_id || !client_id || !start_date || !end_date || !total_price) {
      return NextResponse.json(
        { error: 'All fields are required' }, 
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

    // Check for overlapping rentals
    const overlapCheck = await sql`
      SELECT id FROM rentals 
      WHERE vehicle_id = ${vehicle_id} 
        AND user_id = ${userId}
        AND status = 'active'
        AND (
          (start_date <= ${end_date} AND end_date >= ${start_date})
        )
    `;

    if (overlapCheck.length > 0) {
      return NextResponse.json(
        { error: 'Vehicle is already rented for this period' }, 
        { status: 409 }
      );
    }

    // Start transaction
    try {
      // Update vehicle status
      await sql`
        UPDATE vehicles 
        SET status = 'rented' 
        WHERE id = ${vehicle_id} AND user_id = ${userId}
      `;

      // Create rental
      const result = await sql`
        INSERT INTO rentals (
          vehicle_id, client_id, start_date, end_date, 
          total_price, status, notes, user_id
        )
        VALUES (
          ${vehicle_id}, ${client_id}, ${start_date}, 
          ${end_date}, ${total_price}, 'active', ${notes || null}, ${userId}
        )
        RETURNING *
      `;

      return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
      // Rollback vehicle status on error
      await sql`
        UPDATE vehicles 
        SET status = 'available' 
        WHERE id = ${vehicle_id} AND user_id = ${userId}
      `;
      throw error;
    }
  } catch (error) {
    console.error('Error creating rental:', error);
    return NextResponse.json(
      { error: 'Failed to create rental' }, 
      { status: 500 }
    );
  }
}