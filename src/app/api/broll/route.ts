import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const CreateBrollSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  fileUrl: z.string().url('Valid URL required'),
  duration: z.number().positive('Duration must be positive'),
  category: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    
    if (category) {
      where.category = category;
    }
    
    if (active !== null) {
      where.isActive = active === 'true';
    }

    const broll = await db.broll.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await db.broll.count({ where });

    return NextResponse.json({
      broll,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Failed to fetch B-roll items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateBrollSchema.parse(body);

    const broll = await db.broll.create({
      data: {
        ...data,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      broll
    });

  } catch (error) {
    console.error('B-roll creation failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid B-roll data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
