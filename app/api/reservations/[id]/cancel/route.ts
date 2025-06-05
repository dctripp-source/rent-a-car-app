// app/api/reservations/[id]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/verify-token';

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

    const reservationId = parseInt(params.id);

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { error: 'Invalid reservation ID' }, 
        { status: 400 }
      );
    }

    // Get reservation and check ownership
    const reservation = await sql`
      SELECT * FROM rentals 
      WHERE id = ${reservationId} AND user_id = ${userId} AND status = 'reserved'
    `;

    if (reservation.length === 0) {
      return NextResponse.json(
        { error: 'Reservation not found' }, 
        { status: 404 }
      );
    }

    // Update reservation status to cancelled
    await sql`
      UPDATE rentals 
      SET status = 'cancelled',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${reservationId} AND user_id = ${userId}
    `;

    return NextResponse.json({ 
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel reservation' }, 
      { status: 500 }
    );
  }
}