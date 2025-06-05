// app/api/vehicles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { uploadToS3Optimized } from '@/lib/aws-s3';
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
    
    // Nova polja
    const fuel_type = formData.get('fuel_type') as string || 'gasoline';
    const transmission = formData.get('transmission') as string || 'manual';
    const seat_count = parseInt(formData.get('seat_count') as string) || 5;
    
    // Validate required fields
    if (!brand || !model || !year || !registration_number || !daily_rate) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Validate enum values
    const validFuelTypes = ['gasoline', 'diesel', 'hybrid', 'electric'];
    const validTransmissions = ['manual', 'automatic'];
    const validStatuses = ['available', 'rented', 'maintenance'];
    
    if (!validFuelTypes.includes(fuel_type)) {
      return NextResponse.json(
        { error: 'Invalid fuel type' }, 
        { status: 400 }
      );
    }
    
    if (!validTransmissions.includes(transmission)) {
      return NextResponse.json(
        { error: 'Invalid transmission type' }, 
        { status: 400 }
      );
    }
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' }, 
        { status: 400 }
      );
    }
    
    if (seat_count < 2 || seat_count > 20) {
      return NextResponse.json(
        { error: 'Seat count must be between 2 and 20' }, 
        { status: 400 }
      );
    }

    // Check if registration number already exists for this user
    const existingVehicle = await sql`
      SELECT id FROM vehicles 
      WHERE registration_number = ${registration_number} 
        AND user_id = ${userId}
    `;

    if (existingVehicle.length > 0) {
      return NextResponse.json(
        { error: 'Vehicle with this registration number already exists' }, 
        { status: 409 }
      );
    }

    let image_url = null;
    let thumbnail_url = null;
    let image_metadata = null;
    
    const imageFile = formData.get('image') as File;
    
    if (imageFile && imageFile.size > 0) {
      try {
        // Validate image file
        if (!imageFile.type.startsWith('image/')) {
          return NextResponse.json(
            { error: 'Invalid file type. Only images are allowed.' }, 
            { status: 400 }
          );
        }

        // Check file size (max 10MB for original)
        if (imageFile.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Image file too large. Maximum size is 10MB.' }, 
            { status: 400 }
          );
        }

        // Upload and optimize image
        const uploadResult = await uploadToS3Optimized(imageFile, {
          optimize: true,
          generateThumbnail: true,
          maxWidth: 1200,
          maxHeight: 800,
          quality: 85,
          targetSizeKB: 400
        });

        image_url = uploadResult.url;
        thumbnail_url = uploadResult.thumbnailUrl;
        image_metadata = {
          originalSize: uploadResult.originalSize,
          optimizedSize: uploadResult.optimizedSize,
          compressionRatio: uploadResult.compressionRatio
        };

        console.log('Image uploaded successfully:', {
          originalSize: `${Math.round(uploadResult.originalSize / 1024)}KB`,
          optimizedSize: `${Math.round(uploadResult.optimizedSize / 1024)}KB`,
          savings: `${uploadResult.compressionRatio}%`
        });

      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload image. Please try again.' }, 
          { status: 500 }
        );
      }
    }

    const result = await sql`
      INSERT INTO vehicles (
        brand, model, year, registration_number, 
        daily_rate, status, fuel_type, transmission, 
        seat_count, image_url, thumbnail_url, image_metadata, user_id
      )
      VALUES (
        ${brand}, ${model}, ${year}, ${registration_number}, 
        ${daily_rate}, ${status}, ${fuel_type}, ${transmission}, 
        ${seat_count}, ${image_url}, ${thumbnail_url}, 
        ${image_metadata ? JSON.stringify(image_metadata) : null}, ${userId}
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