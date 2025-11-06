import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { digitalMeService } from '@/lib/digitalMe';
import { aiTemplateMatcher } from '@/lib/ai-template-matcher';
import { z } from 'zod';

const ContentGenerationRequestSchema = z.object({
  videoId: z.string(),
  templateType: z.enum(['instagram-reel', 'youtube-short', 'tiktok-video', 'twitter-video']).optional(),
  prompt: z.string().min(1, 'Content prompt is required'),
  customRequirements: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, templateType, prompt, customRequirements } = ContentGenerationRequestSchema.parse(body);

    console.log('🤖 AI generating complete content for video:', videoId);

    // Get video and segments
    const video = await db.broll.findUnique({
      where: { id: videoId },
      include: {
        segments: {
          where: { isUsable: true, quality: { gte: 6 } }, // Only high-quality segments
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
        { error: 'No high-quality segments found. Create segments with rating 6+ first.' },
        { status: 400 }
      );
    }

    // Get AI template suggestions if no template specified
    let selectedTemplate: string = templateType || 'instagram-reel';
    let templateMatch = null;

    if (!templateType) {
      const segments = video.segments.map(s => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        quality: s.quality,
        description: s.description || '',
        isUsable: s.isUsable
      }));

      const recommendations = await aiTemplateMatcher.analyzeSegmentsForTemplates(
        segments,
        {
          name: video.name,
          duration: video.duration,
          category: video.category || 'general'
        }
      );

      if (recommendations.length > 0) {
        templateMatch = recommendations[0]; // Best recommendation
        selectedTemplate = templateMatch.templateType;
      }
    }

    // Generate authentic script using Digital Me
    const voiceContent = await digitalMeService.generateAuthenticContent(
      prompt,
      {
        theme: customRequirements || video.category || undefined,
        targetDuration: getTemplateDuration(selectedTemplate),
        platform: selectedTemplate.split('-')[0] as any
      }
    );

    // Select best segments for the template
    const selectedSegments = selectSegmentsForTemplate(video.segments, selectedTemplate);

    // Create content plan
    const contentPlan = {
      video: {
        id: video.id,
        name: video.name,
        duration: video.duration
      },
      template: {
        type: selectedTemplate,
        confidence: templateMatch?.confidence || 0.8,
        reasoning: templateMatch?.reasoning || 'Manual selection'
      },
      script: voiceContent,
      segments: selectedSegments.map(s => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.endTime - s.startTime,
        quality: s.quality,
        usage: 'main-content' // Could be enhanced with AI segment analysis
      })),
      timeline: createTimeline(selectedSegments, voiceContent, selectedTemplate)
    };

    return NextResponse.json({
      success: true,
      contentPlan,
      message: `AI generated ${selectedTemplate} content using ${selectedSegments.length} segments`,
      metadata: {
        totalDuration: selectedSegments.reduce((acc, s) => acc + (s.endTime - s.startTime), 0),
        averageQuality: selectedSegments.reduce((acc, s) => acc + s.quality, 0) / selectedSegments.length,
        voiceAuthenticity: 'high', // Could be calculated
        templateMatch: templateMatch?.confidence || 0.8
      }
    });

  } catch (error) {
    console.error('❌ AI content generation failed:', error);
    return NextResponse.json(
      { 
        error: 'Content generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getTemplateDuration(templateType: string): number {
  switch (templateType) {
    case 'instagram-reel': return 30;
    case 'tiktok-video': return 15;
    case 'youtube-short': return 60;
    case 'twitter-video': return 30;
    default: return 30;
  }
}

function selectSegmentsForTemplate(segments: any[], templateType: string): any[] {
  const targetDuration = getTemplateDuration(templateType);
  
  // Sort by quality and select best segments that fit duration
  const sortedSegments = segments.sort((a, b) => b.quality - a.quality);
  const selected = [];
  let totalDuration = 0;

  for (const segment of sortedSegments) {
    const segmentDuration = segment.endTime - segment.startTime;
    if (totalDuration + segmentDuration <= targetDuration) {
      selected.push(segment);
      totalDuration += segmentDuration;
    }
    
    if (totalDuration >= targetDuration * 0.8) break; // 80% of target duration
  }

  return selected;
}

function createTimeline(segments: any[], voiceContent: any, templateType: string) {
  const timeline = [];
  let currentTime = 0;

  // Add hook
  timeline.push({
    startTime: currentTime,
    endTime: currentTime + 3,
    type: 'text-overlay',
    content: voiceContent.hook,
    position: { x: 0.5, y: 0.3 }
  });

  // Add segments with script overlays
  segments.forEach((segment, index) => {
    const segmentDuration = segment.endTime - segment.startTime;
    
    timeline.push({
      startTime: currentTime,
      endTime: currentTime + segmentDuration,
      type: 'video-segment',
      segmentId: segment.id,
      sourceStart: segment.startTime,
      sourceEnd: segment.endTime
    });

    // Add script line if available
    if (voiceContent.script[index]) {
      timeline.push({
        startTime: currentTime + 1,
        endTime: currentTime + segmentDuration - 1,
        type: 'text-overlay',
        content: voiceContent.script[index],
        position: { x: 0.5, y: 0.7 }
      });
    }

    currentTime += segmentDuration;
  });

  // Add CTA if available
  if (voiceContent.callToAction) {
    timeline.push({
      startTime: currentTime - 3,
      endTime: currentTime,
      type: 'text-overlay',
      content: voiceContent.callToAction,
      position: { x: 0.5, y: 0.8 }
    });
  }

  return timeline;
}
