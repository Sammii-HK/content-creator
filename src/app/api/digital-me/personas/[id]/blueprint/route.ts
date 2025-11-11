import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { requirePersona } from '@/lib/persona-context';

const BlueprintPayload = z.object({
  blueprint: z.unknown().optional(),
  guidancePrompts: z.unknown().optional()
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requirePersona(id);

    const persona = await db.voiceProfile.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        blueprint: true,
        guidancePrompts: true,
        updatedAt: true
      }
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      persona
    });
  } catch (error) {
    console.error('Failed to load persona blueprint:', error);
    return NextResponse.json({ error: 'Failed to load persona blueprint' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { blueprint, guidancePrompts } = BlueprintPayload.parse(body);

    const { id } = await params;
    await requirePersona(id);

    const persona = await db.voiceProfile.update({
      where: { id },
      data: {
        ...(blueprint !== undefined && blueprint !== null && { blueprint }),
        ...(guidancePrompts !== undefined && guidancePrompts !== null && { guidancePrompts })
      },
      select: {
        id: true,
        name: true,
        blueprint: true,
        guidancePrompts: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      persona,
      message: 'Persona blueprint saved'
    });
  } catch (error) {
    console.error('Failed to save persona blueprint:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid payload',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to save persona blueprint' }, { status: 500 });
  }
}
