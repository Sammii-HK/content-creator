import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for social media post analysis
const PostAnalysisSchema = z.object({
  content: z.object({
    hook: z.string().describe('Opening line or attention grabber'),
    body: z.string().describe('Main content text'),
    caption: z.string().describe('Full caption text'),
    hashtags: z.array(z.string()).describe('Hashtags used'),
    callToAction: z.string().optional().describe('Call to action if present')
  }),
  style: z.object({
    tone: z.enum(['professional', 'casual', 'inspiring', 'educational', 'funny', 'authentic', 'energetic']),
    writingStyle: z.enum(['conversational', 'formal', 'storytelling', 'list-based', 'question-driven']),
    personality: z.array(z.string()).describe('Personality traits evident in the post'),
    emotionalTone: z.enum(['positive', 'neutral', 'motivational', 'empathetic', 'excited'])
  }),
  engagement: z.object({
    estimatedAppeal: z.number().min(1).max(10).describe('Estimated audience appeal (1-10)'),
    contentType: z.enum(['educational', 'entertainment', 'promotional', 'personal', 'behind-scenes']),
    targetAudience: z.string().describe('Who this content is aimed at'),
    engagementTriggers: z.array(z.string()).describe('Elements that drive engagement')
  }),
  themes: z.array(z.string()).describe('Main themes and topics covered')
});

export interface SocialMediaPost {
  url?: string;
  platform: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  publishedAt?: Date;
}

export interface PostLearningResult {
  content: any;
  style: any;
  engagement: any;
  themes: string[];
  voiceCharacteristics: string[];
  recommendedPersonaTraits: string[];
}

export class SocialMediaLearner {
  private model = openai('gpt-4o-mini');

  /**
   * Extract content from social media URL
   */
  async extractFromURL(url: string): Promise<SocialMediaPost> {
    console.log('📱 Extracting content from URL:', url);

    // Detect platform
    const platform = this.detectPlatform(url);
    
    try {
      // For now, we'll use a simple approach
      // In production, you'd use platform APIs or web scraping
      const response = await fetch('/api/social-media/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform })
      });

      if (response.ok) {
        const data = await response.json();
        return data.post;
      } else {
        throw new Error('Failed to extract post content');
      }
    } catch (error) {
      // Fallback: Manual input
      console.warn('URL extraction failed, using manual input:', error);
      return {
        platform,
        content: 'Manual input required - paste post content',
        url
      };
    }
  }

  /**
   * Analyze social media post for persona learning
   */
  async analyzePost(post: SocialMediaPost): Promise<PostLearningResult> {
    console.log('🧠 Analyzing post for persona learning...');

    const result = await generateObject({
      model: this.model,
      schema: PostAnalysisSchema,
      prompt: `Analyze this social media post to understand the creator's voice and style:

Platform: ${post.platform}
Content: ${post.content}
${post.engagement ? `Engagement: ${post.engagement.likes} likes, ${post.engagement.comments} comments` : ''}

Analyze:
1. Content structure (hook, body, CTA)
2. Writing style and tone
3. Personality traits evident in the writing
4. Engagement potential and triggers
5. Target audience and content type
6. Main themes and topics

Focus on identifying what makes this creator's voice unique and authentic.
Extract patterns that could be used to train an AI persona.`
    });

    const analysis = result.object;

    return {
      content: analysis.content,
      style: analysis.style,
      engagement: analysis.engagement,
      themes: analysis.themes,
      voiceCharacteristics: [
        analysis.style.tone,
        analysis.style.writingStyle,
        ...analysis.style.personality
      ],
      recommendedPersonaTraits: [
        `${analysis.style.tone} tone`,
        `${analysis.style.writingStyle} writing style`,
        `${analysis.engagement.contentType} content focus`,
        ...analysis.style.personality.slice(0, 3)
      ]
    };
  }

  /**
   * Learn from multiple posts to create persona profile
   */
  async learnFromMultiplePosts(posts: SocialMediaPost[]): Promise<any> {
    console.log('📚 Learning from', posts.length, 'posts...');

    const analyses = await Promise.all(
      posts.map(post => this.analyzePost(post))
    );

    // Aggregate insights
    const allThemes = analyses.flatMap(a => a.themes);
    const allVoiceCharacteristics = analyses.flatMap(a => a.voiceCharacteristics);
    const allPersonaTraits = analyses.flatMap(a => a.recommendedPersonaTraits);

    // Count frequencies
    const themeFrequency = this.countFrequency(allThemes);
    const voiceFrequency = this.countFrequency(allVoiceCharacteristics);
    const traitFrequency = this.countFrequency(allPersonaTraits);

    return {
      summary: `Analyzed ${posts.length} posts across ${new Set(posts.map(p => p.platform)).size} platforms`,
      topThemes: Object.keys(themeFrequency).slice(0, 5),
      dominantVoice: Object.keys(voiceFrequency)[0],
      keyPersonaTraits: Object.keys(traitFrequency).slice(0, 8),
      platformDistribution: this.getPlatformDistribution(posts),
      avgEngagementScore: analyses.reduce((acc, a) => acc + a.engagement.estimatedAppeal, 0) / analyses.length,
      contentTypeBreakdown: this.getContentTypeBreakdown(analyses),
      voiceConsistency: this.calculateVoiceConsistency(analyses)
    };
  }

  /**
   * Import posts from Succulent account groups
   */
  async importFromSucculent(accountGroupId: string, limit: number = 20): Promise<SocialMediaPost[]> {
    console.log('🌱 Importing posts from Succulent account group:', accountGroupId);

    try {
      const response = await fetch('/api/succulent/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountGroupId, limit })
      });

      if (response.ok) {
        const data = await response.json();
        return data.posts || [];
      } else {
        throw new Error('Failed to import from Succulent');
      }
    } catch (error) {
      console.error('Succulent import failed:', error);
      throw error;
    }
  }

  /**
   * Process uploaded screenshot for content extraction
   */
  async analyzeScreenshot(imageUrl: string): Promise<SocialMediaPost> {
    console.log('📸 Analyzing screenshot for content extraction...');

    try {
      const response = await fetch('/api/social-media/screenshot-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      });

      if (response.ok) {
        const data = await response.json();
        return data.extractedPost;
      } else {
        throw new Error('Failed to analyze screenshot');
      }
    } catch (error) {
      console.error('Screenshot analysis failed:', error);
      throw error;
    }
  }

  private detectPlatform(url: string): string {
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('linkedin.com')) return 'linkedin';
    return 'unknown';
  }

  private countFrequency(items: string[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getPlatformDistribution(posts: SocialMediaPost[]) {
    const platforms = posts.map(p => p.platform);
    return this.countFrequency(platforms);
  }

  private getContentTypeBreakdown(analyses: PostLearningResult[]) {
    const contentTypes = analyses.map(a => a.engagement.contentType);
    return this.countFrequency(contentTypes);
  }

  private calculateVoiceConsistency(analyses: PostLearningResult[]): number {
    const tones = analyses.map(a => a.style.tone);
    const uniqueTones = new Set(tones).size;
    return Math.max(0, (1 - (uniqueTones - 1) / tones.length)) * 100;
  }
}

export const socialMediaLearner = new SocialMediaLearner();
