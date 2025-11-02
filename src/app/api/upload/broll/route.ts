import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { z } from 'zod';
import { llmService } from '@/lib/llm';

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
    } catch (parseError) {
      return NextResponse.json(
        { 
          error: 'Invalid metadata format', 
          details: 'Metadata must be valid JSON',
          received: formData.get('metadata')
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

    // Validate file type (iPhone compatible)
    const validVideoTypes = [
      'video/mp4', 'video/mov', 'video/quicktime', 
      'video/x-msvideo', 'video/webm', 'video/avi',
      'video/hevc', 'video/h264' // iPhone formats
    ];
    
    const isValidVideo = file.type.startsWith('video/') || 
                        validVideoTypes.includes(file.type) ||
                        file.name.toLowerCase().match(/\.(mp4|mov|avi|webm|m4v)$/);
    
    if (!isValidVideo) {
      return NextResponse.json(
        { 
          error: 'Invalid video format', 
          details: `Received: ${file.type}. Supported: MP4, MOV, AVI, WebM`,
          fileName: file.name
        },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(`broll/${Date.now()}-${file.name}`, file, {
      access: 'public',
      contentType: file.type,
    });

    // Detect video duration using file size estimation (serverless-friendly)
    const fileSizeMB = file.size / (1024 * 1024);
    const detectedDuration = Math.max(5, Math.min(300, Math.round(fileSizeMB * 8))); // ~8 seconds per MB for mobile video

    // Auto-generate tags using AI if description is provided
    let autoTags = tags;
    if (description && description.length > 10) {
      try {
        const tagSuggestions = await llmService.generateVideoTags(description, name);
        autoTags = [...tags, ...tagSuggestions].filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates
      } catch (error) {
        console.log('Tag generation failed, using provided tags:', error);
      }
    }

    // Auto-categorize based on name and tags
    const autoCategory = category || detectCategory(name, autoTags);

    // Save to database
    const brollEntry = await db.broll.create({
      data: {
        name,
        description,
        fileUrl: blob.url,
        duration: detectedDuration,
        category: autoCategory,
        tags: autoTags,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      broll: brollEntry,
      analysis: {
        detectedDuration,
        autoCategory,
        generatedTags: autoTags.length > tags.length ? autoTags.slice(tags.length) : [],
        originalTags: tags,
        totalTags: autoTags.length
      },
      message: 'Video uploaded and analyzed successfully',
      cost: autoTags.length > tags.length ? '~$0.0001' : '$0.00'
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
