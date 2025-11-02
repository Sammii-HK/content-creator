import { NextRequest, NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';

export async function POST(request: NextRequest) {
  return handleUpload({
    body: request.body,
    request,
    onBeforeGenerateToken: async (pathname) => {
      // Validate the upload request
      console.log('Generating presigned URL for:', pathname);
      
      return {
        allowedContentTypes: [
          'video/mp4', 'video/mov', 'video/quicktime', 
          'video/webm', 'video/avi', 'video/x-msvideo',
          'video/hevc', 'video/h264', 'video/m4v'
        ],
        maximumSizeInBytes: 500 * 1024 * 1024, // 500MB limit
      };
    },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      console.log('Direct blob upload completed:', blob.url);
      
      // Save to database after successful upload
      try {
        const { db } = await import('@/lib/db');
        
        // Extract info from pathname
        const fileName = blob.pathname.split('/').pop() || 'unknown';
        const fileSizeMB = blob.size / (1024 * 1024);
        const estimatedDuration = Math.max(5, Math.min(300, Math.round(fileSizeMB * 8)));

        const brollEntry = await db.broll.create({
          data: {
            name: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
            description: `iPhone video upload: ${fileName}`,
            fileUrl: blob.url,
            duration: estimatedDuration,
            category: 'mobile-upload',
            tags: ['iphone', 'mobile'],
            isActive: true
          }
        });

        console.log('B-roll entry created:', brollEntry.id);
        
      } catch (dbError) {
        console.error('Database save failed:', dbError);
        // Don't fail the upload - file is already uploaded
      }
    },
  });
}
