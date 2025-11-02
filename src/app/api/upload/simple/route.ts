import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';

/**
 * Simple upload endpoint for iPhone compatibility
 * Minimal validation, maximum compatibility
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string || file.name;
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('Simple upload - File info:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Very permissive file validation
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File appears to be empty' },
        { status: 400 }
      );
    }

    if (file.size > 500 * 1024 * 1024) { // 500MB limit
      return NextResponse.json(
        { error: 'File too large (max 500MB)' },
        { status: 400 }
      );
    }

    try {
      // Upload to Vercel Blob with minimal processing
      const fileName = `${Date.now()}-${file.name}`;
      const blob = await put(`broll/simple/${fileName}`, file, {
        access: 'public',
        contentType: file.type || 'video/mp4',
      });

      // Estimate duration from file size (very rough)
      const fileSizeMB = file.size / (1024 * 1024);
      const estimatedDuration = Math.max(5, Math.min(300, Math.round(fileSizeMB * 6)));

      // Auto-detect category from name/description
      const autoCategory = detectSimpleCategory(name, description);

      // Create basic B-roll entry
      const brollEntry = await db.broll.create({
        data: {
          name: name.replace(/\.[^/.]+$/, ""), // Remove extension
          description: description || `Uploaded from mobile: ${file.name}`,
          fileUrl: blob.url,
          duration: estimatedDuration,
          category: autoCategory,
          tags: [autoCategory, 'mobile-upload'],
          isActive: true
        }
      });

      return NextResponse.json({
        success: true,
        broll: brollEntry,
        message: 'Video uploaded successfully via simple upload',
        info: {
          originalFileName: file.name,
          detectedDuration: estimatedDuration,
          category: autoCategory,
          uploadMethod: 'simple'
        }
      });

    } catch (uploadError) {
      console.error('Blob upload failed:', uploadError);
      return NextResponse.json(
        { 
          error: 'Upload to storage failed', 
          details: uploadError instanceof Error ? uploadError.message : 'Unknown storage error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Simple upload failed:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Try the main upload page or convert video to MP4'
      },
      { status: 500 }
    );
  }
}

// Simple category detection
function detectSimpleCategory(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();
  
  if (text.match(/\b(me|myself|face|selfie|talking|speaking)\b/)) return 'personal';
  if (text.match(/\b(desk|computer|laptop|office|work)\b/)) return 'workspace';
  if (text.match(/\b(coffee|food|kitchen|home|morning)\b/)) return 'lifestyle';
  if (text.match(/\b(outside|nature|sky|tree|water)\b/)) return 'nature';
  if (text.match(/\b(city|street|building|urban)\b/)) return 'urban';
  
  return 'general';
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple upload endpoint for maximum iPhone compatibility',
    usage: 'POST with multipart/form-data: file, name, description',
    features: [
      'Minimal validation for iPhone compatibility',
      'Automatic duration estimation',
      'Simple category detection',
      'No AI analysis (faster, free)'
    ]
  });
}
