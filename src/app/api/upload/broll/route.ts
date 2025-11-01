import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { z } from 'zod';

const UploadBrollSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  duration: z.number().positive('Duration must be positive'),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadata = JSON.parse(formData.get('metadata') as string);
    
    const { name, description, category, tags, duration } = UploadBrollSchema.parse(metadata);

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'File must be a video' },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(`broll/${Date.now()}-${file.name}`, file, {
      access: 'public',
      contentType: file.type,
    });

    // Save to database
    const brollEntry = await db.broll.create({
      data: {
        name,
        description,
        fileUrl: blob.url,
        duration,
        category,
        tags,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      broll: brollEntry,
      message: 'B-roll video uploaded successfully'
    });

  } catch (error) {
    console.error('B-roll upload failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid metadata', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'B-roll upload endpoint',
    usage: 'POST with multipart/form-data containing file and metadata',
    example: {
      file: 'video file',
      metadata: JSON.stringify({
        name: 'City Timelapse',
        description: 'Fast-paced urban scenes',
        category: 'urban',
        tags: ['city', 'fast', 'energy'],
        duration: 30
      })
    }
  });
}
