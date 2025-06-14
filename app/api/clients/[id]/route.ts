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
        { error: 'Invalid client ID' }, 
        { status: 400 }
      );
    }

    const client = await sql`
      SELECT * FROM clients 
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (client.length === 0) {
      return NextResponse.json(
        { error: 'Client not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(client[0]);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' }, 
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
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid client ID' }, 
        { status: 400 }
      );
    }

    const { 
      name, 
      email, 
      phone, 
      address, 
      id_number,
      jmbg,
      driving_license_number,
      id_card_issue_date,
      id_card_valid_until,
      id_card_issued_by,
      driving_license_issue_date,
      driving_license_valid_until,
      driving_license_issued_by
    } = body;

    // Validate required fields - samo ime i prezime
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' }, 
        { status: 400 }
      );
    }

    // Check if client exists and belongs to user
    const clientCheck = await sql`
      SELECT id FROM clients 
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (clientCheck.length === 0) {
      return NextResponse.json(
        { error: 'Client not found' }, 
        { status: 404 }
      );
    }

    // Provjeri duplikate za broj lične karte (osim trenutnog klijenta)
    if (id_number && id_number.trim()) {
      const existingClient = await sql`
        SELECT id, name FROM clients 
        WHERE id_number = ${id_number.trim()} 
          AND user_id = ${userId} 
          AND id != ${id}
      `;

      if (existingClient.length > 0) {
        return NextResponse.json(
          { error: `Drugi klijent sa brojem lične karte ${id_number} već postoji: ${existingClient[0].name}` }, 
          { status: 409 }
        );
      }
    }

    // Provjeri duplikate za email (osim trenutnog klijenta)
    if (email && email.trim()) {
      const existingClient = await sql`
        SELECT id, name FROM clients 
        WHERE email = ${email.trim()} 
          AND user_id = ${userId} 
          AND id != ${id}
      `;

      if (existingClient.length > 0) {
        return NextResponse.json(
          { error: `Drugi klijent sa email adresom ${email} već postoji: ${existingClient[0].name}` }, 
          { status: 409 }
        );
      }
    }

    const result = await sql`
      UPDATE clients 
      SET name = ${name}, 
          email = ${email || null}, 
          phone = ${phone || null}, 
          address = ${address || null}, 
          id_number = ${id_number || null},
          jmbg = ${jmbg || null},
          driving_license_number = ${driving_license_number || null},
          id_card_issue_date = ${id_card_issue_date || null},
          id_card_valid_until = ${id_card_valid_until || null},
          id_card_issued_by = ${id_card_issued_by || null},
          driving_license_issue_date = ${driving_license_issue_date || null},
          driving_license_valid_until = ${driving_license_valid_until || null},
          driving_license_issued_by = ${driving_license_issued_by || null}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' }, 
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

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid client ID' }, 
        { status: 400 }
      );
    }
    
    // Check if client has active rentals
    const activeRentals = await sql`
      SELECT COUNT(*) as count FROM rentals 
      WHERE client_id = ${id} 
        AND status = 'active' 
        AND user_id = ${userId}
    `;

    if (parseInt(activeRentals[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with active rentals' }, 
        { status: 400 }
      );
    }

    // Check if client exists and belongs to user
    const clientCheck = await sql`
      SELECT id FROM clients 
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (clientCheck.length === 0) {
      return NextResponse.json(
        { error: 'Client not found' }, 
        { status: 404 }
      );
    }

    // Delete client
    await sql`
      DELETE FROM clients 
      WHERE id = ${id} AND user_id = ${userId}
    `;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Client deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' }, 
      { status: 500 }
    );
  }
}