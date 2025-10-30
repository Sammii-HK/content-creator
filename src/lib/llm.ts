import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

// Schema for video content generation
const VideoContentSchema = z.object({
  hook: z.string().describe('Attention-grabbing opening line (5-10 words)'),
  content: z.string().describe('Main content text for the video'),
  caption: z.string().describe('Social media caption with hashtags'),
  tone: z.enum(['energetic', 'calm', 'mysterious', 'educational', 'funny', 'inspiring']),
  hashtags: z.array(z.string()).describe('Relevant hashtags without # symbol'),
});

const TemplateRefinementSchema = z.object({
  changes: z.array(z.object({
    field: z.string(),
    oldValue: z.unknown(),
    newValue: z.unknown(),
    reason: z.string()
  })),
  explanation: z.string()
});

export interface GenerationOptions {
  theme: string;
  tone?: string;
  duration?: number;
  trends?: string[];
  previousPerformance?: {
    highPerforming: string[];
    lowPerforming: string[];
  };
}

export class LLMService {
  private model = openai('gpt-4o-mini');

  /**
   * Generate video content including hook, main content, and caption
   */
  async generateVideoContent(options: GenerationOptions) {
    const { theme, tone = 'energetic', duration = 10, trends = [], previousPerformance } = options;

    const trendContext = trends.length > 0 
      ? `Current trending topics: ${trends.join(', ')}. `
      : '';

    const performanceContext = previousPerformance 
      ? `High-performing content examples: ${previousPerformance.highPerforming.join(', ')}. Avoid patterns from low-performing content: ${previousPerformance.lowPerforming.join(', ')}. `
      : '';

    const prompt = `Create engaging short-form video content for social media.

Theme: ${theme}
Tone: ${tone}
Duration: ${duration} seconds
${trendContext}${performanceContext}

Requirements:
- Hook must grab attention in first 2 seconds
- Content should be concise and valuable
- Caption should include 5-10 relevant hashtags
- Optimize for ${duration}-second vertical video format
- Use conversational, engaging language
- Include a subtle call-to-action

Focus on creating content that stops the scroll and encourages engagement.`;

    const result = await generateObject({
      model: this.model,
      schema: VideoContentSchema,
      prompt,
    });

    return result.object;
  }

  /**
   * Generate multiple content variants for A/B testing
   */
  async generateVariants(options: GenerationOptions, count: number = 3) {
    const variants = await Promise.all(
      Array.from({ length: count }, (_, i) => 
        this.generateVideoContent({
          ...options,
          // Add slight variation prompts
          theme: `${options.theme} (Variant ${i + 1}: ${['direct', 'storytelling', 'question-based'][i] || 'creative'})`
        })
      )
    );

    return variants;
  }

  /**
   * Analyze and classify trending topics
   */
  async classifyTrends(trends: string[]) {
    const prompt = `Analyze these trending topics and classify them by mood and category:

Trends: ${trends.join(', ')}

For each trend, determine:
1. Mood (curious, excited, peaceful, motivated, etc.)
2. Category (technology, lifestyle, entertainment, education, etc.)
3. Content opportunity score (1-10)

Return analysis for content creation strategy.`;

    const result = await generateText({
      model: this.model,
      prompt,
    });

    return result.text;
  }

  /**
   * Refine template based on performance feedback
   */
  async refineTemplate(templateJson: unknown, performanceData: {
    avgEngagement: number;
    topPerformingVideos: unknown[];
    lowPerformingVideos: unknown[];
  }) {
    const prompt = `Analyze this video template and suggest improvements based on performance data.

Current Template:
${JSON.stringify(templateJson, null, 2)}

Performance Data:
- Average Engagement: ${performanceData.avgEngagement}
- Top Performing Videos: ${performanceData.topPerformingVideos.length} videos
- Low Performing Videos: ${performanceData.lowPerformingVideos.length} videos

Suggest specific changes to:
1. Text positioning and timing
2. Visual filters and effects
3. Scene transitions
4. Font sizes and styles

Focus on data-driven improvements that could increase engagement.`;

    const result = await generateObject({
      model: this.model,
      schema: TemplateRefinementSchema,
      prompt,
    });

    return result.object;
  }

  /**
   * Generate content based on specific template structure
   */
  async generateForTemplate(templateName: string, options: GenerationOptions) {
    const templatePrompts = {
      'Hook + Facts': 'Create a strong hook followed by interesting facts',
      'Question + Answer': 'Start with an intriguing question, then provide the answer',
      'Countdown List': 'Create a numbered list with countdown format',
    };

    const specificPrompt = templatePrompts[templateName as keyof typeof templatePrompts] || 
      'Create engaging content for this template';

    return this.generateVideoContent({
      ...options,
      theme: `${options.theme} - ${specificPrompt}`
    });
  }

  /**
   * Optimize content for specific platforms
   */
  async optimizeForPlatform(content: unknown, platform: 'tiktok' | 'instagram' | 'youtube') {
    const platformGuidelines = {
      tiktok: 'TikTok: Use trending sounds, hashtag challenges, quick cuts, vertical format',
      instagram: 'Instagram: Aesthetic visuals, story-driven, use Reels features',
      youtube: 'YouTube Shorts: Clear thumbnails, strong hooks, educational value'
    };

    const prompt = `Optimize this content for ${platform}:

Original Content:
${JSON.stringify(content, null, 2)}

Platform Guidelines: ${platformGuidelines[platform]}

Adjust the content to maximize performance on ${platform} while maintaining the core message.`;

    const result = await generateObject({
      model: this.model,
      schema: VideoContentSchema,
      prompt,
    });

    return result.object;
  }
}

export const llmService = new LLMService();
