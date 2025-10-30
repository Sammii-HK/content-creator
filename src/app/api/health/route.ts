import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest) {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;
    
    // Get system stats
    const stats = {
      totalVideos: await db.video.count(),
      totalTemplates: await db.template.count({ where: { isActive: true } }),
      totalBroll: await db.broll.count({ where: { isActive: true } }),
      recentTrends: await db.trend.count({
        where: {
          collectedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      activeABTests: await db.abTest.count({ where: { status: 'active' } })
    };

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      stats
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
