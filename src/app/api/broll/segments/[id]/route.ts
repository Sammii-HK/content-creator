import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Update a specific segment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const {
      startTime,
      endTime,
      description,
      qualityRating,
      tags,
      isUsable
    } = body;

    // Validate quality rating if provided
    if (qualityRating !== undefined && (qualityRating < 1 || qualityRating > 10)) {
      return NextResponse.json(
        { error: 'qualityRating must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Validate times if provided
    if (startTime !== undefined && endTime !== undefined && startTime >= endTime) {
      return NextResponse.json(
        { error: 'startTime must be less than endTime' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (startTime !== undefined && endTime !== undefined) {
      updateData.duration = endTime - startTime;
    }
    if (description !== undefined) updateData.description = description;
    if (qualityRating !== undefined) updateData.qualityRating = qualityRating;
    if (tags !== undefined) updateData.tags = tags;
    if (isUsable !== undefined) updateData.isUsable = isUsable;

    const segment = await db.brollSegment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      segment,
      message: 'Segment updated successfully',
    });
  } catch (error: any) {
    console.error('Failed to update segment:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update segment' },
      { status: 500 }
    );
  }
}

// Delete a specific segment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await db.brollSegment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Segment deleted successfully',
    });
  } catch (error: any) {
    console.error('Failed to delete segment:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete segment' },
      { status: 500 }
    );
  }
}

// Get a specific segment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const segment = await db.brollSegment.findUnique({
      where: { id },
      include: {
        broll: {
          select: {
            id: true,
            name: true,
            fileUrl: true,
            duration: true,
          },
        },
      },
    });

    if (!segment) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      segment,
    });
  } catch (error) {
    console.error('Failed to fetch segment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segment' },
      { status: 500 }
    );
  }
}