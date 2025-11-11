import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { llmService } from '@/lib/llm';
import { videoRenderer, type VideoTemplate } from '@/lib/video';
import { templateService } from '@/lib/templates';
import { requirePersona } from '@/lib/persona-context';
import { digitalMeService } from '@/lib/digitalMe';
import { z } from 'zod';

const GenerateRequestSchema = z.object({
  theme: z.string().min(1, 'Theme is required'),
  tone: z.enum(['energetic', 'calm', 'mysterious', 'educational', 'funny', 'inspiring']).optional(),
  duration: z.number().min(5).max(30).optional(),
  templateId: z.string().optional(),
  brollId: z.string().optional(),
  includeTrends: z.boolean().optional().default(true),
  generateVariants: z.number().min(1).max(5).optional().default(1),
  personaId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      theme,
      tone = 'energetic',
      duration = 10,
      templateId,
      brollId,
      includeTrends,
      generateVariants,
      personaId
    } = GenerateRequestSchema.parse(body);

    // Validate persona if provided
    if (personaId) {
      await requirePersona(personaId);
    }

    // Get trending topics if requested
    let trends: string[] = [];
    if (includeTrends) {
      const recentTrends = await db.trend.findMany({
        orderBy: { popularity: 'desc' },
        take: 5,
        where: {
          collectedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });
      trends = recentTrends.map(t => t.tag);
    }

    // Get performance context for LLM
    const highPerformingVideos = await db.video.findMany({
      include: { metrics: true },
      where: {
        metrics: {
          engagement: { gte: 75 } // High engagement threshold
        }
      },
      orderBy: {
        metrics: { engagement: 'desc' }
      },
      take: 3
    });

    const lowPerformingVideos = await db.video.findMany({
      include: { metrics: true },
      where: {
        metrics: {
          engagement: { lte: 25 } // Low engagement threshold
        }
      },
      orderBy: {
        metrics: { engagement: 'asc' }
      },
      take: 3
    });

    const previousPerformance = {
      highPerforming: highPerformingVideos.map(v => v.caption),
      lowPerforming: lowPerformingVideos.map(v => v.caption)
    };

    // Determine template to use
    let template;
    if (templateId) {
      template = await templateService.getTemplate(templateId);
    } else {
      // Use best performing template
      const bestTemplates = await templateService.getBestTemplates();
      template = bestTemplates[0];
    }

    if (!template) {
      return NextResponse.json(
        { error: 'No template available' },
        { status: 404 }
      );
    }

    // Get B-roll video
    let broll;
    if (brollId) {
      broll = await db.broll.findUnique({ where: { id: brollId } });
    } else {
      // Select random B-roll that matches theme/category
      const availableBroll = await db.broll.findMany({
        where: { isActive: true }
      });
      broll = availableBroll[Math.floor(Math.random() * availableBroll.length)];
    }

    if (!broll) {
      return NextResponse.json(
        { error: 'No B-roll available' },
        { status: 404 }
      );
    }

    // Generate content variants with persona context
    let contentVariants;
    if (personaId) {
      // Use persona-aware generation
      contentVariants = generateVariants > 1 
        ? await Promise.all(
            Array.from({ length: generateVariants }, () =>
              digitalMeService.generateAuthenticContent(
                `${theme} content in ${tone} tone`,
                { theme, targetDuration: duration },
                personaId
              )
            )
          )
        : [await digitalMeService.generateAuthenticContent(
            `${theme} content in ${tone} tone`,
            { theme, targetDuration: duration },
            personaId
          )];
    } else {
      // Use generic generation
      contentVariants = generateVariants > 1 
        ? await llmService.generateVariants({
            theme,
            tone,
            duration,
            trends,
            previousPerformance
          }, generateVariants)
        : [await llmService.generateVideoContent({
            theme,
            tone,
            duration,
            trends,
            previousPerformance
          })];
    }

    const results = [];

    // Process each variant
    for (let i = 0; i < contentVariants.length; i++) {
      const content = contentVariants[i];
      
      try {
        // Render video
        const videoUrl = await videoRenderer.renderVideo({
          template: template.json as unknown as VideoTemplate,
          brollPath: broll.fileUrl,
          content: {
            hook: content.hook,
            content: content.content,
            title: content.hook,
            question: content.hook,
            answer: content.content,
            items: content.content
          }
        });

        // Extract visual features for ML
        const features = await videoRenderer.extractFeatures(videoUrl);

        // Save to database
        const video = await db.video.create({
          data: {
            theme,
            tone: content.tone,
            duration,
            hookLines: [content.hook],
            caption: content.caption,
            templateId: template.id,
            brollId: broll.id,
            fileUrl: videoUrl,
            features: {
              ...features,
              hashtags: content.hashtags,
              hookStrength: content.hook.length < 50 ? 1 : 0.5, // Simple hook strength metric
              contentLength: content.content.length
            }
          }
        });

        results.push({
          id: video.id,
          videoUrl,
          content,
          features,
          templateUsed: template.name,
          brollUsed: broll.name
        });

      } catch (renderError) {
        console.error('Video rendering failed for variant', i, renderError);
        // Continue with other variants
        results.push({
          error: 'Rendering failed',
          content,
          templateUsed: template.name,
          brollUsed: broll.name
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      trendsUsed: trends,
      templateUsed: template.name,
      brollUsed: broll.name
    });

  } catch (error) {
    console.error('Generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get recent generations
    const videos = await db.video.findMany({
      include: {
        template: true,
        broll: true,
        metrics: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await db.video.count();

    return NextResponse.json({
      videos,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Failed to fetch generations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
