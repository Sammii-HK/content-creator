import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePersona } from '@/lib/persona-context';
import { z } from 'zod';

const PersonaSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  niche: z.string().min(1).optional(),
  preferredTones: z.array(z.string()).optional(),
  topThemes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  blueprint: z.unknown().optional(),
  guidancePrompts: z.unknown().optional()
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// Get persona settings
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requirePersona(id);

    const persona = await db.voiceProfile.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        niche: true,
        summary: true,
        preferredTones: true,
        topThemes: true,
        lexicalTraits: true,
        blueprint: true,
        guidancePrompts: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      settings: persona
    });

  } catch (error) {
    console.error('Failed to fetch persona settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona settings' },
      { status: 500 }
    );
  }
}

// Update persona settings
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const settings = PersonaSettingsSchema.parse(body);

    const { id } = await params;
    await requirePersona(id);

    // Filter out undefined values
    const updateData = Object.fromEntries(
      Object.entries(settings).filter(([, value]) => value !== undefined)
    );

    const updatedPersona = await db.voiceProfile.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        niche: true,
        summary: true,
        preferredTones: true,
        topThemes: true,
        lexicalTraits: true,
        blueprint: true,
        guidancePrompts: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      settings: updatedPersona,
      message: 'Persona settings updated successfully'
    });

  } catch (error) {
    console.error('Failed to update persona settings:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid settings data',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update persona settings' },
      { status: 500 }
    );
  }
}
