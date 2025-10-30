import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const UpdateBrollSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const broll = await db.broll.findUnique({
      where: { id: params.id }
    });

    if (!broll) {
      return NextResponse.json(
        { error: 'B-roll not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ broll });

  } catch (error) {
    console.error('Failed to fetch B-roll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = UpdateBrollSchema.parse(body);

    const broll = await db.broll.update({
      where: { id: params.id },
      data
    });

    return NextResponse.json({
      success: true,
      broll
    });

  } catch (error) {
    console.error('B-roll update failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid update data', details: error.issues },
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
  { params }: { params: { id: string } }
) {
  try {
    await db.broll.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'B-roll deleted successfully'
    });

  } catch (error) {
    console.error('B-roll deletion failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
