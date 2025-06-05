// lib/image-optimizer.ts
export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetSizeKB?: number;
  format?: 'webp' | 'jpeg';
}

export class ImageOptimizer {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;

  private static getCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d')!;
    }
    return { canvas: this.canvas, ctx: this.ctx! };
  }

  static async optimizeImage(
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<File> {
    const {
      maxWidth = 1200,
      maxHeight = 800,
      quality = 0.85,
      targetSizeKB = 400,
      format = 'webp'
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const { canvas, ctx } = this.getCanvas();
          
          // Calculate new dimensions while maintaining aspect ratio
          const { width: newWidth, height: newHeight } = this.calculateDimensions(
            img.width,
            img.height,
            maxWidth,
            maxHeight
          );

          // Set canvas dimensions
          canvas.width = newWidth;
          canvas.height = newHeight;

          // Clear canvas and draw image
          ctx.clearRect(0, 0, newWidth, newHeight);
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          // Convert to blob with initial quality
          this.canvasToOptimizedFile(
            canvas,
            file.name,
            format,
            quality,
            targetSizeKB
          ).then(resolve).catch(reject);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      
      // Create object URL from file
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      
      // Clean up object URL after image loads or errors
      const cleanup = () => URL.revokeObjectURL(objectUrl);
      img.addEventListener('load', cleanup, { once: true });
      img.addEventListener('error', cleanup, { once: true });
    });
  }

  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Calculate scale factor
    const scaleX = maxWidth / width;
    const scaleY = maxHeight / height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

    width = Math.round(width * scale);
    height = Math.round(height * scale);

    return { width, height };
  }

  private static async canvasToOptimizedFile(
    canvas: HTMLCanvasElement,
    originalName: string,
    format: 'webp' | 'jpeg',
    initialQuality: number,
    targetSizeKB: number
  ): Promise<File> {
    const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
    let quality = initialQuality;
    let blob: Blob;

    // Try to achieve target file size
    do {
      blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), mimeType, quality);
      });

      // If file is too large and quality can be reduced further
      if (blob.size > targetSizeKB * 1024 && quality > 0.1) {
        quality -= 0.1;
      } else {
        break;
      }
    } while (blob.size > targetSizeKB * 1024 && quality > 0.1);

    // Create new filename with proper extension
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    const extension = format === 'webp' ? '.webp' : '.jpg';
    const newName = `${nameWithoutExt}_optimized${extension}`;

    return new File([blob], newName, { type: mimeType });
  }

  /**
   * Quick validation if file needs optimization
   */
  static needsOptimization(file: File, maxSizeKB: number = 500): boolean {
    const sizeKB = file.size / 1024;
    const isLargeFile = sizeKB > maxSizeKB;
    const isNotWebP = !file.type.includes('webp');
    
    return isLargeFile || isNotWebP;
  }

  /**
   * Get file size in KB
   */
  static getFileSizeKB(file: File): number {
    return Math.round(file.size / 1024);
  }

  /**
   * Check if browser supports WebP
   */
  static supportsWebP(): Promise<boolean> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      
      canvas.toBlob((blob) => {
        resolve(blob !== null);
      }, 'image/webp');
    });
  }
}