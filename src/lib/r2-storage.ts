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
   * Upload file to R2 via presigned URL (keeps large payloads off our API routes)
   */
  async uploadFile(file: File): Promise<R2UploadResult> {
    console.log('Starting R2 upload via server:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    try {
      // Step 1: request a presigned URL from our API (tiny payload)
      const presignResponse = await fetch('/api/r2/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size
        })
      });

      if (!presignResponse.ok) {
        const errorBody = await presignResponse.json().catch(() => ({}));
        throw new Error(
          `Failed to get upload URL: ${errorBody.error || presignResponse.statusText}`
        );
      }

      const { uploadUrl, publicUrl, key } = await presignResponse.json();

      // Step 2: upload directly to R2 using the presigned URL (large payload never hits our server)
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file
      });

      if (!uploadResponse.ok) {
        const uploadErrorText = await uploadResponse.text().catch(() => '');
        console.error('R2 presigned upload error:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          body: uploadErrorText
        });
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      console.log('✅ R2 upload successful');

      return {
        url: publicUrl,
        key,
        size: file.size
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
