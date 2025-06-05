// app/api/contract-template/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/verify-token';
import { uploadToS3 } from '@/lib/aws-s3';

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' }, 
        { status: 401 }
      );
    }

    const template = await sql`
      SELECT * FROM contract_templates 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (template.length === 0) {
      // Vratiti default template ako ne postoji
      return NextResponse.json({
        company_name: '',
        company_address: '',
        company_phone: '',
        company_email: '',
        contract_terms: `Klijent se obavezuje da će vozilo koristiti u skladu sa pravilima saobraćaja i da će ga vratiti u istom stanju u kojem ga je preuzeo. 
Klijent snosi punu odgovornost za sve štete nastale tokom perioda iznajmljivanja. 
U slučaju kašnjenja sa vraćanjem vozila, klijent je dužan platiti penale u iznosu od {penalty_rate}% dnevne cijene za svaki dan kašnjenja.

Dodatni uslovi:
- Vozilo se preuzima sa punim rezervoarom i vraća sa punim rezervoarom
- Zabranjeno je pušenje u vozilu
- Zabranjeno je prevoz kućnih ljubimaca bez prethodnog odobrenja
- Maksimalna dozvoljena brzina je ograničena na 130 km/h na autoputu`,
        penalty_rate: 50.00,
        logo_url: null
      });
    }

    return NextResponse.json(template[0]);
  } catch (error) {
    console.error('Error fetching contract template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract template' }, 
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

    const formData = await request.formData();
    
    const company_name = formData.get('company_name') as string;
    const company_address = formData.get('company_address') as string;
    const company_phone = formData.get('company_phone') as string;
    const company_email = formData.get('company_email') as string;
    const contract_terms = formData.get('contract_terms') as string;
    const penalty_rate = parseFloat(formData.get('penalty_rate') as string);
    
    // Validate required fields
    if (!company_name || !company_address || !contract_terms) {
      return NextResponse.json(
        { error: 'Company name, address and contract terms are required' }, 
        { status: 400 }
      );
    }

    if (penalty_rate < 0 || penalty_rate > 100) {
      return NextResponse.json(
        { error: 'Penalty rate must be between 0 and 100' }, 
        { status: 400 }
      );
    }

    let logo_url = null;
    const logoFile = formData.get('logo') as File;
    
    if (logoFile && logoFile.size > 0) {
      try {
        logo_url = await uploadToS3(logoFile);
      } catch (uploadError) {
        console.error('Error uploading logo:', uploadError);
        // Continue without logo
      }
    }

    // Check if template already exists
    const existingTemplate = await sql`
      SELECT id FROM contract_templates 
      WHERE user_id = ${userId}
    `;

    let result;
    if (existingTemplate.length > 0) {
      // Update existing template
      result = await sql`
        UPDATE contract_templates 
        SET company_name = ${company_name},
            company_address = ${company_address},
            company_phone = ${company_phone || null},
            company_email = ${company_email || null},
            contract_terms = ${contract_terms},
            penalty_rate = ${penalty_rate},
            logo_url = ${logo_url || null},
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;
    } else {
      // Create new template
      result = await sql`
        INSERT INTO contract_templates (
          user_id, company_name, company_address, company_phone,
          company_email, contract_terms, penalty_rate, logo_url
        )
        VALUES (
          ${userId}, ${company_name}, ${company_address}, ${company_phone || null},
          ${company_email || null}, ${contract_terms}, ${penalty_rate}, ${logo_url || null}
        )
        RETURNING *
      `;
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error saving contract template:', error);
    return NextResponse.json(
      { error: 'Failed to save contract template' }, 
      { status: 500 }
    );
  }
}