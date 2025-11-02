import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing R2 configuration...');
    
    // Test R2 bucket accessibility
    const accountId = 'aa2113b6e9c4e8181f42c2f7f46891f1';
    const bucketName = 'smart-content-videos';
    const bucketUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`;
    
    console.log('R2 bucket URL:', bucketUrl);
    
    // Test if bucket is accessible
    const testResponse = await fetch(`${bucketUrl}/test-file.txt`, {
      method: 'HEAD'
    });
    
    console.log('R2 bucket test response:', {
      status: testResponse.status,
      headers: Object.fromEntries(testResponse.headers.entries())
    });

    return NextResponse.json({
      bucketUrl,
      bucketAccessible: testResponse.status !== 404,
      responseStatus: testResponse.status,
      message: 'R2 configuration test completed'
    });

  } catch (error) {
    console.error('R2 test failed:', error);
    return NextResponse.json(
      { 
        error: 'R2 test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
