import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePersona } from '@/lib/persona-context';
import { z } from 'zod';

const UpdatePersonaSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  niche: z.string().min(1).optional(),
  isActive: z.boolean().optional()
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// Get individual persona details
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requirePersona(id);

    const persona = await db.voiceProfile.findUnique({
      where: { id },
      include: {
        examples: {
          select: {
            id: true,
            theme: true,
            tone: true,
            hook: true,
            body: true,
            caption: true,
            tags: true,
            engagement: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
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
      }
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    // Calculate guidance count
    const guidancePrompts = persona.guidancePrompts;
    let guidanceCount = 0;

    if (Array.isArray(guidancePrompts)) {
      guidanceCount = guidancePrompts.length;
    } else if (guidancePrompts && typeof guidancePrompts === 'object') {
      guidanceCount = Object.keys(guidancePrompts as Record<string, unknown>).length;
    }

    const personaWithStats = {
      ...persona,
      hasBlueprint: Boolean(persona.blueprint),
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

    return NextResponse.json({
      success: true,
      persona: personaWithStats
    });

  } catch (error) {
    console.error('Failed to fetch persona:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona' },
      { status: 500 }
    );
  }
}

// Update persona
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const updateData = UpdatePersonaSchema.parse(body);

    const { id } = await params;
    await requirePersona(id);

    const persona = await db.voiceProfile.update({
      where: { id },
      data: updateData,
      include: {
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
      }
    });

    return NextResponse.json({
      success: true,
      persona,
      message: 'Persona updated successfully'
    });

  } catch (error) {
    console.error('Failed to update persona:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid update data',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update persona' },
      { status: 500 }
    );
  }
}

// Delete persona
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requirePersona(id);

    // Check if persona has any associated content
    const persona = await db.voiceProfile.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            videos: true,
            templates: true,
            broll: true,
            assets: true,
            generatedImages: true,
            contentQueue: true
          }
        }
      }
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    const totalContent = Object.values(persona._count).reduce((sum, count) => sum + count, 0);

    if (totalContent > 0) {
      return NextResponse.json({
        error: 'Cannot delete persona with associated content',
        details: `This persona has ${totalContent} associated items. Please reassign or delete them first.`,
        stats: persona._count
      }, { status: 409 });
    }

    // Safe to delete - cascade will handle examples
    await db.voiceProfile.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Persona deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete persona:', error);
    return NextResponse.json(
      { error: 'Failed to delete persona' },
      { status: 500 }
    );
  }
}
