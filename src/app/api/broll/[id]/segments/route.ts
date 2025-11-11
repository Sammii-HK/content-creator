import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePersona } from '@/lib/persona-context';

// Get segments for a specific broll video
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get('personaId') || undefined;

    await requirePersona(personaId);

    const broll = await db.broll.findFirst({
      where: { id },
    });

    if (!broll) {
      return NextResponse.json({ error: 'B-roll not found for this persona' }, { status: 404 });
    }

    const segments = await db.brollSegment.findMany({
      where: {
        brollId: id,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      segments,
    });
  } catch (error) {
    console.error('Failed to fetch segments:', error);
    return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 });
  }
}

// Create new segment for a broll video
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const personaId = body?.personaId as string | undefined;

    await requirePersona(personaId);

    const { startTime, endTime, description, quality, tags, isUsable, name } = body;

    // Validate required fields
    if (typeof startTime !== 'number' || typeof endTime !== 'number') {
      return NextResponse.json(
        { error: 'startTime and endTime are required and must be numbers' },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json({ error: 'startTime must be less than endTime' }, { status: 400 });
    }

    // Check if broll exists
    const broll = await db.broll.findFirst({
      where: { id },
    });

    if (!broll) {
      return NextResponse.json({ error: 'Broll video not found' }, { status: 404 });
    }

    // Create segment
    const segment = await db.brollSegment.create({
      data: {
        brollId: id,
        name: name || `Segment ${startTime.toFixed(1)}s-${endTime.toFixed(1)}s`,
        startTime,
        endTime,
        description:
          description || `Segment from ${startTime.toFixed(1)}s to ${endTime.toFixed(1)}s`,
        quality: quality || 5,
        tags: tags || [],
        isUsable: isUsable !== false, // Default to true
      },
    });

    return NextResponse.json({
      success: true,
      segment,
      message: 'Segment created successfully',
    });
  } catch (error) {
    console.error('Failed to create segment:', error);
    return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 });
  }
}
