import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate upload token for client-side blob upload
 * This bypasses the serverless function size limits
 */
export async function POST(request: NextRequest) {
  try {
    const { filename, contentType } = await request.json();
    
    console.log('Generating upload token for:', { filename, contentType });

    // Generate a simple upload token (in production, you'd validate permissions here)
    const uploadToken = {
      url: `https://blob.vercel-storage.com`,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      pathname: `broll/${Date.now()}-${filename}`,
      contentType: contentType || 'video/quicktime'
    };

    return NextResponse.json({
      success: true,
      uploadToken,
      message: 'Upload token generated for large file'
    });

  } catch (error) {
    console.error('Token generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload token' },
      { status: 500 }
    );
  }
}
