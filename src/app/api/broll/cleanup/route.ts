import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePersona } from '@/lib/persona-context';
import { z } from 'zod';

const CleanupSchema = z.object({
  personaId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personaId } = CleanupSchema.parse(body);

    await requirePersona(personaId);

    console.log('🧹 Cleaning up placeholder videos for persona:', personaId);

    // Delete all videos with placeholder URLs
    const deletedVideos = await db.broll.deleteMany({
      where: {
        personaId,
        OR: [
          { fileUrl: { contains: '/placeholder/' } },
          { fileUrl: { contains: 'example.com' } },
          { fileUrl: { contains: 'test.mp4' } },
          { fileUrl: { startsWith: '/placeholder' } }
        ]
      }
    });

    console.log(`✅ Deleted ${deletedVideos.count} placeholder videos`);

    // Get remaining real videos
    const realVideos = await db.broll.findMany({
      where: {
        personaId,
        AND: [
          { fileUrl: { not: { contains: '/placeholder/' } } },
          { fileUrl: { not: { contains: 'example.com' } } },
          { fileUrl: { not: { contains: 'test.mp4' } } }
        ]
      }
    });

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedVideos.count} placeholder videos`,
      remainingVideos: realVideos.length,
      videos: realVideos
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return NextResponse.json(
      { 
        error: 'Cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
