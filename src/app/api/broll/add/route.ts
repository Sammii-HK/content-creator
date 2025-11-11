import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { requirePersona } from '@/lib/persona-context';

const AddBrollSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  duration: z.number().positive(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  personaId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = AddBrollSchema.parse(body);

    console.log('Adding B-roll to database:', data);

    await requirePersona(data.personaId);

    const brollEntry = await db.broll.create({
      data: {
        ...data,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      broll: brollEntry
    });

  } catch (error) {
    console.error('Database save failed:', error);
    return NextResponse.json(
      { error: 'Database save failed' },
      { status: 500 }
    );
  }
}
