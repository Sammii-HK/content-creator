import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
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
  })).default([]) // Make samples optional - can create persona without samples
});

// Get all personas
export async function GET() {
  try {
    const personas = await db.voiceProfile.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        niche: true,
        summary: true,
        preferredTones: true,
        topThemes: true,
        lexicalTraits: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        blueprint: true,
        guidancePrompts: true,
        examples: {
          select: { id: true }
        },
        _count: {
          select: {
            videos: true,
            templates: true,
            broll: true,
            assets: true,
            generatedImages: true,
            contentQueue: true,
            aiUsage: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const personasWithContext = personas.map((persona) => {
      const guidancePrompts = persona.guidancePrompts;
      let guidanceCount = 0;

      if (Array.isArray(guidancePrompts)) {
        guidanceCount = guidancePrompts.length;
      } else if (guidancePrompts && typeof guidancePrompts === 'object') {
        guidanceCount = Object.keys(guidancePrompts as Record<string, unknown>).length;
      }

      return {
        id: persona.id,
        name: persona.name,
        description: persona.description,
        niche: persona.niche,
        summary: persona.summary,
        preferredTones: persona.preferredTones,
        topThemes: persona.topThemes,
        lexicalTraits: persona.lexicalTraits,
        isActive: persona.isActive,
        createdAt: persona.createdAt,
        updatedAt: persona.updatedAt,
        hasBlueprint: Boolean(persona.blueprint),
        guidancePrompts,
        guidanceCount,
        exampleCount: persona.examples.length,
        stats: {
          videos: persona._count.videos,
          templates: persona._count.templates,
          broll: persona._count.broll,
          assets: persona._count.assets,
          generatedImages: persona._count.generatedImages,
          scheduledContent: persona._count.contentQueue,
          aiUsage: persona._count.aiUsage
        }
      };
    });

    return NextResponse.json({
      success: true,
      personas: personasWithContext
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
    const user = await requireAuth(request);
    const body = await request.json();
    const { name, description, niche, samples } = CreatePersonaSchema.parse(body);

    console.log('🧠 Creating new persona:', name, 'for niche:', niche);

    // Create persona profile
    const persona = await db.voiceProfile.create({
      data: {
        name,
        description: description || `AI voice for ${niche} content`,
        niche,
        summary: samples.length > 0 
          ? `Learning ${niche} voice from ${samples.length} examples...`
          : `${name} persona for ${niche}`,
        preferredTones: ['authentic'],
        topThemes: [niche],
        lexicalTraits: {},
        userId: user.id
      }
    });

    // Store voice examples for this persona (if provided)
    if (samples.length > 0) {
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

      // Analyze voice and update persona (only if we have samples)
      const sampleTexts = samples.map(s => `${s.hook} ${s.body}`);
      try {
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
        
        console.log('✅ Persona created with voice analysis:', updatedPersona.name);
        return NextResponse.json({
          success: true,
          persona: updatedPersona
        });
      } catch (error) {
        console.error('Voice analysis failed, returning basic persona:', error);
        // Continue with basic persona if analysis fails
      }
    }

    console.log('✅ Persona created:', persona.name);

    return NextResponse.json({
      success: true,
      persona: persona,
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
