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

  constructor(accountId: string, bucketName: string) {
    this.bucketUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`;
  }

  /**
   * Upload file directly to R2 from browser
   */
  async uploadFile(file: File, apiToken: string): Promise<R2UploadResult> {
    const key = `videos/${Date.now()}-${file.name}`;
    const url = `${this.bucketUrl}/${key}`;
    
    console.log('Direct R2 upload:', { url, size: file.size, type: file.type });

    try {
      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'video/quicktime',
          'Authorization': `Bearer ${apiToken}`,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`R2 upload failed: ${response.status} ${response.statusText} - ${errorText}`);
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
