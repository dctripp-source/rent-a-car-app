// app/api/rentals/[id]/contract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generateContract } from '@/lib/pdf-generator';
import { verifyToken } from '@/lib/verify-token';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== CONTRACT GENERATION START ===');
    console.log('Rental ID:', params.id);
    console.log('Timestamp:', new Date().toISOString());
    
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

    console.log('User ID:', userId);

    // Get rental details sa svim podacima o klijentu
    console.log('Fetching rental data...');
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
        c.id_number as client_id_number,
        c.driving_license_number,
        c.id_card_issue_date,
        c.id_card_valid_until,
        c.id_card_issued_by,
        c.driving_license_issue_date,
        c.driving_license_valid_until,
        c.driving_license_issued_by
      FROM rentals r
      JOIN vehicles v ON r.vehicle_id = v.id AND v.user_id = ${userId}
      JOIN clients c ON r.client_id = c.id AND c.user_id = ${userId}
      WHERE r.id = ${rentalId} AND r.user_id = ${userId}
    `;

    if (rental.length === 0) {
      console.log('Rental not found');
      return NextResponse.json(
        { error: 'Rental not found' }, 
        { status: 404 }
      );
    }

    console.log('Rental found:', rental[0].id);

    // Učitaj company settings
    console.log('Fetching company settings...');
    const companySettings = await sql`
      SELECT * FROM company_settings 
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    console.log('Found settings count:', companySettings.length);
    
    // Pripremi company data
    let company;
    if (companySettings.length > 0) {
      console.log('Using database company settings');
      const settings = companySettings[0];
      company = {
        company_name: settings.company_name,
        contact_person: settings.contact_person || 'Desanka Jandrić',
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        jib: settings.jib || '',
        bank_account: settings.bank_account || '',
        terms_and_conditions: settings.terms_and_conditions,
      };
    } else {
      console.log('Using default company settings');
      company = {
        company_name: 'NOVERA RENT d.o.o.',
        contact_person: 'Desanka Jandrić',
        address: 'Rade Kondića 6c, Prijedor',
        phone: '+387 66 11 77 86',
        email: 'novera.rent@gmail.com',
        jib: '4512970750008',
        bank_account: '562-099-8180-8643-85',
        terms_and_conditions: 'Korisnik snosi punu materijalnu, krivičnu i prekršajnu odgovornost nad vozilom, te se obavezuje platiti nastala oštećenja i saobraćajne prekršaje u periodu trajanja najma.',
      };
    }

    console.log('Final company data for PDF:');
    console.log('- Name:', company.company_name);
    console.log('- Person:', company.contact_person);

    // Pripremi contract data
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
      driving_license_number: rental[0].driving_license_number || undefined,
      id_card_issue_date: rental[0].id_card_issue_date || undefined,
      id_card_valid_until: rental[0].id_card_valid_until || undefined,
      id_card_issued_by: rental[0].id_card_issued_by || undefined,
      driving_license_issue_date: rental[0].driving_license_issue_date || undefined,
      driving_license_valid_until: rental[0].driving_license_valid_until || undefined,
      driving_license_issued_by: rental[0].driving_license_issued_by || undefined,
      company: company,
    };

    console.log('Starting PDF generation...');

    // Generate PDF
    const pdfBuffer = await generateContract(contractData);

    console.log('PDF generated successfully, size:', pdfBuffer.length);
    console.log('=== CONTRACT GENERATION END ===');

    // Return PDF with cache-busting headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ugovor-${rentalId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: unknown) {
    console.error('=== CONTRACT GENERATION ERROR ===');
    console.error('Error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
      ? error 
      : 'Unknown error occurred';
      
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    
    console.error('Stack:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate contract',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}