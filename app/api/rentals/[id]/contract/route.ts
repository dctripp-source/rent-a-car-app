// app/api/rentals/[id]/contract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generateContract } from '@/lib/pdf-generator';
import { verifyToken } from '@/lib/verify-token';

// IMPORTANT: Disable caching completely
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

    // Get rental details
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
        c.id_number as client_id_number
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

    // FRESH company settings query (no cache)
    console.log('Fetching FRESH company settings...');
    const companySettings = await sql`
      SELECT * FROM company_settings 
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    console.log('Company settings query executed');
    console.log('Found settings count:', companySettings.length);
    
    if (companySettings.length > 0) {
      console.log('Found company settings:');
      console.log('- Company name:', companySettings[0].company_name);
      console.log('- Contact person:', companySettings[0].contact_person);
      console.log('- Updated at:', companySettings[0].updated_at);
    } else {
      console.log('No company settings found for user:', userId);
    }

    // Prepare company data
    let company;
    if (companySettings.length > 0) {
      console.log('Using database company settings');
      company = {
        company_name: companySettings[0].company_name,
        contact_person: companySettings[0].contact_person,
        address: companySettings[0].address,
        phone: companySettings[0].phone,
        email: companySettings[0].email,
        jib: companySettings[0].jib,
        bank_account: companySettings[0].bank_account,
      };
    } else {
      console.log('Using default company settings');
      company = {
        company_name: 'NOVERA RENT d.o.o.',
        contact_person: 'Desanka Jandric',
        address: 'Rade Kondica 6c, Prijedor',
        phone: '+387 66 11 77 86',
        email: 'novera.rent@gmail.com',
        jib: '4512970750008',
        bank_account: '562-099-8180-8643-85'
      };
    }

    console.log('Final company data for PDF:');
    console.log('- Name:', company.company_name);
    console.log('- Person:', company.contact_person);

    // Prepare contract data
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
      company: company,
    };

    console.log('Starting PDF generation...');

    // Generate PDF
    const pdfBuffer = await generateContract(contractData);

    console.log('PDF generated successfully, size:', pdfBuffer.length);

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
    
    // Type-safe error handling
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