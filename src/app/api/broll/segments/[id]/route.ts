import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const UpdateSegmentSchema = z.object({
  name: z.string().optional(),
  startTime: z.number().min(0).optional(),
  endTime: z.number().min(0).optional(),
  quality: z.number().min(1).max(10).optional(),
  mood: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isUsable: z.boolean().optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = UpdateSegmentSchema.parse(body);

    // Validate timing if both start and end are provided
    if (data.startTime !== undefined && data.endTime !== undefined) {
      if (data.endTime <= data.startTime) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }
    }

    const segment = await db.brollSegment.update({
      where: { id },
      data
    });

    return NextResponse.json({
      success: true,
      segment
    });

  } catch (error) {
    console.error('Segment update failed:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.brollSegment.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Segment deleted successfully'
    });

  } catch (error) {
    console.error('Segment deletion failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
