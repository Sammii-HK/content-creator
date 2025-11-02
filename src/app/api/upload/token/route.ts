import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

/**
 * SIMPLE iPhone video upload that actually works
 * Handles the upload server-side with streaming
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== Streaming iPhone Upload ===');
    
    const filename = request.headers.get('X-Filename') || 'iphone-video.mov';
    const contentType = request.headers.get('X-Content-Type') || 'video/quicktime';
    
    console.log('Upload headers:', { filename, contentType });

    // Get content length for file size
    const contentLength = request.headers.get('content-length');
    const fileSize = contentLength ? parseInt(contentLength) : 10 * 1024 * 1024; // 10MB default
    const fileSizeMB = fileSize / (1024 * 1024);

    console.log('File size from headers:', `${fileSizeMB.toFixed(1)}MB`);

    // Stream the body directly to Vercel Blob
    const uploadResult = await put(`iphone/${Date.now()}-${filename}`, request.body!, {
      access: 'public',
      contentType,
    });

    console.log('✅ Streaming upload successful:', uploadResult.url);

    // Calculate duration
    const estimatedDuration = Math.max(5, Math.min(300, Math.round(fileSizeMB * 8)));

    // Save to database
    const { db } = await import('@/lib/db');
    const brollEntry = await db.broll.create({
      data: {
        name: filename.replace(/\.[^/.]+$/, ""),
        description: `iPhone video: ${filename} (${fileSizeMB.toFixed(1)}MB)`,
        fileUrl: uploadResult.url,
        duration: estimatedDuration,
        category: 'personal',
        tags: ['iphone', 'streaming-upload'],
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      broll: brollEntry,
      message: `✅ iPhone video streamed successfully (${fileSizeMB.toFixed(1)}MB)`,
      method: 'streaming'
    });

  } catch (error) {
    console.error('Streaming upload failed:', error);
    return NextResponse.json(
      { 
        error: 'Streaming upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
