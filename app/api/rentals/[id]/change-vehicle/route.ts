// app/api/rentals/[id]/change-vehicle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/verify-token';

export async function POST(
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
    const { new_vehicle_id } = body;

    if (isNaN(rentalId)) {
      return NextResponse.json(
        { error: 'Invalid rental ID' }, 
        { status: 400 }
      );
    }

    if (!new_vehicle_id) {
      return NextResponse.json(
        { error: 'New vehicle ID is required' }, 
        { status: 400 }
      );
    }

    // Get current rental and check ownership
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

    if (rental[0].status !== 'active') {
      return NextResponse.json(
        { error: 'Can only change vehicle for active rentals' }, 
        { status: 400 }
      );
    }

    // Check if new vehicle exists and is available
    const newVehicle = await sql`
      SELECT * FROM vehicles 
      WHERE id = ${new_vehicle_id} AND user_id = ${userId}
    `;

    if (newVehicle.length === 0) {
      return NextResponse.json(
        { error: 'New vehicle not found' }, 
        { status: 404 }
      );
    }

    if (newVehicle[0].status !== 'available' && newVehicle[0].id !== rental[0].vehicle_id) {
      return NextResponse.json(
        { error: 'New vehicle is not available' }, 
        { status: 400 }
      );
    }

    // If changing to a different vehicle
    if (newVehicle[0].id !== rental[0].vehicle_id) {
      // Set old vehicle as available
      await sql`
        UPDATE vehicles 
        SET status = 'available'
        WHERE id = ${rental[0].vehicle_id} AND user_id = ${userId}
      `;

      // Set new vehicle as rented
      await sql`
        UPDATE vehicles 
        SET status = 'rented'
        WHERE id = ${new_vehicle_id} AND user_id = ${userId}
      `;

      // Update rental with new vehicle
      await sql`
        UPDATE rentals 
        SET vehicle_id = ${new_vehicle_id},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${rentalId} AND user_id = ${userId}
      `;
    }

    return NextResponse.json({ 
      success: true,
      message: 'Vehicle changed successfully'
    });
  } catch (error) {
    console.error('Error changing vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to change vehicle' }, 
      { status: 500 }
    );
  }
}