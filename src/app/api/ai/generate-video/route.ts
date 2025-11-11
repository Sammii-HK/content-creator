import { NextRequest, NextResponse } from 'next/server';
import { aiVideoGenerator } from '@/lib/ai-video-generator';
import { db } from '@/lib/db';
import { requirePersona } from '@/lib/persona-context';
import { z } from 'zod';

const AIVideoRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  duration: z.number().min(5).max(60).default(30),
  style: z.enum(['text-to-video', 'avatar', 'product-demo', 'hybrid']),
  videoId: z.string().optional(), // For hybrid videos using existing footage
  productName: z.string().optional(),
  productDescription: z.string().optional(),
  keyFeatures: z.array(z.string()).optional(),
  avatarImage: z.string().optional(),
  personaId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      duration, 
      style, 
      videoId, 
      productName, 
      productDescription, 
      keyFeatures,
      avatarImage,
      personaId
    } = AIVideoRequestSchema.parse(body);

    console.log('🎬 AI generating video:', { style, duration, prompt: prompt.slice(0, 50) });

    await requirePersona(personaId);

    let videoGeneration;

    switch (style) {
      case 'text-to-video':
        videoGeneration = await aiVideoGenerator.generateVideoFromText({
          prompt,
          duration,
          style,
          personaId
        });
        break;

      case 'avatar':
        if (!avatarImage) {
          return NextResponse.json(
            { error: 'Avatar image is required for avatar videos' },
            { status: 400 }
          );
        }
        videoGeneration = await aiVideoGenerator.generateAvatarVideoScript(
          prompt,
          {
            personaId
          },
          duration
        );
        break;

      case 'product-demo':
        if (!productName || !productDescription || !keyFeatures) {
          return NextResponse.json(
            { error: 'Product name, description, and key features are required' },
            { status: 400 }
          );
        }
        videoGeneration = await aiVideoGenerator.generateProductDemoVideo(
          productName,
          productDescription,
          keyFeatures,
          duration,
          personaId
        );
        break;

      case 'hybrid':
        if (!videoId) {
          return NextResponse.json(
            { error: 'Video ID is required for hybrid videos' },
            { status: 400 }
          );
        }

        // Get video segments (any quality, we'll work with what's available)
        const video = await db.broll.findFirst({
          where: { id: videoId, personaId },
          include: {
            segments: {
              where: { isUsable: true },
              orderBy: { quality: 'desc' }
            }
          }
        });

        if (!video) {
          return NextResponse.json(
            { error: 'Video not found' },
            { status: 404 }
          );
        }

        if (video.segments.length === 0) {
          return NextResponse.json(
            { error: 'No segments found for this video. Create segments first by going to the video editor.' },
            { status: 400 }
          );
        }

        videoGeneration = await aiVideoGenerator.generateHybridVideo(
          video.segments,
          prompt,
          duration,
          personaId
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid video style' },
          { status: 400 }
        );
    }

    // Estimate costs and requirements
    const requirements = {
      textToVideo: style === 'text-to-video' ? 'Runway ML or Pika Labs API' : null,
      avatar: style === 'avatar' ? 'HeyGen or Synthesia API' : null,
      voiceover: 'ElevenLabs or OpenAI TTS',
      editing: 'FFmpeg for final composition',
      estimatedCost: getEstimatedCost(style, duration)
    };

    return NextResponse.json({
      success: true,
      videoGeneration,
      requirements,
      metadata: {
        style,
        duration,
        prompt,
        generatedAt: new Date().toISOString(),
        readyForProduction: style === 'hybrid' // Hybrid can be produced immediately
      },
      nextSteps: getNextSteps(style)
    });

  } catch (error) {
    console.error('❌ AI video generation failed:', error);
    return NextResponse.json(
      { 
        error: 'Video generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getEstimatedCost(style: string, duration: number): string {
  switch (style) {
    case 'text-to-video': return `$0.50-2.00 (${duration}s video)`;
    case 'avatar': return `$0.20-1.00 (${duration}s avatar)`;
    case 'product-demo': return '$0.10-0.50 (mostly editing)';
    case 'hybrid': return '$0.05-0.20 (using existing footage)';
    default: return '$0.10-0.50';
  }
}

function getNextSteps(style: string): string[] {
  switch (style) {
    case 'text-to-video':
      return [
        'Set up Runway ML or Pika Labs API',
        'Generate video scenes from descriptions',
        'Combine scenes with FFmpeg',
        'Add voiceover and music'
      ];
    case 'avatar':
      return [
        'Set up HeyGen or Synthesia API',
        'Upload your photo for avatar creation',
        'Generate talking avatar video',
        'Add background and branding'
      ];
    case 'product-demo':
      return [
        'Upload product images',
        'Create 3D scenes or mockups',
        'Add product to virtual environments',
        'Generate demo animations'
      ];
    case 'hybrid':
      return [
        'Video plan ready for production',
        'Use existing FFmpeg system',
        'Combine real footage with AI elements',
        'Ready to create immediately'
      ];
    default:
      return ['Plan generated', 'Ready for implementation'];
  }
}
