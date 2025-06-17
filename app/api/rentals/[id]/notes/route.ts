// app/api/rentals/[id]/notes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/verify-token';

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
    const { notes } = body;

    if (isNaN(rentalId)) {
      return NextResponse.json(
        { error: 'Invalid rental ID' }, 
        { status: 400 }
      );
    }

    // Check if rental exists and belongs to user
    const rental = await sql`
      SELECT id FROM rentals 
      WHERE id = ${rentalId} AND user_id = ${userId}
    `;

    if (rental.length === 0) {
      return NextResponse.json(
        { error: 'Rental not found' }, 
        { status: 404 }
      );
    }

    // Update notes
    await sql`
      UPDATE rentals 
      SET notes = ${notes || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${rentalId} AND user_id = ${userId}
    `;

    return NextResponse.json({ 
      success: true,
      message: 'Notes updated successfully'
    });
  } catch (error) {
    console.error('Error updating notes:', error);
    return NextResponse.json(
      { error: 'Failed to update notes' }, 
      { status: 500 }
    );
  }
}