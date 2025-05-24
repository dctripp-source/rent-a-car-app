import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { uploadToS3 } from '@/lib/aws-s3';
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

    const vehicles = await sql`
      SELECT * FROM vehicles 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' }, 
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
    
    const brand = formData.get('brand') as string;
    const model = formData.get('model') as string;
    const year = parseInt(formData.get('year') as string);
    const registration_number = formData.get('registration_number') as string;
    const daily_rate = parseFloat(formData.get('daily_rate') as string);
    const status = formData.get('status') as string || 'available';
    
    // Validate required fields
    if (!brand || !model || !year || !registration_number || !daily_rate) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    let image_url = null;
    const imageFile = formData.get('image') as File;
    
    if (imageFile && imageFile.size > 0) {
      try {
        image_url = await uploadToS3(imageFile);
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        // Continue without image
      }
    }

    const result = await sql`
      INSERT INTO vehicles (
        brand, model, year, registration_number, 
        daily_rate, status, image_url, user_id
      )
      VALUES (
        ${brand}, ${model}, ${year}, ${registration_number}, 
        ${daily_rate}, ${status}, ${image_url}, ${userId}
      )
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to create vehicle' }, 
      { status: 500 }
    );
  }
}