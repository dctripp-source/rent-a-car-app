// lib/server-image-optimizer.ts
import sharp from 'sharp';

export interface ServerImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  targetSizeKB?: number;
}

export class ServerImageOptimizer {
  static async optimizeImageBuffer(
    buffer: Buffer,
    options: ServerImageOptions = {}
  ): Promise<{ buffer: Buffer; metadata: any }> {
    const {
      maxWidth = 1200,
      maxHeight = 800,
      quality = 85,
      format = 'webp',
      targetSizeKB = 400
    } = options;

    let sharpInstance = sharp(buffer);
    
    // Get original metadata
    const metadata = await sharpInstance.metadata();
    
    // Resize if necessary
    if (metadata.width && metadata.height) {
      const shouldResize = metadata.width > maxWidth || metadata.height > maxHeight;
      
      if (shouldResize) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
    }

    // Convert format and optimize
    let optimizedBuffer: Buffer;
    
    switch (format) {
      case 'webp':
        optimizedBuffer = await sharpInstance
          .webp({ quality, effort: 6 })
          .toBuffer();
        break;
      case 'jpeg':
        optimizedBuffer = await sharpInstance
          .jpeg({ quality, progressive: true })
          .toBuffer();
        break;
      case 'png':
        optimizedBuffer = await sharpInstance
          .png({ compressionLevel: 9, effort: 10 })
          .toBuffer();
        break;
      default:
        optimizedBuffer = await sharpInstance.toBuffer();
    }

    // Check if we need to reduce quality further
    if (optimizedBuffer.length > targetSizeKB * 1024 && quality > 60) {
      const newQuality = Math.max(60, quality - 10);
      return this.optimizeImageBuffer(buffer, {
        ...options,
        quality: newQuality
      });
    }

    const newMetadata = await sharp(optimizedBuffer).metadata();
    
    return {
      buffer: optimizedBuffer,
      metadata: {
        ...newMetadata,
        originalSize: buffer.length,
        optimizedSize: optimizedBuffer.length,
        compressionRatio: Math.round(((buffer.length - optimizedBuffer.length) / buffer.length) * 100)
      }
    };
  }

  static async optimizeFile(
    file: File,
    options: ServerImageOptions = {}
  ): Promise<{ buffer: Buffer; metadata: any; filename: string }> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { buffer: optimizedBuffer, metadata } = await this.optimizeImageBuffer(buffer, options);
    
    // Generate new filename
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    const extension = options.format === 'webp' ? '.webp' : 
                     options.format === 'jpeg' ? '.jpg' : '.png';
    const filename = `${nameWithoutExt}_opt${extension}`;
    
    return {
      buffer: optimizedBuffer,
      metadata,
      filename
    };
  }

  /**
   * Generate multiple sizes for responsive images
   */
  static async generateResponsiveSizes(
    buffer: Buffer,
    options: {
      sizes: { width: number; suffix: string }[];
      format?: 'webp' | 'jpeg';
      quality?: number;
    }
  ): Promise<{ [key: string]: Buffer }> {
    const { sizes, format = 'webp', quality = 85 } = options;
    const results: { [key: string]: Buffer } = {};

    for (const size of sizes) {
      let sharpInstance = sharp(buffer)
        .resize(size.width, null, {
          fit: 'inside',
          withoutEnlargement: true
        });

      let optimizedBuffer: Buffer;
      
      if (format === 'webp') {
        optimizedBuffer = await sharpInstance
          .webp({ quality, effort: 6 })
          .toBuffer();
      } else {
        optimizedBuffer = await sharpInstance
          .jpeg({ quality, progressive: true })
          .toBuffer();
      }

      results[size.suffix] = optimizedBuffer;
    }

    return results;
  }
}

// package.json dependency to add:
// "sharp": "^0.33.2"