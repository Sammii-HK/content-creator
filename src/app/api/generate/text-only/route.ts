import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { llmService } from '@/lib/llm';
import { templateService } from '@/lib/templates';
import { requireAuth } from '@/lib/auth';
import { requirePersona } from '@/lib/persona-context';
import { digitalMeService } from '@/lib/digitalMe';
import { z } from 'zod';

const GenerateTextOnlySchema = z.object({
  theme: z.string().min(1, 'Theme is required'),
  tone: z.enum(['energetic', 'calm', 'mysterious', 'educational', 'funny', 'inspiring']).optional(),
  duration: z.number().min(5).max(30).optional(),
  templateId: z.string().optional(),
  includeTrends: z.boolean().optional().default(true),
  generateVariants: z.number().min(1).max(5).optional().default(1),
  personaId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const {
      theme,
      tone = 'energetic',
      duration = 10,
      templateId,
      includeTrends,
      generateVariants,
      personaId
    } = GenerateTextOnlySchema.parse(body);

    // Validate persona if provided
    if (personaId) {
      await requirePersona(personaId);
    }

    console.log(`🤖 Generating text content for theme: ${theme}`);

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

    // Process each variant (text only, no video rendering)
    for (let i = 0; i < contentVariants.length; i++) {
      const content = contentVariants[i];
      
      try {
        // Create mock features for now
        const features = {
          hookStrength: content.hook.length < 50 ? 1 : 0.5,
          contentLength: content.content.length,
          hashtags: content.hashtags,
          toneScore: 75, // Mock score
          avgBrightness: 60,
          avgContrast: 55,
          motionLevel: 70,
          colorVariance: 65,
          textCoverage: 25
        };

        // Save to database (without video rendering)
        const video = await db.video.create({
          data: {
            theme: `${theme} - Text Only ${i + 1}`,
            tone: content.tone,
            duration,
            hookLines: [content.hook],
            caption: content.caption,
            templateId: template.id,
            brollId: null, // No B-roll used
            fileUrl: '', // No video file generated
            userId: user.id,
            features
          }
        });

        results.push({
          id: video.id,
          content,
          features,
          templateUsed: template.name,
          status: 'text-only-generation',
          message: 'Content generated successfully - video rendering requires B-roll content'
        });

      } catch (error) {
        console.error('Text generation failed for variant', i, error);
        results.push({
          error: 'Text generation failed',
          content,
          templateUsed: template.name
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      trendsUsed: trends,
      templateUsed: template.name,
      message: 'Text content generated successfully. Upload B-roll content to enable video rendering.',
      nextSteps: [
        'Add real B-roll videos via /dashboard/content',
        'Test full video generation via /api/generate',
        'Set up Cloudflare Workers for automation'
      ]
    });

  } catch (error) {
    console.error('Text generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
