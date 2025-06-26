// app/api/rentals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/verify-token';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' }, 
        { status: 401 }
      );
    }

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid rental ID' }, 
        { status: 400 }
      );
    }

    const rental = await sql`
      SELECT 
        r.*,
        v.brand, v.model, v.year, v.registration_number, v.daily_rate,
        c.name as client_name, c.email as client_email, c.phone as client_phone
      FROM rentals r
      JOIN vehicles v ON r.vehicle_id = v.id AND v.user_id = ${userId}
      JOIN clients c ON r.client_id = c.id AND c.user_id = ${userId}
      WHERE r.id = ${id} AND r.user_id = ${userId}
    `;

    if (rental.length === 0) {
      return NextResponse.json(
        { error: 'Rental not found' }, 
        { status: 404 }
      );
    }

    const transformedRental = {
      id: rental[0].id,
      vehicle_id: rental[0].vehicle_id,
      client_id: rental[0].client_id,
      start_date: rental[0].start_date,
      end_date: rental[0].end_date,
      total_price: parseFloat(rental[0].total_price),
      status: rental[0].status,
      created_at: rental[0].created_at,
      updated_at: rental[0].updated_at,
      vehicle: {
        id: rental[0].vehicle_id,
        brand: rental[0].brand,
        model: rental[0].model,
        year: rental[0].year,
        registration_number: rental[0].registration_number,
        daily_rate: parseFloat(rental[0].daily_rate),
      },
      client: {
        id: rental[0].client_id,
        name: rental[0].client_name,
        email: rental[0].client_email,
        phone: rental[0].client_phone,
      },
    };

    return NextResponse.json(transformedRental);
  } catch (error) {
    console.error('Error fetching rental:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' }, 
        { status: 401 }
      );
    }

    const rentalId = parseInt(params.id);

    if (isNaN(rentalId)) {
      return NextResponse.json(
        { error: 'Invalid rental ID' }, 
        { status: 400 }
      );
    }

    // Get rental and check ownership
    const rental = await sql`
      SELECT * FROM rentals 
      WHERE id = ${rentalId} AND user_id = ${userId}
    `;

    if (rental.length === 0) {
      return NextResponse.json(
        { error: 'Rental not found' }, 
        { status: 404 }
      );
    }

    // Rezervacije se mogu brisati bez obzira na status
    // (uključujući i završene rezervacije na zahtjev klijenta)

    try {
      // Obriši povezane produžetke ako postoje
      await sql`
        DELETE FROM rental_extensions 
        WHERE rental_id = ${rentalId}
      `;

      // Obriši rezervaciju
      await sql`
        DELETE FROM rentals 
        WHERE id = ${rentalId} AND user_id = ${userId}
      `;

      // Vrati vozilo u status 'available' ako je bilo 'rented'
      if (rental[0].status === 'active') {
        await sql`
          UPDATE vehicles 
          SET status = 'available'
          WHERE id = ${rental[0].vehicle_id} AND user_id = ${userId}
        `;
      }

      return NextResponse.json({ 
        success: true,
        message: 'Rental deleted successfully'
      });
    } catch (error) {
      console.error('Database error during rental deletion:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting rental:', error);
    return NextResponse.json(
      { error: 'Failed to delete rental' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const rentalId = parseInt(params.id);
    const { vehicle_id, client_id, start_date, end_date, total_price, status } = body;

    if (isNaN(rentalId)) {
      return NextResponse.json(
        { error: 'Invalid rental ID' }, 
        { status: 400 }
      );
    }

    // Validate required fields
    if (!vehicle_id || !client_id || !start_date || !end_date || !total_price) {
      return NextResponse.json(
        { error: 'All fields are required' }, 
        { status: 400 }
      );
    }

    // Get current rental
    const currentRental = await sql`
      SELECT * FROM rentals 
      WHERE id = ${rentalId} AND user_id = ${userId}
    `;

    if (currentRental.length === 0) {
      return NextResponse.json(
        { error: 'Rental not found' }, 
        { status: 404 }
      );
    }

    // Check for overlapping rentals (exclude current rental)
    const overlapCheck = await sql`
      SELECT id FROM rentals 
      WHERE vehicle_id = ${vehicle_id} 
        AND user_id = ${userId}
        AND status = 'active'
        AND id != ${rentalId}
        AND (
          (start_date <= ${end_date} AND end_date >= ${start_date})
        )
    `;

    if (overlapCheck.length > 0) {
      return NextResponse.json(
        { error: 'Vozilo je već iznajmljeno za ovaj period' }, 
        { status: 409 }
      );
    }

    // Update rental
    const result = await sql`
      UPDATE rentals 
      SET vehicle_id = ${vehicle_id}, 
          client_id = ${client_id}, 
          start_date = ${start_date}, 
          end_date = ${end_date}, 
          total_price = ${total_price},
          status = ${status || currentRental[0].status},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${rentalId} AND user_id = ${userId}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating rental:', error);
    return NextResponse.json(
      { error: 'Failed to update rental' }, 
      { status: 500 }
    );
  }
}