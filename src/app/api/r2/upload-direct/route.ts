import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for R2
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== Direct R2 Upload Started ===');
    console.log('Environment check:', {
      accountId: !!process.env.CLOUDFLARE_R2_ACCOUNT_ID,
      accessKeyId: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      bucketName: !!process.env.CLOUDFLARE_R2_BUCKET_NAME,
      publicUrl: !!process.env.CLOUDFLARE_R2_PUBLIC_URL,
    });
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string || file.name;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('File received:', {
      name: fileName,
      type: file.type,
      size: file.size
    });

    // Generate unique key for the file
    const key = `videos/${Date.now()}-${fileName}`;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload directly to R2 from server (no CORS issues)
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'video/quicktime',
    });

    console.log('Uploading to R2:', { 
      bucket: bucketName, 
      key, 
      size: buffer.length,
      endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    });

    const result = await s3Client.send(command);
    console.log('S3 send result:', result);

    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

    console.log('✅ R2 upload successful:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key,
      size: file.size,
      message: 'File uploaded successfully to R2'
    });

  } catch (error) {
    console.error('Direct R2 upload failed:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
