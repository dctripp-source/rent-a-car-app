import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generateContract } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rentalId = parseInt(params.id);

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
      JOIN vehicles v ON r.vehicle_id = v.id
      JOIN clients c ON r.client_id = c.id
      WHERE r.id = ${rentalId}
    `;

    if (!rental[0]) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Eksplicitno mapiranje podataka u ContractData tip
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

    const pdfBuffer = await generateContract(contractData);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ugovor-${rentalId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json({ error: 'Failed to generate contract' }, { status: 500 });
  }
}