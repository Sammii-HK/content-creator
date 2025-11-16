import { NextRequest, NextResponse } from 'next/server';
import { templateService } from '@/lib/templates';
import { z } from 'zod';
import { requirePersona } from '@/lib/persona-context';

const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  json: z.object({
    duration: z.number().positive(),
    scenes: z.array(
      z.object({
        start: z.number(),
        end: z.number(),
        text: z.object({
          content: z.string(),
          position: z.object({
            x: z.number(),
            y: z.number(),
          }),
          style: z.object({
            fontSize: z.number(),
            fontWeight: z.string(),
            color: z.string(),
            stroke: z.string().optional(),
            strokeWidth: z.number().optional(),
          }),
        }),
        filters: z.array(z.string()).optional(),
      })
    ),
  }),
  parentId: z.string().optional(),
  personaId: z.string(),
  videoIds: z.array(z.string()).optional(), // Multiple video IDs for this template
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePerformance = searchParams.get('includePerformance') === 'true';
    const personaId = searchParams.get('personaId') || undefined;

    // Only require persona if personaId is provided
    if (personaId) {
      await requirePersona(personaId);
    }

    // Use getAllTemplates by default to include all templates (even without performance scores)
    // getBestTemplates only returns templates with performance scores, which excludes new templates
    const templates = await templateService.getAllTemplates(personaId);
    console.log(`Fetched ${templates.length} templates for personaId: ${personaId || 'all'}`);
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, json, parentId, personaId, videoIds } = CreateTemplateSchema.parse(body);

    await requirePersona(personaId);

    const template = await templateService.createTemplate(name, json, parentId, personaId);

    // Store video associations if provided (for future multi-video support)
    if (videoIds && videoIds.length > 0) {
      console.log(`Template ${template.id} associated with ${videoIds.length} videos`);
      // Note: This could be stored in a junction table or as metadata
      // For now, we'll log it - full implementation would require schema changes
    }

    return NextResponse.json({
      success: true,
      template,
      videoIds: videoIds || [],
    });
  } catch (error) {
    console.error('Template creation failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid template data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
