// app/api/settings/company/route.ts
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

    // Get company settings from database
    const settings = await sql`
      SELECT * FROM company_settings 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (settings.length === 0) {
      // Return default settings if none exist
      return NextResponse.json({
        company_name: 'NOVERA RENT d.o.o.',
        contact_person: 'Desanka Jandrić',
        address: 'Rade Kondića 6c, Prijedor',
        phone: '+387 66 11 77 86',
        email: 'novera.rent@gmail.com',
        jib: '4512970750008',
        bank_account: '562-099-8180-8643-85'
      });
    }

    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company settings' }, 
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
    const { 
      company_name, 
      contact_person, 
      address, 
      phone, 
      email, 
      jib, 
      bank_account 
    } = body;

    // Check if settings exist
    const existing = await sql`
      SELECT id FROM company_settings 
      WHERE user_id = ${userId}
    `;

    let result;
    if (existing.length > 0) {
      // Update existing
      result = await sql`
        UPDATE company_settings 
        SET company_name = ${company_name},
            contact_person = ${contact_person},
            address = ${address},
            phone = ${phone},
            email = ${email},
            jib = ${jib},
            bank_account = ${bank_account},
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;
    } else {
      // Create new
      result = await sql`
        INSERT INTO company_settings (
          company_name, contact_person, address, phone, 
          email, jib, bank_account, user_id
        )
        VALUES (
          ${company_name}, ${contact_person}, ${address}, 
          ${phone}, ${email}, ${jib}, ${bank_account}, ${userId}
        )
        RETURNING *
      `;
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error saving company settings:', error);
    return NextResponse.json(
      { error: 'Failed to save company settings' }, 
      { status: 500 }
    );
  }
}