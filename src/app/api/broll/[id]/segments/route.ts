import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get segments for a specific broll video
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
    return NextResponse.json(
      { error: 'Failed to fetch segments' },
      { status: 500 }
    );
  }
}

// Create new segment for a broll video
export async function POST(
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

    // Validate required fields
    if (typeof startTime !== 'number' || typeof endTime !== 'number') {
      return NextResponse.json(
        { error: 'startTime and endTime are required and must be numbers' },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'startTime must be less than endTime' },
        { status: 400 }
      );
    }

    // Check if broll exists
    const broll = await db.broll.findUnique({
      where: { id },
    });

    if (!broll) {
      return NextResponse.json(
        { error: 'Broll video not found' },
        { status: 404 }
      );
    }

    // Create segment
    const segment = await db.brollSegment.create({
      data: {
        brollId: id,
        startTime,
        endTime,
        duration: endTime - startTime,
        description: description || `Segment ${startTime}s-${endTime}s`,
        qualityRating: qualityRating || 5,
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
    return NextResponse.json(
      { error: 'Failed to create segment' },
      { status: 500 }
    );
  }
}