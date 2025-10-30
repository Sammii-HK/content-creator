import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for incoming webhook data from your social media scheduler
const MetricsWebhookSchema = z.object({
  videoId: z.string(),
  platform: z.string(),
  postId: z.string(),
  metrics: z.object({
    views: z.number().optional(),
    likes: z.number().optional(),
    shares: z.number().optional(),
    comments: z.number().optional(),
    completionRate: z.number().optional(), // 0-100
    engagement: z.number().optional(), // Calculated engagement score
    timestamp: z.string().datetime()
  }),
  apiKey: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, platform, postId, metrics: incomingMetrics, apiKey } = MetricsWebhookSchema.parse(body);

    // Verify API key
    if (apiKey !== process.env.ANALYTICS_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the video
    const video = await db.video.findUnique({
      where: { id: videoId },
      include: { metrics: true }
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Calculate engagement score if not provided
    let engagement = incomingMetrics.engagement;
    if (!engagement && incomingMetrics.views && incomingMetrics.views > 0) {
      const likes = incomingMetrics.likes || 0;
      const shares = incomingMetrics.shares || 0;
      const comments = incomingMetrics.comments || 0;
      
      // Simple engagement calculation
      engagement = ((likes + shares * 2 + comments * 3) / incomingMetrics.views) * 100;
    }

    // Update or create metrics
    const metricsData = {
      views: incomingMetrics.views,
      likes: incomingMetrics.likes,
      shares: incomingMetrics.shares,
      comments: incomingMetrics.comments,
      completionRate: incomingMetrics.completionRate,
      engagement,
      actualScore: engagement // Set actual score to engagement for now
    };

    if (video.metrics) {
      // Update existing metrics
      await db.metrics.update({
        where: { videoId },
        data: metricsData
      });
    } else {
      // Create new metrics
      await db.metrics.create({
        data: {
          ...metricsData,
          videoId
        }
      });
    }

    // Update template performance if this video used a template
    if (video.templateId) {
      await import('@/lib/templates').then(({ templateService }) => 
        templateService.updateTemplatePerformance(video.templateId!)
      );
    }

    // Add to content queue if not already posted
    const existingQueueItem = await db.contentQueue.findFirst({
      where: {
        videoId,
        platform,
        status: 'posted'
      }
    });

    if (!existingQueueItem) {
      await db.contentQueue.create({
        data: {
          videoId,
          platform,
          postId,
          status: 'posted',
          scheduledAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Metrics updated successfully',
      engagement
    });

  } catch (error) {
    console.error('Metrics sync failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid webhook data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch metrics for analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (videoId) {
      // Get metrics for specific video
      const video = await db.video.findUnique({
        where: { id: videoId },
        include: {
          metrics: true,
          template: true
        }
      });

      if (!video) {
        return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ video });
    } else {
      // Get all videos with metrics
      const videos = await db.video.findMany({
        include: {
          metrics: true,
          template: true
        },
        where: {
          metrics: { isNot: null }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await db.video.count({
        where: {
          metrics: { isNot: null }
        }
      });

      // Calculate aggregate metrics
      const totalViews = videos.reduce((sum, v) => sum + (v.metrics?.views || 0), 0);
      const totalLikes = videos.reduce((sum, v) => sum + (v.metrics?.likes || 0), 0);
      const avgEngagement = videos.reduce((sum, v) => sum + (v.metrics?.engagement || 0), 0) / videos.length;

      return NextResponse.json({
        videos,
        aggregates: {
          totalVideos: videos.length,
          totalViews,
          totalLikes,
          avgEngagement,
          avgCompletionRate: videos.reduce((sum, v) => sum + (v.metrics?.completionRate || 0), 0) / videos.length
        },
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
    }

  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
