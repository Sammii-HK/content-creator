/**
 * R2 Upload using presigned URLs - Secure and reliable
 */

export interface R2UploadResult {
  url: string;
  key: string;
  size: number;
}

/**
 * Client-side R2 uploader using server-side upload (no CORS issues)
 */
export class ClientR2Uploader {
  /**
   * Upload file to R2 via server-side endpoint (bypasses CORS completely)
   */
  async uploadFile(file: File): Promise<R2UploadResult> {
    console.log('Starting R2 upload via server:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    try {
      // Upload via server endpoint (no CORS issues)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);

      const uploadResponse = await fetch('/api/r2/upload-direct', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
        console.error('R2 upload error:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          error
        });
        throw new Error(`Upload failed: ${error.error || uploadResponse.statusText}`);
      }

      const result = await uploadResponse.json();
      console.log('✅ R2 upload successful');

      return {
        url: result.url,
        key: result.key,
        size: result.size
      };

    } catch (error) {
      console.error('R2 upload failed:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('R2 upload failed: Network connection error. Please check your internet connection and try again.');
      }
      throw error;
    }
  }
}
