/**
 * CLIENT-SIDE R2 Upload - No serverless functions needed!
 * Upload directly from browser to R2 using presigned URLs
 */

export interface R2UploadResult {
  url: string;
  key: string;
  size: number;
}

// Client-side R2 uploader that bypasses ALL Vercel limits
export class ClientR2Uploader {
  private bucketUrl: string;

  constructor(s3Endpoint: string, bucketName: string) {
    this.bucketUrl = `${s3Endpoint}/${bucketName}`;
  }

  /**
   * Upload file directly to R2 using S3-compatible credentials
   */
  async uploadFile(file: File, accessKeyId: string, secretAccessKey: string): Promise<R2UploadResult> {
    const key = `videos/${Date.now()}-${file.name}`;
    const url = `${this.bucketUrl}/${key}`;
    
    console.log('Direct R2 upload:', { url, size: file.size, type: file.type });

    try {
      // For public R2 buckets, try upload without authentication
      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'video/quicktime',
        },
        mode: 'no-cors' // Try no-cors mode for public buckets
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        console.error('R2 upload error details:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          errorText
        });
        throw new Error(`R2 upload failed: ${response.status} ${response.statusText}. Check CORS settings and API token.`);
      }

      console.log('✅ Direct R2 upload successful');

      return {
        url: `${this.bucketUrl}/${key}`,
        key,
        size: file.size
      };

    } catch (error) {
      console.error('Direct R2 upload failed:', error);
      throw error;
    }
  }

  /**
   * Generate public URL for uploaded file
   */
  getPublicUrl(key: string): string {
    return `${this.bucketUrl}/${key}`;
  }
}
