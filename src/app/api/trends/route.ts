import { NextRequest, NextResponse } from 'next/server';
import { trendFetcher } from '@/workers/trendFetcher';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');

    let trends;
    
    if (category) {
      trends = await trendFetcher.getTrendsByCategory(category, limit);
    } else {
      trends = await trendFetcher.getCurrentTrends(limit);
    }

    return NextResponse.json({
      trends,
      total: trends.length
    });

  } catch (error) {
    console.error('Failed to fetch trends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Manual trigger for trend collection
    await trendFetcher.fetchAllTrends();

    return NextResponse.json({
      success: true,
      message: 'Trend collection completed'
    });

  } catch (error) {
    console.error('Trend collection failed:', error);
    return NextResponse.json(
      { error: 'Trend collection failed' },
      { status: 500 }
    );
  }
}
