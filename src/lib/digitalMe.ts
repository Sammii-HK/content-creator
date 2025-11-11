import { openai } from '@ai-sdk/openai';
import { embed, generateObject, generateText } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/db';
import { PersonaNotFoundError } from './persona-context';

// Schema for voice analysis
const VoiceAnalysisSchema = z.object({
  tone: z.enum(['energetic', 'calm', 'mysterious', 'educational', 'funny', 'inspiring', 'poetic', 'casual', 'professional']),
  themes: z.array(z.string()).describe('Main themes and topics'),
  writingStyle: z.object({
    sentenceLength: z.enum(['short', 'medium', 'long', 'mixed']),
    vocabulary: z.enum(['simple', 'complex', 'technical', 'creative']),
    rhythm: z.enum(['fast', 'steady', 'slow', 'varied']),
    personality: z.array(z.string()).describe('Personality traits evident in writing')
  }),
  keyPhrases: z.array(z.string()).describe('Characteristic phrases or expressions'),
  contentTypes: z.array(z.string()).describe('Types of content this person creates')
});

const ContentGenerationSchema = z.object({
  hook: z.string().describe('Attention-grabbing opening (5-10 words)'),
  script: z.array(z.string()).describe('Main content lines in your authentic voice'),
  caption: z.string().describe('Social media caption with your tone and style'),
  hashtags: z.array(z.string()).describe('Relevant hashtags without # symbol'),
  tone: z.string().describe('Overall tone of the content'),
  callToAction: z.string().optional().describe('Optional call to action in your style')
});

export interface VoiceExample {
  id: string;
  theme: string;
  tone: string;
  hook: string;
  body: string;
  caption?: string;
  tags?: string[];
  engagement?: number;
  embedding?: number[];
}

export interface VoiceProfile {
  id: string;
  summary: string;
  preferredTones: string[];
  topThemes: string[];
  lexicalTraits: any;
  updatedAt: Date;
}

export class DigitalMeService {
  private model = openai('gpt-4o-mini');
  private embeddingModel = openai.embedding('text-embedding-3-small');

  private async ensurePersona(personaId: string) {
    const persona = await db.voiceProfile.findUnique({ where: { id: personaId } });
    if (!persona) {
      throw new PersonaNotFoundError(personaId);
    }
    return persona;
  }

  /**
   * Analyze sample content to understand creator's voice
   */
  async analyzeVoiceFromSamples(samples: string[]): Promise<any> {
    console.log('🤖 Analyzing voice from', samples.length, 'samples...');

    const result = await generateObject({
      model: this.model,
      schema: VoiceAnalysisSchema,
      prompt: `Analyze these content samples to understand the creator's unique voice and style:

Content Samples:
${samples.map((sample, i) => `${i + 1}. ${sample}`).join('\n\n')}

Analyze:
1. Overall tone and mood patterns
2. Main themes and topics they discuss
3. Writing style (sentence length, vocabulary, rhythm)
4. Personality traits evident in the writing
5. Characteristic phrases or expressions they use
6. Types of content they typically create

Focus on identifying what makes this creator's voice unique and authentic.`
    });

    return result.object;
  }

  /**
   * Create embeddings for content samples
   */
  async createEmbeddings(texts: string[]): Promise<number[][]> {
    console.log('🧠 Creating embeddings for', texts.length, 'texts...');

    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const result = await embed({
        model: this.embeddingModel,
        value: text
      });
      embeddings.push(result.embedding);
    }

