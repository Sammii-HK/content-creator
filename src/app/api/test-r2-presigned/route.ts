import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing R2 presigned URL generation...');

    // Test presigned URL generation
    const testResponse = await fetch(`${request.nextUrl.origin}/api/r2/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: 'test-video.mp4',
        fileType: 'video/mp4',
        fileSize: 1024000 // 1MB test file
      })
    });

    if (!testResponse.ok) {
      const error = await testResponse.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json({
        success: false,
        error: 'Presigned URL generation failed',
        details: error,
        status: testResponse.status
      });
    }

    const presignedData = await testResponse.json();

    return NextResponse.json({
      success: true,
      message: '✅ R2 presigned URL generation working correctly!',
      data: {
        hasUploadUrl: !!presignedData.uploadUrl,
        hasPublicUrl: !!presignedData.publicUrl,
        hasKey: !!presignedData.key,
        expiresIn: presignedData.expiresIn,
        publicUrl: presignedData.publicUrl
      },
      environmentCheck: {
        accountId: !!process.env.CLOUDFLARE_R2_ACCOUNT_ID,
        accessKeyId: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        bucketName: !!process.env.CLOUDFLARE_R2_BUCKET_NAME,
        publicUrl: !!process.env.CLOUDFLARE_R2_PUBLIC_URL
      }
    });

  } catch (error) {
    console.error('R2 presigned URL test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      environmentCheck: {
        accountId: !!process.env.CLOUDFLARE_R2_ACCOUNT_ID,
        accessKeyId: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        bucketName: !!process.env.CLOUDFLARE_R2_BUCKET_NAME,
        publicUrl: !!process.env.CLOUDFLARE_R2_PUBLIC_URL
      }
    }, { status: 500 });
  }
}
