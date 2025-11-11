import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiTemplateMatcher } from '@/lib/ai-template-matcher';
import { requirePersona } from '@/lib/persona-context';
import { z } from 'zod';

const TemplateSuggestionSchema = z.object({
  videoId: z.string(),
  personaId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const { videoId, personaId } = TemplateSuggestionSchema.parse(await request.json());

    console.log('🤖 Getting AI template suggestions for video:', videoId);

    await requirePersona(personaId);

    // Get video and segments
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
        { error: 'No usable segments found. Create some segments first.' },
        { status: 400 }
      );
    }

    // Convert to AI format
    const segments = video.segments.map(s => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      quality: s.quality,
      description: s.description || '',
      isUsable: s.isUsable
    }));

    const videoContext = {
      name: video.name,
      duration: video.duration,
      category: video.category || 'general'
    };

    // Get AI recommendations
    const recommendations = await aiTemplateMatcher.analyzeSegmentsForTemplates(
      segments,
      videoContext
    );

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        name: video.name,
        duration: video.duration,
        segmentCount: segments.length
      },
      recommendations,
      message: `Found ${recommendations.length} template recommendations`
    });

  } catch (error) {
    console.error('❌ AI template suggestion failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate template suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
