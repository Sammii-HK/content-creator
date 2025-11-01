import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { brollSegmentService } from '@/lib/broll-segments';
import { z } from 'zod';

const CreateSegmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startTime: z.number().min(0, 'Start time must be positive'),
  endTime: z.number().min(0, 'End time must be positive'),
  quality: z.number().min(1).max(10).default(5),
  mood: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isUsable: z.boolean().default(true)
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"]
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get B-roll with all its segments
    const broll = await db.broll.findUnique({
      where: { id },
      include: {
        segments: {
          orderBy: { startTime: 'asc' }
        }
      }
    });

    if (!broll) {
      return NextResponse.json(
        { error: 'B-roll not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ broll });

  } catch (error) {
    console.error('Failed to fetch B-roll segments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: brollId } = await params;
    const body = await request.json();
    const segmentData = CreateSegmentSchema.parse(body);

    // Verify the B-roll exists
    const broll = await db.broll.findUnique({
      where: { id: brollId }
    });

    if (!broll) {
      return NextResponse.json(
        { error: 'B-roll not found' },
        { status: 404 }
      );
    }

    // Validate timestamps are within video duration
    if (segmentData.endTime > broll.duration) {
      return NextResponse.json(
        { error: `End time cannot exceed video duration (${broll.duration}s)` },
        { status: 400 }
      );
    }

    // Check for overlapping segments
    const existingSegments = await db.brollSegment.findMany({
      where: { brollId }
    });

    const hasOverlap = existingSegments.some(existing => 
      (segmentData.startTime >= existing.startTime && segmentData.startTime < existing.endTime) ||
      (segmentData.endTime > existing.startTime && segmentData.endTime <= existing.endTime) ||
      (segmentData.startTime <= existing.startTime && segmentData.endTime >= existing.endTime)
    );

    if (hasOverlap) {
      return NextResponse.json(
        { error: 'Segment overlaps with existing segment' },
        { status: 400 }
      );
    }

    // Create the segment
    const segment = await db.brollSegment.create({
      data: {
        brollId,
        ...segmentData
      }
    });

    return NextResponse.json({
      success: true,
      segment,
      message: 'Segment created successfully'
    });

  } catch (error) {
    console.error('Segment creation failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid segment data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
