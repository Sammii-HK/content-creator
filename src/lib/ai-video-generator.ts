import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

// Schema for AI video generation requests
const VideoGenerationSchema = z.object({
  scenes: z.array(z.object({
    description: z.string(),
    duration: z.number(),
    style: z.enum(['realistic', 'animated', 'product-demo', 'avatar']),
    elements: z.array(z.string()).optional()
  })),
  voiceover: z.object({
    script: z.array(z.string()),
    tone: z.string(),
    pace: z.enum(['slow', 'normal', 'fast'])
  }).optional(),
  music: z.object({
    mood: z.string(),
    energy: z.enum(['low', 'medium', 'high'])
  }).optional()
});

export interface AIVideoRequest {
  prompt: string;
  duration: number;
  style: 'text-to-video' | 'avatar' | 'product-demo' | 'hybrid';
  voiceProfile?: string;
  productImages?: string[];
  avatarImage?: string;
}

export class AIVideoGenerator {
  private model = openai('gpt-4o-mini');

  /**
   * Generate video plan from text description
   */
  async generateVideoFromText(request: AIVideoRequest): Promise<any> {
    console.log('🤖 Generating AI video from text:', request.prompt);

    const result = await generateObject({
      model: this.model,
      schema: VideoGenerationSchema,
      prompt: `Create a detailed video generation plan for: "${request.prompt}"

Requirements:
- Duration: ${request.duration} seconds
- Style: ${request.style}
- Platform: Social media (vertical format preferred)

Generate a plan with:
1. Scene-by-scene breakdown with descriptions
2. Timing for each scene
3. Visual style and elements needed
4. Voiceover script if needed
5. Music/audio suggestions

For ${request.style} style:
${this.getStyleGuidelines(request.style)}

Make it engaging for social media with strong hooks and clear messaging.`
    });

    return result.object;
  }

  /**
   * Create avatar video script
   */
  async generateAvatarVideoScript(
    prompt: string,
    voiceProfile?: string,
    duration: number = 30
  ): Promise<any> {
    console.log('👤 Generating avatar video script...');

    const voiceContext = voiceProfile 
      ? `Use this voice profile: ${voiceProfile}` 
      : 'Use a professional, engaging tone';

    const result = await generateText({
      model: this.model,
      prompt: `Create a ${duration}-second video script for an AI avatar to deliver.

Topic: ${prompt}
${voiceContext}

Requirements:
- Natural, conversational delivery
- Engaging hook in first 3 seconds
- Clear, concise messaging
- Strong call-to-action at end
- Suitable for AI avatar presentation

Format as speaking script with timing cues.`
    });

    return {
      script: result.text,
      duration,
      type: 'avatar',
      suggestions: {
        avatar: 'professional-casual',
        background: 'clean-office',
        gestures: 'natural-moderate'
      }
    };
  }

  /**
   * Generate product demo video plan
   */
  async generateProductDemoVideo(
    productName: string,
    productDescription: string,
    keyFeatures: string[],
    duration: number = 30
  ): Promise<any> {
    console.log('📦 Generating product demo video plan...');

    const result = await generateObject({
      model: this.model,
      schema: VideoGenerationSchema,
      prompt: `Create a product demo video plan for: ${productName}

Product Description: ${productDescription}
Key Features: ${keyFeatures.join(', ')}
Duration: ${duration} seconds

Create scenes that:
1. Hook viewers immediately (product in action)
2. Showcase key features visually
3. Demonstrate real use cases
4. End with strong CTA

Include:
- Product placement suggestions
- Camera angles and movements
- Text overlays for features
- Background/environment suggestions

Make it feel natural and engaging, not like an advertisement.`
    });

    return result.object;
  }

  /**
   * Hybrid generation: Combine real footage + AI elements
   */
  async generateHybridVideo(
    realSegments: any[],
    aiPrompt: string,
    duration: number = 30
  ): Promise<any> {
    console.log('🔀 Generating hybrid video plan with', realSegments.length, 'segments...');

    if (realSegments.length === 0) {
      throw new Error('No segments available. Create segments first in the video editor.');
    }

    const segmentSummary = realSegments.map(s => ({
      duration: (s.endTime - s.startTime).toFixed(1),
      description: s.description,
      quality: s.quality,
      timeRange: `${s.startTime.toFixed(1)}s-${s.endTime.toFixed(1)}s`
    }));

    const totalFootageDuration = realSegments.reduce((acc, s) => acc + (s.endTime - s.startTime), 0);

    const result = await generateText({
      model: this.model,
      prompt: `Create a hybrid video plan using REAL FOOTAGE + AI elements.

AVAILABLE REAL FOOTAGE (${realSegments.length} segments):
${JSON.stringify(segmentSummary, null, 2)}

Total available footage: ${totalFootageDuration.toFixed(1)} seconds
Target video duration: ${duration} seconds

AI Request: ${aiPrompt}

Create a detailed plan that:
1. Uses the REAL FOOTAGE segments effectively
2. Adds AI elements (voiceover, text overlays, transitions, background music)
3. Creates a cohesive ${duration}-second video
4. Includes specific timing for each segment
5. Suggests AI enhancements for each part

Format as a production timeline with:
- Real footage usage (which segments, when)
- AI voiceover script suggestions  
- Text overlay recommendations
- Transition effects
- Background music mood

Make it clear this uses EXISTING footage + AI enhancements.`
    });

    return {
      plan: result.text,
      realSegments: realSegments.length,
      totalFootageDuration: totalFootageDuration.toFixed(1),
      availableSegments: segmentSummary,
      aiElements: ['voiceover', 'text-overlays', 'transitions', 'background-music'],
      estimatedCost: `$0.05-0.20 (${realSegments.length} segments + AI)`,
      readyForProduction: true
    };
  }

  private getStyleGuidelines(style: string): string {
    switch (style) {
      case 'text-to-video':
        return 'Generate realistic video scenes using AI. Focus on clear visuals and smooth motion.';
      case 'avatar':
        return 'Create script for AI avatar presentation. Professional but engaging delivery.';
      case 'product-demo':
        return 'Showcase product features clearly. Use clean backgrounds and good lighting.';
      case 'hybrid':
        return 'Combine real footage with AI elements seamlessly. Maintain visual consistency.';
      default:
        return 'Create engaging social media content optimized for mobile viewing.';
    }
  }
}

export const aiVideoGenerator = new AIVideoGenerator();
