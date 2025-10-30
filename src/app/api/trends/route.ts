import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');

    let trends;
    
    if (category) {
      trends = await db.trend.findMany({
        where: { 
          category,
          collectedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { popularity: 'desc' },
        take: limit
      });
    } else {
      trends = await db.trend.findMany({
        orderBy: { popularity: 'desc' },
        take: limit,
        where: {
          collectedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });
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

export async function POST(_request: NextRequest) {
  try {
    // This endpoint is called by Cloudflare Workers to trigger trend collection
    // For now, just return success - the actual collection happens in Cloudflare Workers
    
    return NextResponse.json({
      success: true,
      message: 'Trend collection trigger received - processing via Cloudflare Workers'
    });

  } catch (error) {
    console.error('Trend collection trigger failed:', error);
    return NextResponse.json(
      { error: 'Trend collection trigger failed' },
      { status: 500 }
    );
  }
}
