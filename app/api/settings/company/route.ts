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
      ORDER BY updated_at DESC
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
        bank_account: '562-099-8180-8643-85',
        terms_and_conditions: `Korisnik snosi punu materijalnu, krivičnu i prekršajnu odgovornost nad vozilom, te se obavezuje platiti nastala oštećenja i saobraćajne prekršaje u periodu trajanja najma.

The renter bears full material and criminal and misdemeanor responsibility for the vehicle and undertakes to pay for the resulting damages and traffic violations during the rental period.

Vozilo mora biti vraćeno u istom stanju u kojem je preuzeto. U slučaju kašnjenja sa vraćanjem vozila, korisnik je dužan platiti penale u iznosu od 50% dnevne cijene za svaki dan kašnjenja.

Korisnik se obavezuje da neće koristiti vozilo za prevoz opasnih materija, za taksi usluge ili bilo koje komercijalne aktivnosti bez prethodne pisane saglasnosti iznajmljivača.`
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
    console.log('Received company settings data:', body);
    
    const { 
      company_name, 
      contact_person, 
      address, 
      phone, 
      email, 
      jib, 
      bank_account,
      terms_and_conditions 
    } = body;

    console.log('Extracted fields:', {
      company_name: company_name?.length,
      address: address?.length,
      phone: phone?.length,
      email: email?.length,
      terms_and_conditions: terms_and_conditions?.length
    });

    // Validate required fields
    if (!company_name?.trim() || !address?.trim() || !phone?.trim() || !email?.trim() || !terms_and_conditions?.trim()) {
      return NextResponse.json(
        { error: 'Company name, address, phone, email and terms are required' }, 
        { status: 400 }
      );
    }

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
        SET company_name = ${company_name.trim()},
            contact_person = ${contact_person?.trim() || null},
            address = ${address.trim()},
            phone = ${phone.trim()},
            email = ${email.trim()},
            jib = ${jib?.trim() || null},
            bank_account = ${bank_account?.trim() || null},
            terms_and_conditions = ${terms_and_conditions.trim()},
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;
    } else {
      // Create new
      result = await sql`
        INSERT INTO company_settings (
          company_name, contact_person, address, phone, 
          email, jib, bank_account, terms_and_conditions, user_id
        )
        VALUES (
          ${company_name.trim()}, ${contact_person?.trim() || null}, ${address.trim()}, 
          ${phone.trim()}, ${email.trim()}, ${jib?.trim() || null}, 
          ${bank_account?.trim() || null}, ${terms_and_conditions.trim()}, ${userId}
        )
        RETURNING *
      `;
    }

    console.log('Settings saved successfully:', result[0]);
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error saving company settings:', error);
    return NextResponse.json(
      { error: 'Failed to save company settings' }, 
      { status: 500 }
    );
  }
}