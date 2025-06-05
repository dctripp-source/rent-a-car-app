// lib/aws-s3-optimized.ts
import AWS from 'aws-sdk';
import { ServerImageOptimizer } from './server-image-optimizer';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export interface UploadOptions {
  optimize?: boolean;
  generateThumbnail?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetSizeKB?: number;
}

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

export const uploadToS3Optimized = async (
  file: File, 
  options: UploadOptions = {}
): Promise<UploadResult> => {
  const {
    optimize = true,
    generateThumbnail = true,
    maxWidth = 1200,
    maxHeight = 800,
    quality = 85,
    targetSizeKB = 400
  } = options;

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const originalSize = originalBuffer.length;
  
  let uploadBuffer = originalBuffer;
  let optimizedSize = originalSize;
  let compressionRatio = 0;
  let filename = file.name;
  let contentType = file.type;

  // Optimize image if requested and it's an image
  if (optimize && file.type.startsWith('image/')) {
    try {
      const optimized = await ServerImageOptimizer.optimizeImageBuffer(originalBuffer, {
        maxWidth,
        maxHeight,
        quality,
        format: 'webp',
        targetSizeKB
      });
      
      uploadBuffer = optimized.buffer;
      optimizedSize = optimized.buffer.length;
      compressionRatio = optimized.metadata.compressionRatio || 0;
      
      // Update filename and content type for WebP
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      filename = `${nameWithoutExt}.webp`;
      contentType = 'image/webp';
      
    } catch (error) {
      console.warn('Image optimization failed, uploading original:', error);
      // Continue with original file if optimization fails
    }
  }

  // Generate unique file key
  const timestamp = Date.now();
  const fileKey = `vehicles/${timestamp}-${filename}`;

  // Upload main image
  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: fileKey,
    Body: uploadBuffer,
    ContentType: contentType,
    CacheControl: 'max-age=31536000', // 1 year cache
    Metadata: {
      'original-size': originalSize.toString(),
      'optimized-size': optimizedSize.toString(),
      'compression-ratio': compressionRatio.toString(),
    }
  };

  const uploadResult = await s3.upload(uploadParams).promise();
  
  let thumbnailUrl: string | undefined;

  // Generate and upload thumbnail if requested
  if (generateThumbnail && file.type.startsWith('image/')) {
    try {
      const thumbnailBuffer = await ServerImageOptimizer.optimizeImageBuffer(originalBuffer, {
        maxWidth: 400,
        maxHeight: 300,
        quality: 80,
        format: 'webp',
        targetSizeKB: 100
      });

      const thumbnailKey = `vehicles/thumbnails/${timestamp}-thumb-${filename}`;
      
      const thumbnailParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: thumbnailKey,
        Body: thumbnailBuffer.buffer,
        ContentType: 'image/webp',
        CacheControl: 'max-age=31536000',
      };

      const thumbnailResult = await s3.upload(thumbnailParams).promise();
      thumbnailUrl = thumbnailResult.Location;
      
    } catch (error) {
      console.warn('Thumbnail generation failed:', error);
      // Continue without thumbnail if generation fails
    }
  }

  return {
    url: uploadResult.Location,
    thumbnailUrl,
    originalSize,
    optimizedSize,
    compressionRatio
  };
};

export const uploadToS3 = async (file: File): Promise<string> => {
  // Backward compatibility - just return URL
  const result = await uploadToS3Optimized(file);
  return result.url;
};

export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  try {
    // Extract file key from URL
    const url = new URL(fileUrl);
    const fileKey = url.pathname.substring(1); // Remove leading slash

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
    };

    await s3.deleteObject(params).promise();

    // Also try to delete thumbnail if it exists
    const thumbnailKey = fileKey.replace('vehicles/', 'vehicles/thumbnails/').replace(/^vehicles\/thumbnails\//, 'vehicles/thumbnails/').replace(/([^/]+)$/, 'thumb-$1');
    
    try {
      await s3.deleteObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: thumbnailKey,
      }).promise();
    } catch (error) {
      // Ignore thumbnail deletion errors
      console.warn('Could not delete thumbnail:', error);
    }
    
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw error;
  }
};

export const generatePresignedUrl = async (
  fileKey: string, 
  expiresIn: number = 3600
): Promise<string> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: fileKey,
    Expires: expiresIn,
  };

  return s3.getSignedUrl('getObject', params);
};

// Utility function to get image metadata from S3
export const getImageMetadata = async (fileUrl: string): Promise<any> => {
  try {
    const url = new URL(fileUrl);
    const fileKey = url.pathname.substring(1);

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
    };

    const result = await s3.headObject(params).promise();
    return result.Metadata;
  } catch (error) {
    console.error('Error getting image metadata:', error);
    return null;
  }
};