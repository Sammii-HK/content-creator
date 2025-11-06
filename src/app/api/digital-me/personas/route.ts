import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { digitalMeService } from '@/lib/digitalMe';
import { z } from 'zod';

const CreatePersonaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  niche: z.string().min(1, 'Niche is required'),
  samples: z.array(z.object({
    theme: z.string(),
    tone: z.string(),
    hook: z.string(),
    body: z.string(),
    caption: z.string().optional(),
    tags: z.array(z.string()).optional(),
    engagement: z.number().optional()
  })).min(1, 'At least one sample is required')
});

// Get all personas
export async function GET(request: NextRequest) {
  try {
    const personas = await db.voiceProfile.findMany({
      include: {
        examples: {
          select: { id: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const personasWithCounts = personas.map(p => ({
      ...p,
      exampleCount: p.examples.length
    }));

    return NextResponse.json({
      success: true,
      personas: personasWithCounts
    });

  } catch (error) {
    console.error('Failed to fetch personas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personas' },
      { status: 500 }
    );
  }
}

// Create new persona
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, niche, samples } = CreatePersonaSchema.parse(body);

    console.log('🧠 Creating new persona:', name, 'for niche:', niche);

    // Create persona profile
    const persona = await db.voiceProfile.create({
      data: {
        name,
        description: description || `AI voice for ${niche} content`,
        niche,
        summary: `Learning ${niche} voice from ${samples.length} examples...`,
        preferredTones: ['authentic'],
        topThemes: [niche],
        lexicalTraits: {}
      }
    });

    // Store voice examples for this persona
    await Promise.all(samples.map(async (sample) => {
      // Create embedding
      const embedding = await digitalMeService.createEmbeddings([`${sample.hook} ${sample.body}`]);
      
      return db.voiceExample.create({
        data: {
          personaId: persona.id,
          theme: sample.theme,
          tone: sample.tone,
          hook: sample.hook,
          body: sample.body,
          caption: sample.caption,
          tags: sample.tags || [],
          engagement: sample.engagement,
          embedding: embedding[0]
        }
      });
    }));

    // Analyze voice and update persona
    const sampleTexts = samples.map(s => `${s.hook} ${s.body}`);
    const analysis = await digitalMeService.analyzeVoiceFromSamples(sampleTexts);

    const updatedPersona = await db.voiceProfile.update({
      where: { id: persona.id },
      data: {
        summary: `${name} persona: ${analysis.tone} tone, focuses on ${analysis.themes.slice(0, 3).join(', ')}`,
        preferredTones: [analysis.tone, ...analysis.writingStyle.personality.slice(0, 2)],
        topThemes: analysis.themes.slice(0, 5),
        lexicalTraits: analysis.writingStyle
      }
    });

    console.log('✅ Persona created:', updatedPersona.name);

    return NextResponse.json({
      success: true,
      persona: updatedPersona,
      message: `${name} persona created with ${samples.length} training examples`
    });

  } catch (error) {
    console.error('Failed to create persona:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create persona',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
