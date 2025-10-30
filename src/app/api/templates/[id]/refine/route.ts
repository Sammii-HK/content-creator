import { NextRequest, NextResponse } from 'next/server';
import { templateService } from '@/lib/templates';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;

    // Update performance metrics first
    await templateService.updateTemplatePerformance(templateId);

    // Refine the template using AI
    const refinementResult = await templateService.refineTemplate(templateId);

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
