import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const rentalId = parseInt(params.id);
    const { extension_days, extension_price } = body;

    // Get current rental
    const rental = await sql`
      SELECT end_date, total_price FROM rentals WHERE id = ${rentalId}
    `;

    if (!rental[0]) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Calculate new end date
    const currentEndDate = new Date(rental[0].end_date);
    currentEndDate.setDate(currentEndDate.getDate() + extension_days);
    const newEndDate = currentEndDate.toISOString().split('T')[0];

    // Update rental
    await sql`
      UPDATE rentals 
      SET end_date = ${newEndDate}, 
          total_price = ${rental[0].total_price + extension_price},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${rentalId}
    `;

    // Insert extension record
    await sql`
      INSERT INTO rental_extensions (rental_id, extension_days, extension_price)
      VALUES (${rentalId}, ${extension_days}, ${extension_price})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error extending rental:', error);
    return NextResponse.json({ error: 'Failed to extend rental' }, { status: 500 });
  }
}