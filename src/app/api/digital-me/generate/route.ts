import { NextRequest, NextResponse } from 'next/server';
import { digitalMeService } from '@/lib/digitalMe';
import { requirePersona } from '@/lib/persona-context';
import { z } from 'zod';

const GenerateRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  theme: z.string().optional(),
  targetDuration: z.number().min(5).max(300).optional().default(30),
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'twitter']).optional().default('instagram'),
  personaId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, theme, targetDuration, platform, personaId } = GenerateRequestSchema.parse(body);

    console.log('🤖 Digital Me generating content:', { prompt, theme, platform });

    await requirePersona(personaId);

    const content = await digitalMeService.generateAuthenticContent(
      prompt,
      {
        theme,
        targetDuration,
        platform
      },
      personaId
    );

    return NextResponse.json({
      success: true,
      content,
      metadata: {
        prompt,
        theme,
        targetDuration,
        platform,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Digital Me generation failed:', error);
    
    if (error instanceof Error && error.message.includes('No voice profile found')) {
      return NextResponse.json(
        { 
          error: 'Voice profile not found',
          suggestion: 'Create your voice profile first by analyzing sample content',
          action: 'setup_voice_profile'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Content generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
