import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const clients = await sql`
      SELECT * FROM clients 
      ORDER BY created_at DESC
    `;
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firebase_uid, name, email, phone, address, id_number } = body;

    const result = await sql`
      INSERT INTO clients (firebase_uid, name, email, phone, address, id_number)
      VALUES (${firebase_uid || null}, ${name}, ${email}, ${phone || null}, ${address || null}, ${id_number || null})
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}