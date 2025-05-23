import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const id = parseInt(params.id);
    const { name, email, phone, address, id_number } = body;

    const result = await sql`
      UPDATE clients 
      SET name = ${name}, 
          email = ${email}, 
          phone = ${phone || null}, 
          address = ${address || null}, 
          id_number = ${id_number || null}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // Check if client has active rentals
    const activeRentals = await sql`
      SELECT COUNT(*) as count FROM rentals 
      WHERE client_id = ${id} AND status = 'active'
    `;

    if (activeRentals[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with active rentals' }, 
        { status: 400 }
      );
    }

    await sql`DELETE FROM clients WHERE id = ${id}`;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}