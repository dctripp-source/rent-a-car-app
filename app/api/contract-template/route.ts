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
        logo_url: null,
        jib_number: '',
        bank_account: '',
        owner_name: '',
        contract_style: 'simple',
        include_km_fields: false,
        include_driver_license: false,
        include_id_details: false,
        fuel_policy: 'Vozilo se preuzima sa punim rezervoarom goriva i vraća sa punim rezervoarom.',
        additional_notes: ''
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
    
    // Osnovni podaci
    const company_name = formData.get('company_name') as string;
    const company_address = formData.get('company_address') as string;
    const company_phone = formData.get('company_phone') as string;
    const company_email = formData.get('company_email') as string;
    const contract_terms = formData.get('contract_terms') as string;
    const penalty_rate = parseFloat(formData.get('penalty_rate') as string);
    
    // Novi podaci
    const jib_number = formData.get('jib_number') as string;
    const bank_account = formData.get('bank_account') as string;
    const owner_name = formData.get('owner_name') as string;
    const contract_style = formData.get('contract_style') as string || 'simple';
    const include_km_fields = formData.get('include_km_fields') === 'true';
    const include_driver_license = formData.get('include_driver_license') === 'true';
    const include_id_details = formData.get('include_id_details') === 'true';
    const fuel_policy = formData.get('fuel_policy') as string;
    const additional_notes = formData.get('additional_notes') as string;
    
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

    // Validate contract style
    const validStyles = ['simple', 'detailed', 'jandra_style'];
    if (!validStyles.includes(contract_style)) {
      return NextResponse.json(
        { error: 'Invalid contract style' }, 
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
      SELECT id, logo_url FROM contract_templates 
      WHERE user_id = ${userId}
    `;

    let result;
    if (existingTemplate.length > 0) {
      // Keep existing logo if no new one uploaded
      const currentLogoUrl = logo_url || existingTemplate[0].logo_url;
      
      // Update existing template
      result = await sql`
        UPDATE contract_templates 
        SET company_name = ${company_name},
            company_address = ${company_address},
            company_phone = ${company_phone || null},
            company_email = ${company_email || null},
            contract_terms = ${contract_terms},
            penalty_rate = ${penalty_rate},
            logo_url = ${currentLogoUrl},
            jib_number = ${jib_number || null},
            bank_account = ${bank_account || null},
            owner_name = ${owner_name || null},
            contract_style = ${contract_style},
            include_km_fields = ${include_km_fields},
            include_driver_license = ${include_driver_license},
            include_id_details = ${include_id_details},
            fuel_policy = ${fuel_policy || null},
            additional_notes = ${additional_notes || null},
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;
    } else {
      // Create new template
      result = await sql`
        INSERT INTO contract_templates (
          user_id, company_name, company_address, company_phone,
          company_email, contract_terms, penalty_rate, logo_url,
          jib_number, bank_account, owner_name, contract_style,
          include_km_fields, include_driver_license, include_id_details,
          fuel_policy, additional_notes
        )
        VALUES (
          ${userId}, ${company_name}, ${company_address}, ${company_phone || null},
          ${company_email || null}, ${contract_terms}, ${penalty_rate}, ${logo_url},
          ${jib_number || null}, ${bank_account || null}, ${owner_name || null}, ${contract_style},
          ${include_km_fields}, ${include_driver_license}, ${include_id_details},
          ${fuel_policy || null}, ${additional_notes || null}
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