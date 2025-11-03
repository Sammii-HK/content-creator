import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Production R2 Debug Test ===');
    
    // Check environment variables
    const envCheck = {
      accountId: !!process.env.CLOUDFLARE_R2_ACCOUNT_ID,
      accessKeyId: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      bucketName: !!process.env.CLOUDFLARE_R2_BUCKET_NAME,
      publicUrl: !!process.env.CLOUDFLARE_R2_PUBLIC_URL,
    };

    console.log('Environment variables present:', envCheck);

    // Check lengths (safely)
    const lengths = {
      accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID?.length || 0,
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.length || 0,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.length || 0,
      bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME?.length || 0,
      publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL?.length || 0,
    };

    console.log('Environment variable lengths:', lengths);

    if (!envCheck.accountId || !envCheck.accessKeyId || !envCheck.secretAccessKey || !envCheck.bucketName) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        envCheck,
        lengths,
        message: 'Some required R2 environment variables are not set in production'
      });
    }

    // Test S3 client creation
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

    console.log('S3 client created successfully');

    // Test with a small upload
    const testKey = `test/prod-debug-${Date.now()}.txt`;
    const testContent = 'Production R2 test - ' + new Date().toISOString();

    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });

    console.log('Attempting test upload:', { key: testKey, bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME });

    await s3Client.send(command);

    console.log('✅ Test upload successful');

    return NextResponse.json({
      success: true,
      message: '✅ Production R2 credentials are working correctly!',
      envCheck,
      lengths,
      testUpload: {
        key: testKey,
        url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${testKey}`
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Production R2 test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Production R2 test failed',
      details: error.message,
      errorType: error.name,
      envCheck: {
        accountId: !!process.env.CLOUDFLARE_R2_ACCOUNT_ID,
        accessKeyId: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        bucketName: !!process.env.CLOUDFLARE_R2_BUCKET_NAME,
        publicUrl: !!process.env.CLOUDFLARE_R2_PUBLIC_URL,
      },
      lengths: {
        accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID?.length || 0,
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.length || 0,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.length || 0,
        bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME?.length || 0,
        publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL?.length || 0,
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
