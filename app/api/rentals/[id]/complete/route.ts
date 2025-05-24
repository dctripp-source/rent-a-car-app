// app/api/rentals/[id]/complete/route.ts
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

    if (rental[0].status !== 'active') {
      return NextResponse.json(
        { error: 'Rental is not active' }, 
        { status: 400 }
      );
    }

    // Update rental status to completed
    await sql`
      UPDATE rentals 
      SET status = 'completed',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${rentalId} AND user_id = ${userId}
    `;

    // Update vehicle status to available
    await sql`
      UPDATE vehicles 
      SET status = 'available'
      WHERE id = ${rental[0].vehicle_id} AND user_id = ${userId}
    `;

    return NextResponse.json({ 
      success: true,
      message: 'Rental completed successfully'
    });
  } catch (error) {
    console.error('Error completing rental:', error);
    return NextResponse.json(
      { error: 'Failed to complete rental' }, 
      { status: 500 }
    );
  }
}