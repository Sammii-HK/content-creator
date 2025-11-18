import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { requirePersona } from '@/lib/persona-context';
import { db } from '@/lib/db';
import { videoRenderer, VideoSegmentRange, VideoTemplate } from '@/lib/video';

const SegmentSchema = z.object({
  id: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  adjustedStartTime: z.number().optional(),
  adjustedEndTime: z.number().optional(),
  quality: z.number().optional(),
});

const TimelineItemSchema = z.object({
  type: z.enum(['video-segment', 'text-overlay']),
  startTime: z.number(),
  endTime: z.number(),
  content: z.string().optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  segmentId: z.string().optional(),
  sourceStart: z.number().optional(),
  sourceEnd: z.number().optional(),
});

const VideoCreationRequestSchema = z.object({
  personaId: z.string(),
  videoId: z.string(),
  segments: z.array(SegmentSchema).min(1),
  timeline: z.array(TimelineItemSchema),
  script: z.any().optional(),
  template: z
    .object({
      type: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { personaId, videoId, segments, timeline, script, template } =
      VideoCreationRequestSchema.parse(body);

    await requirePersona(personaId);

    const broll = await db.broll.findFirst({
      where: {
        id: videoId,
        userId: user.id,
      },
    });

    if (!broll) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const normalizedSegments: VideoSegmentRange[] = segments
      .map((segment) => {
        const start =
          typeof segment.adjustedStartTime === 'number'
            ? segment.adjustedStartTime
            : segment.startTime;
        const end =
          typeof segment.adjustedEndTime === 'number' ? segment.adjustedEndTime : segment.endTime;

        const safeStart = Math.max(0, Math.min(start, broll.duration));
        const safeEnd = Math.max(safeStart + 0.05, Math.min(end, broll.duration));
        return {
          sourceStart: safeStart,
          sourceEnd: safeEnd,
        };
      })
      .filter((segment) => segment.sourceEnd - segment.sourceStart > 0.05);

    if (normalizedSegments.length === 0) {
      return NextResponse.json(
        { error: 'No valid segments to render. Adjust timestamps and try again.' },
        { status: 400 }
      );
    }

    const timelineDuration = timeline.reduce((max, item) => Math.max(max, item.endTime || 0), 0);
    const fallbackDuration = normalizedSegments.reduce(
      (acc, item) => acc + (item.sourceEnd - item.sourceStart),
      0
    );
    const totalDuration = Math.max(5, Math.ceil(timelineDuration || fallbackDuration));

    const overlayScenes = timeline
      .filter((item) => item.type === 'text-overlay' && item.content)
      .map((item, index) => ({
        start: item.startTime,
        end: item.endTime,
        text: {
          id: `overlay-${index}`,
          content: item.content || '',
          position: item.position || { x: 0.5, y: 0.75 },
          style: {
            fontSize: 56,
            fontWeight: '700',
            color: '#ffffff',
            stroke: '#000000',
            strokeWidth: 2,
            background: 'rgba(0,0,0,0.35)',
            backgroundRadius: 16,
            lineHeightMultiplier: 1.35,
          },
        },
      }));

    const derivedTemplate: VideoTemplate = {
      name: template?.type || 'ai-studio',
      duration: totalDuration,
      scenes: overlayScenes,
      textStyle: {
        fontSize: 52,
        fontWeight: '700',
        color: '#ffffff',
        background: 'rgba(0,0,0,0.3)',
        backgroundRadius: 14,
      },
    };

    const templateContent: Record<string, string> = {
      hook: script?.hook || '',
      caption: script?.caption || '',
      callToAction: script?.callToAction || '',
    };

    if (Array.isArray(script?.script)) {
      templateContent.content = script.script.join(' ');
      script.script.forEach((line: string, index: number) => {
        templateContent[`line${index + 1}`] = line;
      });
    } else if (typeof script?.content === 'string') {
      templateContent.content = script.content;
    }

    const videoUrl = await videoRenderer.renderMultiSegmentVideo({
      template: derivedTemplate,
      brollPath: broll.fileUrl,
      content: templateContent,
      segments: normalizedSegments,
    });

    const savedVideo = await db.video.create({
      data: {
        theme: script?.theme || 'AI Studio Plan',
        tone: script?.tone || 'authentic',
        duration: totalDuration,
        hookLines: script?.hook ? [script.hook] : [],
        caption: script?.caption || script?.content || '',
        templateId: null,
        brollId: broll.id,
        fileUrl: videoUrl,
        userId: user.id,
        personaId,
        features: {
          timelineItems: timeline.length,
          segments: normalizedSegments.length,
          templateType: derivedTemplate.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      video: savedVideo,
      videoUrl,
    });
  } catch (error) {
    console.error('Failed to create AI studio video:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Video creation failed' }, { status: 500 });
  }
}
