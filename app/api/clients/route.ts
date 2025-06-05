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
    const { firebase_uid, name, email, phone, address, id_number } = body;

    // Validate required fields - PROMJENA: ime i broj lične karte su obavezni
    if (!name || !id_number) {
      return NextResponse.json(
        { error: 'Name and ID number are required' }, 
        { status: 400 }
      );
    }

    // Check if client with this ID number already exists for this user
    const existingClient = await sql`
      SELECT id FROM clients 
      WHERE id_number = ${id_number} AND user_id = ${userId}
    `;

    if (existingClient.length > 0) {
      return NextResponse.json(
        { error: 'Client with this ID number already exists' }, 
        { status: 409 }
      );
    }

    // Check if email is provided and if it already exists for this user
    if (email) {
      const existingEmailClient = await sql`
        SELECT id FROM clients 
        WHERE email = ${email} AND user_id = ${userId}
      `;

      if (existingEmailClient.length > 0) {
        return NextResponse.json(
          { error: 'Client with this email already exists' }, 
          { status: 409 }
        );
      }
    }

    const result = await sql`
      INSERT INTO clients (
        firebase_uid, name, email, phone, 
        address, id_number, user_id
      )
      VALUES (
        ${firebase_uid || userId}, ${name}, ${email || null}, 
        ${phone || null}, ${address || null}, 
        ${id_number}, ${userId}
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