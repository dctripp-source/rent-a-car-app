import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/verify-token';

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' }, 
        { status: 401 }
      );
    }

    const clients = await sql`
      SELECT * FROM clients 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' }, 
      { status: 500 }
    );
  }
}

// app/api/clients/route.ts - POST funkcija
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      firebase_uid, 
      name, 
      email, 
      phone, 
      address, 
      id_number,
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

    // Uklanjamo provjeru duplikata jer nema obaveznih unique polja
    // Sada možemo imati klijente bez email-a ili ID broj-a

    const result = await sql`
      INSERT INTO clients (
        firebase_uid, name, email, phone, 
        address, id_number, driving_license_number,
        id_card_issue_date, id_card_valid_until, id_card_issued_by,
        driving_license_issue_date, driving_license_valid_until, driving_license_issued_by,
        user_id
      )
      VALUES (
        ${firebase_uid || userId}, ${name}, ${email}, 
        ${phone || null}, ${address || null}, 
        ${id_number || null}, ${driving_license_number},
        ${id_card_issue_date || null}, ${id_card_valid_until || null}, ${id_card_issued_by || null},
        ${driving_license_issue_date || null}, ${driving_license_valid_until || null}, ${driving_license_issued_by || null},
        ${userId}
      )
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' }, 
      { status: 500 }
    );
  }
}