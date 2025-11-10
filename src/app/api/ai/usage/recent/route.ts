import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('📝 Fetching recent AI usage...');

    // For now, return empty usage since we just set up the system
    const usage: any[] = [];

    return NextResponse.json({
      success: true,
      usage,
      count: usage.length,
      message: usage.length === 0 ? 'No usage data yet. Start generating images to see usage here.' : `Found ${usage.length} recent requests`
    });

  } catch (error) {
    console.error('❌ Failed to fetch recent usage:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch recent usage',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
