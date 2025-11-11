import { NextRequest, NextResponse } from 'next/server';
import { templateService } from '@/lib/templates';
import { requirePersona } from '@/lib/persona-context';
import { z } from 'zod';

const RefinePayloadSchema = z.object({
  personaId: z.string()
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const body = await request.json();
    const { personaId } = RefinePayloadSchema.parse(body);

    await requirePersona(personaId);

    // Update performance metrics first
    await templateService.updateTemplatePerformance(templateId, personaId);

    // Refine the template using AI
    const refinementResult = await templateService.refineTemplate(templateId, personaId);

    return NextResponse.json({
      success: true,
      ...refinementResult
    });

  } catch (error) {
    console.error('Template refinement failed:', error);

    if (error instanceof Error && error.message === 'Template not found') {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
