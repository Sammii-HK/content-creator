import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePersona } from '@/lib/persona-context';
import { z } from 'zod';

const CosmicReportRequestSchema = z.object({
  personaId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includeMetrics: z.boolean().optional().default(true),
  includeContent: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const {
      personaId,
      startDate,
      endDate,
      includeMetrics = true,
      includeContent = true,
    } = CosmicReportRequestSchema.parse(body);

    // Validate persona if provided
    if (personaId) {
      await requirePersona(personaId);
    }

    console.log('📊 Generating cosmic report:', {
      userId: user.id,
      personaId,
      startDate,
      endDate,
    });

    // Build date filter
    const dateFilter: {
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.lte = new Date(endDate);
      }
    }

    // Build persona filter
    const where: Record<string, unknown> = {
      userId: user.id,
      ...dateFilter,
    };

    if (personaId) {
      where.personaId = personaId;
    }

    // Gather report data
    const report: Record<string, unknown> = {
      generatedAt: new Date().toISOString(),
      userId: user.id,
      personaId: personaId || null,
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
    };

    if (includeMetrics) {
      // Get video metrics
      const videos = await db.video.findMany({
        where,
        include: {
          metrics: true,
          template: true,
          broll: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalVideos = videos.length;
      const videosWithMetrics = videos.filter((v) => v.metrics);
      const totalViews = videosWithMetrics.reduce((sum, v) => sum + (v.metrics?.views || 0), 0);
      const totalEngagement = videosWithMetrics.reduce(
        (sum, v) => sum + (v.metrics?.engagement || 0),
        0
      );
      const avgEngagement =
        videosWithMetrics.length > 0 ? totalEngagement / videosWithMetrics.length : 0;

      report.metrics = {
        totalVideos,
        videosWithMetrics: videosWithMetrics.length,
        totalViews,
        averageEngagement: avgEngagement,
        topPerformers: videos
          .filter((v) => (v.metrics?.engagement ?? 0) >= 75)
          .slice(0, 5)
          .map((v) => ({
            id: v.id,
            caption: v.caption?.substring(0, 100),
            engagement: v.metrics?.engagement,
            views: v.metrics?.views,
          })),
      };
    }

    if (includeContent) {
      // Get templates
      const templates = await db.template.findMany({
        where: personaId ? { personaId } : { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Get b-roll
      const broll = await db.broll.findMany({
        where: personaId ? { personaId } : { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      report.content = {
        templates: templates.length,
        recentTemplates: templates.slice(0, 5).map((t) => {
          let duration: number | null = null;
          if (t.json && typeof t.json === 'object' && !Array.isArray(t.json)) {
            const maybeDuration = (t.json as Record<string, unknown>).duration;
            if (typeof maybeDuration === 'number') {
              duration = maybeDuration;
            }
          }

          return {
            id: t.id,
            name: t.name,
            duration,
          };
        }),
        broll: broll.length,
        recentBroll: broll.slice(0, 5).map((b) => ({
          id: b.id,
          name: b.name,
          category: b.category,
        })),
      };
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('❌ Cosmic report generation failed:', error);

    // Handle authentication errors (403 Forbidden)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        { status: 403 }
      );
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle persona not found errors
    if (
      error instanceof Error &&
      (error.message.includes('personaId') || error.message.includes('No voice profile found'))
    ) {
      return NextResponse.json(
        {
          error: 'Persona not found',
          message: error.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Report generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
