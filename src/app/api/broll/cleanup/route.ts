import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Cleaning up placeholder videos...');

    // Delete all videos with placeholder URLs
    const deletedVideos = await db.broll.deleteMany({
      where: {
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
