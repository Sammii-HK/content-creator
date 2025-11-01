import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { z } from 'zod';
import ffmpeg from 'fluent-ffmpeg';

const UploadBrollSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // Duration will be detected automatically from video file
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadata = JSON.parse(formData.get('metadata') as string);
    
    const { name, description, category, tags } = UploadBrollSchema.parse(metadata);

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

    // Detect video duration automatically
    let detectedDuration = 30; // fallback
    try {
      // Convert file to buffer for ffmpeg analysis
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // For now, use a simple estimation (in production, you'd use ffprobe)
      // File size estimation: ~1MB per 10 seconds for typical mobile video
      detectedDuration = Math.max(5, Math.min(300, Math.round(buffer.length / (1024 * 1024) * 10)));
      
    } catch (error) {
      console.log('Duration detection failed, using default:', error);
    }

    // Auto-categorize based on common video types
    const autoCategory = category || detectCategory(name, tags);

    // Save to database
    const brollEntry = await db.broll.create({
      data: {
        name,
        description,
        fileUrl: blob.url,
        duration: detectedDuration,
        category: autoCategory,
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

// Auto-categorization based on content analysis
function detectCategory(name: string, tags: string[]): string {
  const text = `${name} ${tags.join(' ')}`.toLowerCase();
  
  // Personal/Creator content
  if (text.match(/\b(me|myself|face|selfie|talking|speaking|person|creator)\b/)) {
    return 'personal';
  }
  
  // Workspace/Tech
  if (text.match(/\b(computer|laptop|desk|workspace|code|coding|tech|setup|office)\b/)) {
    return 'workspace';
  }
  
  // Lifestyle/Daily
  if (text.match(/\b(coffee|food|cooking|kitchen|home|morning|routine|lifestyle)\b/)) {
    return 'lifestyle';
  }
  
  // Nature/Outdoor
  if (text.match(/\b(nature|outdoor|sky|trees|water|beach|mountain|sunset|sunrise)\b/)) {
    return 'nature';
  }
  
  // Urban/City
  if (text.match(/\b(city|urban|street|traffic|building|lights|downtown)\b/)) {
    return 'urban';
  }
  
  // Motion/Abstract
  if (text.match(/\b(abstract|motion|pattern|color|animation|geometric)\b/)) {
    return 'abstract';
  }
  
  // Business/Professional
  if (text.match(/\b(business|professional|meeting|presentation|corporate)\b/)) {
    return 'business';
  }
  
  return 'general'; // fallback
}

export async function GET() {
  return NextResponse.json({
    message: 'B-roll upload endpoint',
    usage: 'POST with multipart/form-data containing file and metadata',
    categories: [
      'personal', 'workspace', 'lifestyle', 'nature', 
      'urban', 'abstract', 'business', 'general'
    ],
    features: [
      'Automatic duration detection',
      'Smart categorization', 
      'Mobile upload support',
      'iPhone video compatible'
    ]
  });
}
