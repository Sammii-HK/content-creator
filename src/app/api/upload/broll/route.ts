import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { z } from 'zod';
import { appleVideoHandler } from '@/lib/apple-video-handler';

const UploadBrollSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // Duration will be detected automatically from video file
});

export async function POST(request: NextRequest) {
  console.log('=== B-roll Upload Request Started ===');
  
  try {
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
    
    const { name, description = '', category = '', tags = [] } = UploadBrollSchema.parse(metadata);

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Use robust Apple video validation
    const validation = appleVideoHandler.validateAppleVideo(file);
    if (!validation.valid) {
      console.error('Apple video validation failed:', validation.error);
      return NextResponse.json(
        { 
          error: validation.error,
          details: `File: ${file.name}, Type: ${file.type}, Size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`,
          suggestion: 'This should work with iPhone MOV files. Please check the file.'
        },
        { status: 400 }
      );
    }

    console.log('✅ Apple video validation passed');

    console.log('Starting Vercel Blob upload...');
    
    // Process Apple video with proper handling
    const videoData = await appleVideoHandler.prepareForUpload(file, {
      name,
      description,
      category,
      tags
    });

    console.log('Apple video processed:', videoData);

    // Upload to Vercel Blob with proper content type detection
    const contentType = file.type || 'video/quicktime'; // Default for MOV files
    const blob = await put(`broll/apple/${Date.now()}-${file.name}`, file, {
      access: 'public',
      contentType,
    });
    
    console.log('✅ Blob upload successful:', blob.url);

    // Save to database with Apple video data
    const brollEntry = await db.broll.create({
      data: {
        ...videoData.uploadData,
        fileUrl: blob.url,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      broll: brollEntry,
      analysis: {
        ...videoData.videoInfo,
        category: videoData.uploadData.category,
        generatedTags: videoData.uploadData.tags,
        processingMethod: 'apple-video-handler'
      },
      message: 'Apple video uploaded and processed successfully',
      cost: '$0.00'
    });

  } catch (error) {
    console.error('B-roll upload failed:', error);
    
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
