// app/api/rentals/[id]/delete/route.ts
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

    // Sve rezervacije se mogu brisati (uključujući završene)
    console.log(`Deleting rental ${rentalId} with status: ${rental[0].status}`);

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

      // Vrati vozilo u status 'available' samo ako je rental bio aktivan
      if (rental[0].status === 'active') {
        await sql`
          UPDATE vehicles 
          SET status = 'available'
          WHERE id = ${rental[0].vehicle_id} AND user_id = ${userId}
        `;
        console.log(`Vehicle ${rental[0].vehicle_id} returned to available status`);
      }

      return NextResponse.json({ 
        success: true,
        message: 'Rental deleted successfully',
        deleted_rental_id: rentalId,
        vehicle_status_updated: rental[0].status === 'active'
      });

    } catch (dbError) {
      console.error('Database error during rental deletion:', dbError);
      throw new Error('Database operation failed');
    }

  } catch (error: any) {
    console.error('Error deleting rental:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete rental',
        details: error.message || 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}