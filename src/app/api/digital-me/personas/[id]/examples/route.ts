import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { digitalMeService } from '@/lib/digitalMe';
import { requirePersona } from '@/lib/persona-context';
import { z } from 'zod';

const AddExampleSchema = z.object({
  theme: z.string().min(1),
  tone: z.string().min(1),
  hook: z.string().min(1),
  body: z.string().min(1),
  caption: z.string().optional(),
  tags: z.array(z.string()).optional(),
  engagement: z.number().optional()
});

const AddMultipleExamplesSchema = z.object({
  examples: z.array(AddExampleSchema).min(1)
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// Get examples for a persona
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requirePersona(id);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const examples = await db.voiceExample.findMany({
      where: { personaId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
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
      }
    });

    const total = await db.voiceExample.count({
      where: { personaId: id }
    });

    return NextResponse.json({
      success: true,
      examples,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + examples.length < total
      }
    });

  } catch (error) {
    console.error('Failed to fetch examples:', error);
    return NextResponse.json(
      { error: 'Failed to fetch examples' },
      { status: 500 }
    );
  }
}

// Add new examples to a persona
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    
    // Support both single example and multiple examples
    let examples: z.infer<typeof AddExampleSchema>[];
    
    if (Array.isArray(body.examples)) {
      const { examples: parsedExamples } = AddMultipleExamplesSchema.parse(body);
      examples = parsedExamples;
    } else {
      const singleExample = AddExampleSchema.parse(body);
      examples = [singleExample];
    }

    const { id } = await params;
    await requirePersona(id);

    console.log(`🧠 Adding ${examples.length} examples to persona ${id}`);

    // Create embeddings and store examples
    const storedExamples = await Promise.all(
      examples.map(async (example) => {
        // Create embedding for the content
        const text = `${example.hook} ${example.body}`;
        const embeddings = await digitalMeService.createEmbeddings([text]);
        
        return db.voiceExample.create({
          data: {
            personaId: id,
            theme: example.theme,
            tone: example.tone,
            hook: example.hook,
            body: example.body,
            caption: example.caption,
            tags: example.tags || [],
            engagement: example.engagement,
            embedding: embeddings[0]
          }
        });
      })
    );

    // Regenerate voice profile with new examples
    try {
      const updatedProfile = await digitalMeService.generateVoiceProfile(id);
      console.log(`✅ Voice profile updated for persona ${id}`);
      
      return NextResponse.json({
        success: true,
        examples: storedExamples,
        profile: updatedProfile,
        message: `Added ${examples.length} examples and updated voice profile`
      });
    } catch (profileError) {
      console.warn('Failed to regenerate voice profile, but examples were saved:', profileError);
      
      return NextResponse.json({
        success: true,
        examples: storedExamples,
        message: `Added ${examples.length} examples (voice profile update failed)`
      });
    }

  } catch (error) {
    console.error('Failed to add examples:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid example data',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add examples' },
      { status: 500 }
    );
  }
}
