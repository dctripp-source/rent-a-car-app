import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { uploadToS3, deleteFromS3 } from '@/lib/aws-s3';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const id = parseInt(params.id);
    
    const brand = formData.get('brand') as string;
    const model = formData.get('model') as string;
    const year = parseInt(formData.get('year') as string);
    const registration_number = formData.get('registration_number') as string;
    const daily_rate = parseFloat(formData.get('daily_rate') as string);
    const status = formData.get('status') as string;
    
    // Get current vehicle to check for existing image
    const currentVehicle = await sql`
      SELECT image_url FROM vehicles WHERE id = ${id}
    `;

    let image_url = currentVehicle[0]?.image_url;
    const imageFile = formData.get('image') as File;
    
    if (imageFile && imageFile.size > 0) {
      // Delete old image if exists
      if (image_url) {
        await deleteFromS3(image_url);
      }
      // Upload new image
      image_url = await uploadToS3(imageFile);
    }

    const result = await sql`
      UPDATE vehicles 
      SET brand = ${brand}, 
          model = ${model}, 
          year = ${year}, 
          registration_number = ${registration_number}, 
          daily_rate = ${daily_rate}, 
          status = ${status},
          image_url = ${image_url},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // Get vehicle to delete image
    const vehicle = await sql`
      SELECT image_url FROM vehicles WHERE id = ${id}
    `;

    if (vehicle[0]?.image_url) {
      await deleteFromS3(vehicle[0].image_url);
    }

    await sql`DELETE FROM vehicles WHERE id = ${id}`;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
  }
}