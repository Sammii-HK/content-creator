import { NextRequest, NextResponse } from 'next/server';
import { digitalMeService } from '@/lib/digitalMe';
import { db } from '@/lib/db';
import { requirePersona } from '@/lib/persona-context';
import { z } from 'zod';

const CreateProfileRequestSchema = z.object({
  personaId: z.string(),
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

// Get current voice profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get('personaId') || undefined;

    await requirePersona(personaId);

    const profile = await db.voiceProfile.findUnique({
      where: { id: personaId }
    });

    if (!profile) {
      return NextResponse.json(
        { 
          error: 'No voice profile found',
          suggestion: 'Create your voice profile by providing sample content'
        },
        { status: 404 }
      );
    }

    // Get example count
    const exampleCount = await db.voiceExample.count({
      where: { personaId }
    });

    return NextResponse.json({
      success: true,
      profile,
      stats: {
        exampleCount,
        lastUpdated: profile.updatedAt,
        topThemes: profile.topThemes,
        preferredTones: profile.preferredTones
      }
    });

  } catch (error) {
    console.error('❌ Failed to get voice profile:', error);
    return NextResponse.json(
      { error: 'Failed to get voice profile' },
      { status: 500 }
    );
  }
}

// Create or update voice profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { samples, personaId } = CreateProfileRequestSchema.parse(body);

    await requirePersona(personaId);

    console.log('🧠 Creating voice profile from', samples.length, 'samples...');

    // Store voice examples
    await digitalMeService.storeVoiceExamples(samples, personaId);

    // Generate voice profile
    const profile = await digitalMeService.generateVoiceProfile(personaId);

    return NextResponse.json({
      success: true,
      profile,
      message: `Voice profile created from ${samples.length} examples`,
      stats: {
        exampleCount: samples.length,
        topThemes: profile.topThemes,
        preferredTones: profile.preferredTones
      }
    });

  } catch (error) {
    console.error('❌ Voice profile creation failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create voice profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Update voice profile with new performance data
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { engagementData, personaId } = body as { 
      engagementData?: { content: string; tone: string; theme: string; engagement: number; }[]; 
      personaId?: string; 
    };

    await requirePersona(personaId);

    if (!engagementData || !Array.isArray(engagementData)) {
      return NextResponse.json(
        { error: 'engagementData array is required' },
        { status: 400 }
      );
    }

    await digitalMeService.updateVoiceProfile(engagementData, personaId!);

    return NextResponse.json({
      success: true,
      message: 'Voice profile updated with new performance data'
    });

  } catch (error) {
    console.error('❌ Voice profile update failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update voice profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
