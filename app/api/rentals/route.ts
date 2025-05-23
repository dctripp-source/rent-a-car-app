import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const rentals = await sql`
      SELECT 
        r.*,
        v.brand, v.model, v.year, v.registration_number, v.daily_rate,
        c.name as client_name, c.email as client_email, c.phone as client_phone
      FROM rentals r
      JOIN vehicles v ON r.vehicle_id = v.id
      JOIN clients c ON r.client_id = c.id
      ORDER BY r.created_at DESC
    `;

    // Transform the flat data into nested structure
    const transformedRentals = rentals.map(rental => ({
      id: rental.id,
      vehicle_id: rental.vehicle_id,
      client_id: rental.client_id,
      start_date: rental.start_date,
      end_date: rental.end_date,
      total_price: rental.total_price,
      status: rental.status,
      created_at: rental.created_at,
      updated_at: rental.updated_at,
      vehicle: {
        id: rental.vehicle_id,
        brand: rental.brand,
        model: rental.model,
        year: rental.year,
        registration_number: rental.registration_number,
        daily_rate: rental.daily_rate,
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
    return NextResponse.json({ error: 'Failed to fetch rentals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicle_id, client_id, start_date, end_date, total_price } = body;

    // Update vehicle status
    await sql`UPDATE vehicles SET status = 'rented' WHERE id = ${vehicle_id}`;

    const result = await sql`
      INSERT INTO rentals (vehicle_id, client_id, start_date, end_date, total_price, status)
      VALUES (${vehicle_id}, ${client_id}, ${start_date}, ${end_date}, ${total_price}, 'active')
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating rental:', error);
    return NextResponse.json({ error: 'Failed to create rental' }, { status: 500 });
  }
}