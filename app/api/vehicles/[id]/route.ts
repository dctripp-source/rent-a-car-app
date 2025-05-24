import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { uploadToS3, deleteFromS3 } from '@/lib/aws-s3';
import { verifyToken } from '@/lib/verify-token';

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

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid vehicle ID' }, 
        { status: 400 }
      );
    }

    const vehicle = await sql`
      SELECT * FROM vehicles 
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (vehicle.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle[0]);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const formData = await request.formData();
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid vehicle ID' }, 
        { status: 400 }
      );
    }
    
    const brand = formData.get('brand') as string;
    const model = formData.get('model') as string;
    const year = parseInt(formData.get('year') as string);
    const registration_number = formData.get('registration_number') as string;
    const daily_rate = parseFloat(formData.get('daily_rate') as string);
    const status = formData.get('status') as string;
    
    // Validate required fields
    if (!brand || !model || !year || !registration_number || !daily_rate || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Check if vehicle exists and belongs to user
    const currentVehicle = await sql`
      SELECT id, image_url FROM vehicles 
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (currentVehicle.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found' }, 
        { status: 404 }
      );
    }

    let image_url = currentVehicle[0].image_url;
    const imageFile = formData.get('image') as File;
    
    if (imageFile && imageFile.size > 0) {
      try {
        // Delete old image if exists
        if (image_url) {
          await deleteFromS3(image_url);
        }
        // Upload new image
        image_url = await uploadToS3(imageFile);
      } catch (uploadError) {
        console.error('Error handling image:', uploadError);
        // Keep existing image on error
      }
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
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to update vehicle' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid vehicle ID' }, 
        { status: 400 }
      );
    }
    
    // Check if vehicle has active rentals
    const activeRentals = await sql`
      SELECT COUNT(*) as count FROM rentals 
      WHERE vehicle_id = ${id} 
        AND status = 'active' 
        AND user_id = ${userId}
    `;

    if (parseInt(activeRentals[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete vehicle with active rentals' }, 
        { status: 400 }
      );
    }

    // Get vehicle to delete image
    const vehicle = await sql`
      SELECT image_url FROM vehicles 
      WHERE id = ${id} AND user_id = ${userId}
    `;

    if (vehicle.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found' }, 
        { status: 404 }
      );
    }

    // Delete image from S3 if exists
    if (vehicle[0].image_url) {
      try {
        await deleteFromS3(vehicle[0].image_url);
      } catch (error) {
        console.error('Error deleting image from S3:', error);
        // Continue with vehicle deletion even if image deletion fails
      }
    }

    // Delete vehicle
    await sql`
      DELETE FROM vehicles 
      WHERE id = ${id} AND user_id = ${userId}
    `;
    
    return NextResponse.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to delete vehicle' }, 
      { status: 500 }
    );
  }
}