// app/api/settings/route.ts
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

    const settings = await sql`
      SELECT * FROM company_settings 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (settings.length === 0) {
      // Vraćamo default postavke ako ne postoje
      return NextResponse.json({
        company_name: '',
        company_address: '',
        company_phone: '',
        company_email: '',
        company_jib: '',
        bank_account: '',
        terms_and_conditions: 'Korisnik snosi punu materijalnu, krivičnu i prekršajnu odgovornost nad vozilom, te se obavezuje platiti nastala oštećenja i saobraćajne prekršaje u periodu trajanja najma.'
      });
    }

    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' }, 
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
      company_address, 
      company_phone, 
      company_email, 
      company_jib, 
      bank_account, 
      terms_and_conditions 
    } = body;

    // Validate required fields
    if (!company_name || !company_address || !company_phone || !company_email || !terms_and_conditions) {
      return NextResponse.json(
        { error: 'Company name, address, phone, email and terms are required' }, 
        { status: 400 }
      );
    }

    // Check if settings already exist
    const existingSettings = await sql`
      SELECT id FROM company_settings 
      WHERE user_id = ${userId}
    `;

    let result;
    
    if (existingSettings.length > 0) {
      // Update existing settings
      result = await sql`
        UPDATE company_settings 
        SET company_name = ${company_name},
            company_address = ${company_address},
            company_phone = ${company_phone},
            company_email = ${company_email},
            company_jib = ${company_jib || null},
            bank_account = ${bank_account || null},
            terms_and_conditions = ${terms_and_conditions},
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;
    } else {
      // Create new settings
      result = await sql`
        INSERT INTO company_settings (
          user_id, company_name, company_address, company_phone, 
          company_email, company_jib, bank_account, terms_and_conditions
        )
        VALUES (
          ${userId}, ${company_name}, ${company_address}, ${company_phone}, 
          ${company_email}, ${company_jib || null}, ${bank_account || null}, ${terms_and_conditions}
        )
        RETURNING *
      `;
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' }, 
      { status: 500 }
    );
  }
}