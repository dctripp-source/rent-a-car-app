// app/api/rentals/[id]/extend/route.ts
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
    const { extension_days, extension_price } = body;

    if (isNaN(rentalId)) {
      return NextResponse.json(
        { error: 'Invalid rental ID' }, 
        { status: 400 }
      );
    }

    // Validate extension days (max 3)
    if (!extension_days || extension_days < 1 || extension_days > 3) {
      return NextResponse.json(
        { error: 'Extension days must be between 1 and 3' }, 
        { status: 400 }
      );
    }

    if (!extension_price || extension_price <= 0) {
      return NextResponse.json(
        { error: 'Invalid extension price' }, 
        { status: 400 }
      );
    }

    // Get current rental and check ownership
    const rental = await sql`
      SELECT r.*, v.daily_rate
      FROM rentals r
      JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.id = ${rentalId} AND r.user_id = ${userId}
    `;

    if (rental.length === 0) {
      return NextResponse.json(
        { error: 'Rental not found' }, 
        { status: 404 }
      );
    }

    if (rental[0].status !== 'active') {
      return NextResponse.json(
        { error: 'Can only extend active rentals' }, 
        { status: 400 }
      );
    }

    // Check if rental already has extensions
    const existingExtensions = await sql`
      SELECT SUM(extension_days) as total_days 
      FROM rental_extensions 
      WHERE rental_id = ${rentalId}
    `;

    const totalExtensionDays = parseInt(existingExtensions[0].total_days || 0) + extension_days;
    
    if (totalExtensionDays > 3) {
      return NextResponse.json(
        { error: 'Total extensions cannot exceed 3 days' }, 
        { status: 400 }
      );
    }

    // Calculate new end date
    const currentEndDate = new Date(rental[0].end_date);
    currentEndDate.setDate(currentEndDate.getDate() + extension_days);
    const newEndDate = currentEndDate.toISOString().split('T')[0];

    // Check for overlapping rentals with the extended period
    const overlapCheck = await sql`
      SELECT id FROM rentals 
      WHERE vehicle_id = ${rental[0].vehicle_id} 
        AND user_id = ${userId}
        AND status = 'active'
        AND id != ${rentalId}
        AND start_date <= ${newEndDate}
        AND end_date >= ${rental[0].end_date}
    `;

    if (overlapCheck.length > 0) {
      return NextResponse.json(
        { error: 'Cannot extend - vehicle is booked for this period' }, 
        { status: 409 }
      );
    }

    try {
      // Update rental
      await sql`
        UPDATE rentals 
        SET end_date = ${newEndDate}, 
            total_price = ${parseFloat(rental[0].total_price) + extension_price},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${rentalId} AND user_id = ${userId}
      `;

      // Insert extension record
      await sql`
        INSERT INTO rental_extensions (
          rental_id, extension_days, extension_price
        )
        VALUES (${rentalId}, ${extension_days}, ${extension_price})
      `;

      return NextResponse.json({ 
        success: true,
        message: `Rental extended by ${extension_days} days`,
        new_end_date: newEndDate,
        new_total_price: parseFloat(rental[0].total_price) + extension_price
      });
    } catch (error) {
      console.error('Error extending rental:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error extending rental:', error);
    return NextResponse.json(
      { error: 'Failed to extend rental' }, 
      { status: 500 }
    );
  }
}