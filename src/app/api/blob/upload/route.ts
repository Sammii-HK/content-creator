import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    console.log('=== Direct Blob Upload (Edge Runtime) ===');
    
    // Get headers
    const filename = request.headers.get('X-Filename') || `iphone-${Date.now()}.mov`;
    const contentType = request.headers.get('X-Content-Type') || 'video/quicktime';
    
    console.log('Upload info:', { filename, contentType });

    // Upload directly using put() - this works with large files
    const blob = await put(`iphone/${Date.now()}-${filename}`, request.body!, {
      access: 'public',
      contentType,
    });

    console.log('✅ Direct blob upload successful:', blob.url);

    return NextResponse.json({
      success: true,
      url: blob.url,
      message: 'iPhone video uploaded successfully'
    });

  } catch (error) {
    console.error('Direct blob upload failed:', error);
    return NextResponse.json(
      { 
        error: 'Direct upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}