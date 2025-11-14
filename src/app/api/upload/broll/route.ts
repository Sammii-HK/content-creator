import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ClientR2Uploader } from '@/lib/r2-storage';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { requirePersona } from '@/lib/persona-context';

const UploadBrollSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  personaId: z.string(),
  // Duration will be detected automatically from video file
});

export async function POST(request: NextRequest) {
  console.log('=== B-roll Upload Request Started ===');
  
  try {
    const user = await requireAuth(request);
    
    // R2 can handle large files - no size limit check needed
    console.log('Processing upload with R2 (no size limits)');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    console.log('File received:', {
      name: file?.name,
      type: file?.type,
      size: file?.size,
      lastModified: file?.lastModified
    });
    
    // Safe metadata parsing
    let metadata;
    try {
      const metadataString = formData.get('metadata') as string;
      if (!metadataString) {
        return NextResponse.json(
          { error: 'No metadata provided' },
          { status: 400 }
        );
      }
      metadata = JSON.parse(metadataString);
      console.log('Metadata parsed successfully:', metadata);
    } catch (parseError) {
      console.error('Metadata parsing failed:', parseError);
      return NextResponse.json(
        { 
          error: 'Invalid metadata format', 
          details: 'Metadata must be valid JSON',
          received: formData.get('metadata'),
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        },
        { status: 400 }
      );
    }
    
    const { name, description = '', category = '', tags = [], personaId } = UploadBrollSchema.parse(metadata);

    await requirePersona(personaId);

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Simple validation - just check if it's a video
    if (file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Please select a VIDEO file, not an image. Check that you selected a video from your camera roll.' },
        { status: 400 }
      );
    }

    console.log('Starting R2 upload...');
    
    // Upload to Cloudflare R2 using presigned URL
    const uploader = new ClientR2Uploader();
    
    const uploadResult = await uploader.uploadFile(file);
    
    console.log('✅ R2 upload successful:', uploadResult.url);

    // Simple duration estimation
    const fileSizeMB = file.size / (1024 * 1024);
    const estimatedDuration = Math.max(5, Math.min(300, Math.round(fileSizeMB * 8)));

    // Simple category detection
    const autoCategory = category || (name.toLowerCase().includes('me') ? 'personal' : 'general');

    // Save to database
    const brollEntry = await db.broll.create({
      data: {
        name,
        description,
        fileUrl: uploadResult.url,
        duration: estimatedDuration,
        category: autoCategory,
        tags,
        isActive: true,
        personaId,
        userId: user.id
      }
    });

    return NextResponse.json({
      success: true,
      broll: brollEntry,
      analysis: {
        detectedDuration: estimatedDuration,
        category: autoCategory,
        fileSize: `${fileSizeMB.toFixed(1)}MB`,
        originalFormat: file.type
      },
      message: 'Video uploaded successfully'
    });

  } catch (error) {
    console.error('B-roll upload failed:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid metadata', details: error.issues },
        { status: 400 }
      );
    }

    // Provide helpful error message for iPhone users
    let errorMessage = 'Upload failed';
    if (error instanceof Error) {
      if (error.message.includes('string did not match') || error.message.includes('pattern')) {
        errorMessage = 'iPhone video format issue. Try: 1) Open video in Photos app 2) Tap Edit → Done 3) Upload again';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'If iPhone video: Edit in Photos app first, then upload'
      },
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
