// app/api/rentals/[id]/contract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generateContract } from '@/lib/pdf-generator';
import { verifyToken } from '@/lib/verify-token';

interface ContractTemplate {
  company_name: string;
  company_address: string;
  company_phone?: string;
  company_email?: string;
  contract_terms: string;
  penalty_rate: number;
  logo_url?: string;
}

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

    const rentalId = parseInt(params.id);

    if (isNaN(rentalId)) {
      return NextResponse.json(
        { error: 'Invalid rental ID' }, 
        { status: 400 }
      );
    }

    // Get rental details with vehicle and client info
    const rental = await sql`
      SELECT 
        r.id,
        r.start_date,
        r.end_date,
        r.total_price,
        v.brand, 
        v.model, 
        v.year, 
        v.registration_number, 
        v.daily_rate,
        c.name as client_name, 
        c.email as client_email, 
        c.phone as client_phone,
        c.address as client_address, 
        c.id_number as client_id_number
      FROM rentals r
      JOIN vehicles v ON r.vehicle_id = v.id AND v.user_id = ${userId}
      JOIN clients c ON r.client_id = c.id AND c.user_id = ${userId}
      WHERE r.id = ${rentalId} AND r.user_id = ${userId}
    `;

    if (rental.length === 0) {
      return NextResponse.json(
        { error: 'Rental not found' }, 
        { status: 404 }
      );
    }

    // Get user's contract template
    const templateQuery = await sql`
      SELECT * FROM contract_templates 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    // Create properly typed template object
    let contractTemplate: ContractTemplate;
    
    if (templateQuery.length > 0) {
      const dbTemplate = templateQuery[0];
      contractTemplate = {
        company_name: String(dbTemplate.company_name || ''),
        company_address: String(dbTemplate.company_address || ''),
        company_phone: dbTemplate.company_phone ? String(dbTemplate.company_phone) : undefined,
        company_email: dbTemplate.company_email ? String(dbTemplate.company_email) : undefined,
        contract_terms: String(dbTemplate.contract_terms || ''),
        penalty_rate: Number(dbTemplate.penalty_rate || 50.00),
        logo_url: dbTemplate.logo_url ? String(dbTemplate.logo_url) : undefined
      };
    } else {
      // Use default template if none exists
      contractTemplate = {
        company_name: 'Rent-a-Car Company',
        company_address: 'Adresa kompanije',
        company_phone: undefined,
        company_email: undefined,
        contract_terms: `Klijent se obavezuje da će vozilo koristiti u skladu sa pravilima saobraćaja i da će ga vratiti u istom stanju u kojem ga je preuzeo. 
Klijent snosi punu odgovornost za sve štete nastale tokom perioda iznajmljivanja. 
U slučaju kašnjenja sa vraćanjem vozila, klijent je dužan platiti penale u iznosu od {penalty_rate}% dnevne cijene za svaki dan kašnjenja.

Dodatni uslovi:
- Vozilo se preuzima sa punim rezervoarom i vraća sa punim rezervoarom
- Zabranjeno je pušenje u vozilu
- Zabranjeno je prevoz kućnih ljubimaca bez prethodnog odobrenja
- Maksimalna dozvoljena brzina je ograničena na 130 km/h na autoputu`,
        penalty_rate: 50.00,
        logo_url: undefined
      };
    }

    // Map data for PDF generation
    const contractData = {
      id: rental[0].id,
      start_date: rental[0].start_date,
      end_date: rental[0].end_date,
      total_price: parseFloat(rental[0].total_price),
      brand: rental[0].brand,
      model: rental[0].model,
      year: rental[0].year,
      registration_number: rental[0].registration_number,
      daily_rate: parseFloat(rental[0].daily_rate),
      client_name: rental[0].client_name,
      client_email: rental[0].client_email,
      client_phone: rental[0].client_phone || undefined,
      client_address: rental[0].client_address || undefined,
      client_id_number: rental[0].client_id_number || undefined,
    };

    const pdfBuffer = await generateContract(contractData, contractTemplate);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ugovor-${rentalId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json(
      { error: 'Failed to generate contract' }, 
      { status: 500 }
    );
  }
}