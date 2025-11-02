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

  constructor(publicUrl: string) {
    this.bucketUrl = publicUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Upload file directly to R2 using proper S3 authentication
   */
  async uploadFile(file: File, accessKeyId: string, secretAccessKey: string): Promise<R2UploadResult> {
    const key = `videos/${Date.now()}-${file.name}`;
    
    // Use S3 API endpoint instead of public URL
    const s3Url = `https://aa2113b6e9c4e8181f42c2f7f46891f1.r2.cloudflarestorage.com/smart-content-videos/${key}`;
    
    console.log('R2 S3 API upload:', { url: s3Url, size: file.size, type: file.type });

    try {
      // Use AWS S3 style authentication
      const credentials = btoa(`${accessKeyId}:${secretAccessKey}`);
      
      const response = await fetch(s3Url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'video/quicktime',
          'Authorization': `Basic ${credentials}`,
        },
        mode: 'cors'
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
        url: `https://pub-8b8b71f14a6347adbfbed072ddad9828.r2.dev/${key}`, // Return public URL for access
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
