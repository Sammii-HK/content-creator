import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { llmService } from '@/lib/llm';
import { videoRenderer } from '@/lib/video';
import { templateService } from '@/lib/templates';
import { z } from 'zod';

const ABTestRequestSchema = z.object({
  name: z.string().min(1, 'Test name is required'),
  theme: z.string().min(1, 'Theme is required'),
  variantCount: z.number().min(2).max(5).default(2),
  duration: z.number().min(5).max(30).optional().default(10),
  templateId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, theme, variantCount, duration, templateId } = ABTestRequestSchema.parse(body);

    console.log(`🧪 Starting A/B test: ${name} with ${variantCount} variants`);

    // Create A/B test record
    const abTest = await db.abTest.create({
      data: {
        name,
        description: `A/B test for theme: ${theme}`,
        status: 'active'
      }
    });

    // Get template
    let template;
    if (templateId) {
      template = await templateService.getTemplate(templateId);
    } else {
      const bestTemplates = await templateService.getBestTemplates(1);
      template = bestTemplates[0];
    }

    if (!template) {
      return NextResponse.json(
        { error: 'No template available' },
        { status: 404 }
      );
    }

    // Get B-roll
    const availableBroll = await db.broll.findMany({
      where: { isActive: true }
    });
    
    if (availableBroll.length === 0) {
      return NextResponse.json(
        { error: 'No B-roll available' },
        { status: 404 }
      );
    }

    // Generate content variants using LLM
    const contentVariants = await llmService.generateVariants({
      theme,
      duration
    }, variantCount);

    const variants = [];

    // Create video for each variant
    for (let i = 0; i < contentVariants.length; i++) {
      const content = contentVariants[i];
      const broll = availableBroll[i % availableBroll.length]; // Rotate through B-roll

      try {
        // Render video
        const videoUrl = await videoRenderer.renderVideo({
          template: template.json as any,
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

        // Extract features
        const features = await videoRenderer.extractFeatures(videoUrl);

        // Save video to database
        const video = await db.video.create({
          data: {
            theme: `${theme} - Variant ${i + 1}`,
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
              hookStrength: content.hook.length < 50 ? 1 : 0.5,
              contentLength: content.content.length,
              variantNumber: i + 1
            }
          }
        });

        // Create A/B test variant
        const variant = await db.abTestVariant.create({
          data: {
            testId: abTest.id,
            name: `Variant ${i + 1}`,
            videoId: video.id,
            isControl: i === 0 // First variant is control
          }
        });

        variants.push({
          variant,
          video,
          content,
          videoUrl
        });

      } catch (renderError) {
        console.error(`Failed to create variant ${i + 1}:`, renderError);
      }
    }

    return NextResponse.json({
      success: true,
      abTest,
      variants,
      message: `A/B test created with ${variants.length} variants`
    });

  } catch (error) {
    console.error('A/B test creation failed:', error);
    
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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const abTests = await db.abTest.findMany({
      where,
      include: {
        variants: {
          include: {
            video: {
              include: {
                metrics: true
              }
            }
          }
        }
      },
      orderBy: { startDate: 'desc' },
      take: limit,
      skip: offset
    });

    // Calculate results for each test
    const testsWithResults = abTests.map(test => {
      const variants = test.variants.map(variant => {
        const metrics = variant.video.metrics;
        return {
          ...variant,
          performance: {
            views: metrics?.views || 0,
            likes: metrics?.likes || 0,
            engagement: metrics?.engagement || 0,
            completionRate: metrics?.completionRate || 0
          }
        };
      });

      // Find winning variant
      const winner = variants.reduce((best, current) => 
        (current.performance.engagement > best.performance.engagement) ? current : best
      );

      return {
        ...test,
        variants,
        winner: winner ? {
          variantId: winner.id,
          variantName: winner.name,
          improvement: variants.find(v => v.isControl) 
            ? ((winner.performance.engagement - variants.find(v => v.isControl)!.performance.engagement) / variants.find(v => v.isControl)!.performance.engagement * 100)
            : 0
        } : null
      };
    });

    const total = await db.abTest.count({ where });

    return NextResponse.json({
      abTests: testsWithResults,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Failed to fetch A/B tests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
