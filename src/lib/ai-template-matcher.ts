import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for template recommendations
const TemplateRecommendationSchema = z.object({
  recommendations: z.array(z.object({
    templateType: z.enum(['instagram-reel', 'youtube-short', 'tiktok-video', 'twitter-video']),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    requiredSegments: z.array(z.object({
      type: z.enum(['hook', 'main-content', 'transition', 'cta', 'b-roll']),
      duration: z.number(),
      minQuality: z.number().min(1).max(10),
      description: z.string()
    }))
  }))
});

const SegmentAnalysisSchema = z.object({
  segments: z.array(z.object({
    id: z.string(),
    type: z.enum(['hook', 'main-content', 'transition', 'cta', 'b-roll', 'filler']),
    mood: z.enum(['energetic', 'calm', 'professional', 'casual', 'dramatic']),
    usabilityScore: z.number().min(0).max(10),
    bestUseCase: z.string(),
    tags: z.array(z.string())
  }))
});

export interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
  quality: number;
  description: string;
  isUsable: boolean;
}

export interface TemplateMatch {
  templateType: string;
  confidence: number;
  reasoning: string;
  requiredSegments: {
    type: string;
    duration: number;
    minQuality: number;
    description: string;
  }[];
  matchedSegments?: VideoSegment[];
}

export class AITemplateMatcher {
  private model = openai('gpt-4o-mini');

  /**
   * Analyze video segments and suggest optimal templates
   */
  async analyzeSegmentsForTemplates(
    segments: VideoSegment[],
    videoContext: {
      name: string;
      duration: number;
      category: string;
    }
  ): Promise<TemplateMatch[]> {
    console.log('🤖 AI analyzing segments for template matching...');

    try {
      // First, analyze what type of content each segment contains
      const segmentAnalysis = await this.analyzeSegmentContent(segments, videoContext);

      // Then get template recommendations based on available content
      const templateRecs = await this.getTemplateRecommendations(segmentAnalysis, videoContext);

      // Match segments to template requirements
      const matches = templateRecs.recommendations.map(rec => ({
        ...rec,
        matchedSegments: this.matchSegmentsToTemplate(segments, rec.requiredSegments)
      }));

      console.log('✅ AI template analysis complete:', matches.length, 'recommendations');
      return matches;

    } catch (error) {
      console.error('❌ AI template matching failed:', error);
      throw error;
    }
  }

  /**
   * Analyze what type of content each segment contains
   */
  private async analyzeSegmentContent(segments: VideoSegment[], videoContext: any) {
    const segmentDescriptions = segments.map(s => ({
      id: s.id,
      timeRange: `${s.startTime.toFixed(1)}s-${s.endTime.toFixed(1)}s`,
      duration: s.endTime - s.startTime,
      quality: s.quality,
      description: s.description
    }));

    const result = await generateObject({
      model: this.model,
      schema: SegmentAnalysisSchema,
      prompt: `Analyze these video segments and categorize each one:

Video Context:
- Name: ${videoContext.name}
- Category: ${videoContext.category}
- Total Duration: ${videoContext.duration}s

Segments to analyze:
${JSON.stringify(segmentDescriptions, null, 2)}

For each segment, determine:
1. Content type (hook, main-content, transition, cta, b-roll, filler)
2. Mood/energy level
3. Usability score (0-10 based on description and quality)
4. Best use case for content creation
5. Relevant tags

Focus on identifying segments that would work well as:
- Hooks (attention-grabbing openings)
- Main content (core message/value)
- Transitions (smooth connections)
- CTAs (calls to action)
- B-roll (supporting visuals)`
    });

    return result.object;
  }

  /**
   * Get template recommendations based on analyzed segments
   */
  private async getTemplateRecommendations(segmentAnalysis: any, videoContext: any) {
    const availableContent = segmentAnalysis.segments.map((s: any) => ({
      type: s.type,
      duration: s.duration,
      quality: s.usabilityScore,
      mood: s.mood
    }));

    const result = await generateObject({
      model: this.model,
      schema: TemplateRecommendationSchema,
      prompt: `Based on the available video segments, recommend optimal video templates:

Available Content:
${JSON.stringify(availableContent, null, 2)}

Video Context: ${videoContext.name} (${videoContext.category})

Recommend 2-3 template types that would work best with this content. For each template:
1. Choose template type (instagram-reel, youtube-short, tiktok-video, twitter-video)
2. Rate confidence (0-1) based on content availability
3. Explain reasoning
4. Define required segments with specific duration and quality needs

Consider:
- Instagram Reels: 15-30s, need strong hook + main content + CTA
- YouTube Shorts: 15-60s, more educational/storytelling format
- TikTok: 15-30s, trend-focused, energetic
- Twitter: 15-45s, news/opinion format

Only recommend templates where we have sufficient quality content available.`
    });

    return result.object;
  }

  /**
   * Match available segments to template requirements
   */
  private matchSegmentsToTemplate(
    segments: VideoSegment[],
    requirements: any[]
  ): VideoSegment[] {
    const matched: VideoSegment[] = [];
    
    for (const req of requirements) {
      // Find best segment for this requirement
      const candidates = segments.filter(s => 
        s.isUsable && 
        s.quality >= req.minQuality &&
        Math.abs((s.endTime - s.startTime) - req.duration) <= 3 // Within 3 seconds
      );

      if (candidates.length > 0) {
        // Pick highest quality segment
        const best = candidates.reduce((a, b) => a.quality > b.quality ? a : b);
        matched.push(best);
      }
    }

    return matched;
  }

  /**
   * Generate template JSON using AI
   */
  async generateTemplateFromDescription(
    description: string,
    availableSegments: VideoSegment[]
  ): Promise<any> {
    console.log('🤖 AI generating template from description...');

    const segmentSummary = availableSegments.map(s => ({
      duration: s.endTime - s.startTime,
      quality: s.quality,
      description: s.description
    }));

    const result = await generateObject({
      model: this.model,
      schema: z.object({
        template: z.object({
          name: z.string(),
          description: z.string(),
          totalDuration: z.number(),
          scenes: z.array(z.object({
            duration: z.number(),
            type: z.string(),
            textOverlay: z.string().optional(),
            position: z.object({
              x: z.number(),
              y: z.number()
            }).optional(),
            transition: z.string().optional()
          }))
        })
      }),
      prompt: `Create a video template JSON based on this description: "${description}"

Available segments:
${JSON.stringify(segmentSummary, null, 2)}

Generate a template that:
1. Uses the available segments effectively
2. Includes text overlays and positioning
3. Has smooth transitions between scenes
4. Matches the described style and duration
5. Is optimized for social media engagement

The template should be practical and achievable with the available content.`
    });

    return result.object.template;
  }
}

export const aiTemplateMatcher = new AITemplateMatcher();