    return embeddings;
  }

  /**
   * Store voice examples in database
   */
  async storeVoiceExamples(
    samples: Array<{
      theme: string;
      tone: string;
      hook: string;
      body: string;
      caption?: string;
      tags?: string[];
      engagement?: number;
    }>,
    personaId: string
  ): Promise<void> {
    console.log('💾 Storing', samples.length, 'voice examples...');

    await this.ensurePersona(personaId);

    // Create embeddings for the content
    const texts = samples.map(s => `${s.hook} ${s.body}`);
    const embeddings = await this.createEmbeddings(texts);

    // Store in database
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      const embedding = embeddings[i];

      await db.voiceExample.create({
        data: {
          personaId,
          theme: sample.theme,
          tone: sample.tone,
          hook: sample.hook,
          body: sample.body,
          caption: sample.caption,
          tags: sample.tags || [],
          engagement: sample.engagement,
          embedding: embedding
        }
      });
    }

    console.log('✅ Voice examples stored successfully');
  }

  /**
   * Generate voice profile from stored examples
   */
  async generateVoiceProfile(personaId: string): Promise<VoiceProfile> {
    const persona = await this.ensurePersona(personaId);

    console.log('🧠 Generating voice profile from stored examples for persona:', persona.name);

    // Get all voice examples for persona
    const examples = await db.voiceExample.findMany({
      where: { personaId },
      orderBy: { engagement: 'desc' }
    });

    if (examples.length === 0) {
      throw new Error('No voice examples found for this persona. Add sample content first.');
    }

    // Analyze the examples to create profile
    const sampleTexts = examples.map(e => `${e.hook} ${e.body}`);
    const analysis = await this.analyzeVoiceFromSamples(sampleTexts);

    // Calculate preferred tones based on engagement
    const toneEngagement: { [key: string]: number[] } = {};
    examples.forEach(example => {
      if (example.engagement) {
        if (!toneEngagement[example.tone]) {
          toneEngagement[example.tone] = [];
        }
        toneEngagement[example.tone].push(example.engagement);
      }
    });

    const preferredTones = Object.entries(toneEngagement)
      .map(([tone, engagements]) => ({
        tone,
        avgEngagement: engagements.reduce((a, b) => a + b, 0) / engagements.length
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3)
      .map(t => t.tone);

    // Create or update voice profile
    const profileData = {
      name: persona.name,
      description: persona.description ?? 'Persona voice profile',
      niche: persona.niche,
      summary: `Creator with ${analysis.tone} tone, focuses on ${analysis.themes.slice(0, 3).join(', ')}. Writing style: ${analysis.writingStyle.sentenceLength} sentences, ${analysis.writingStyle.vocabulary} vocabulary, ${analysis.writingStyle.rhythm} rhythm.`,
      preferredTones: preferredTones.length > 0 ? preferredTones : [analysis.tone],
      topThemes: analysis.themes.slice(0, 5),
      lexicalTraits: analysis.writingStyle
    };

    const profile = await db.voiceProfile.update({
      where: { id: personaId },
      data: {
        summary: profileData.summary,
        preferredTones: profileData.preferredTones,
        topThemes: profileData.topThemes,
        lexicalTraits: profileData.lexicalTraits
      }
    });

    console.log('✅ Voice profile generated:', profile.summary);
    return profile;
  }

  /**
   * Generate content in the creator's authentic voice
   */
  async generateAuthenticContent(
    prompt: string,
    context?: {
      theme?: string;
      targetDuration?: number;
      platform?: 'instagram' | 'tiktok' | 'youtube' | 'twitter';
    },
    personaId?: string
  ): Promise<any> {
    if (!personaId) {
      throw new Error('personaId is required to generate content.');
    }

    const persona = await this.ensurePersona(personaId);

    console.log('🤖 Generating authentic content for persona:', persona.name);

    // Get recent high-performing examples for context
    const recentExamples = await db.voiceExample.findMany({
      where: { personaId, engagement: { gt: 0 } },
      orderBy: { engagement: 'desc' },
      take: 3
    });

    const exampleText = recentExamples.length > 0 
      ? recentExamples.map(e => `"${e.hook} ${e.body}"`).join('\n')
      : '';

    const personaSummary = persona.summary || `${persona.name} persona voice profile`;
    const preferredTones = persona.preferredTones?.length ? persona.preferredTones.join(', ') : 'authentic';
    const topThemes = persona.topThemes?.length ? persona.topThemes.join(', ') : persona.niche;

    const result = await generateObject({
      model: this.model,
      schema: ContentGenerationSchema,
      prompt: `You are the creator's digital voice. Generate content that sounds authentically like them.

VOICE PROFILE:
${personaSummary}
Persona: ${persona.name}

PREFERRED TONES: ${preferredTones}
TOP THEMES: ${topThemes}

HIGH-PERFORMING EXAMPLES:
${exampleText}

CONTENT REQUEST: ${prompt}

CONTEXT:
- Theme: ${context?.theme || 'general'}
- Target Duration: ${context?.targetDuration || 30}s
- Platform: ${context?.platform || 'instagram'}

Generate content that:
1. Matches the creator's authentic voice and tone
2. Uses their preferred themes and style
3. Feels natural and genuine (not AI-generated)
4. Is optimized for the target platform
5. Includes engaging hook, main content, and caption

The content should sound like the creator wrote it themselves.`
    });

    return result.object;
  }

  /**
   * Update voice profile with new performance data
   */
  async updateVoiceProfile(newEngagementData: Array<{
    content: string;
    tone: string;
    theme: string;
    engagement: number;
  }>, personaId: string): Promise<void> {
    await this.ensurePersona(personaId);

    console.log('🔄 Updating voice profile with new engagement data for persona:', personaId);

    // Store new examples
    for (const data of newEngagementData) {
      const embedding = await embed({
        model: this.embeddingModel,
        value: data.content
      });

      await db.voiceExample.create({
        data: {
          personaId,
          theme: data.theme,
          tone: data.tone,
          hook: data.content.split(' ').slice(0, 8).join(' '), // First 8 words as hook
          body: data.content,
          engagement: data.engagement,
          embedding: embedding.embedding
        }
      });
    }

    // Regenerate profile
    await this.generateVoiceProfile(personaId);
    console.log('✅ Voice profile updated with new performance data');
  }
}

export const digitalMeService = new DigitalMeService();
