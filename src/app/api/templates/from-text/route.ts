import { NextRequest, NextResponse } from 'next/server';
import { digitalMeService } from '@/lib/digitalMe';
import { requirePersona } from '@/lib/persona-context';
import { z } from 'zod';

const TextToTemplateSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
  personaId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, personaId } = TextToTemplateSchema.parse(body);

    await requirePersona(personaId);

    console.log('🎨 Converting text description to template:', description.slice(0, 50));

    // Use AI to convert natural language to template JSON
    const templateJson = await digitalMeService.generateTemplateFromDescription(
      description,
      personaId
    );

    return NextResponse.json({
      success: true,
      template: templateJson,
      message: 'Template generated from description',
    });
  } catch (error) {
    console.error('Template generation failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate template from description' },
      { status: 500 }
    );
  }
}
