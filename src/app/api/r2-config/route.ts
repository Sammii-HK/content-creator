import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.CLOUDFLARE_R2_API_TOKEN;
  
  if (!token) {
    return NextResponse.json(
      { error: 'R2 API token not configured' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    token,
    bucketUrl: 'https://pub-8b8b71f14a6347adbfbed072ddad9828.r2.dev'
  });
}
