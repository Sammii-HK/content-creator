import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { requirePersona } from '@/lib/persona-context';
import { db } from '@/lib/db';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const SaveGeneratedVideoSchema = z.object({
  videoBlob: z.string(), // Base64 encoded video blob
  theme: z.string(),
  tone: z.string(),
  duration: z.number(),
  hook: z.string(),
  content: z.string(),
  templateId: z.string().optional(),
  brollId: z.string().optional(),
  personaId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { videoBlob, theme, tone, duration, hook, content, templateId, brollId, personaId } =
      SaveGeneratedVideoSchema.parse(body);

    await requirePersona(personaId);

    // Convert base64 to buffer
    const base64Data = videoBlob.includes(',') ? videoBlob.split(',')[1] : videoBlob;
    const binaryData = Buffer.from(base64Data, 'base64');

    // Upload to R2
    const key = `generated-videos/${Date.now()}-${user.id}.webm`;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: binaryData,
        ContentType: 'video/webm',
      })
    );

    // Save to database
    const video = await db.video.create({
      data: {
        theme,
        tone,
        duration,
        hookLines: [hook],
        caption: content,
        templateId: templateId || null,
        brollId: brollId || null,
        fileUrl: publicUrl,
        userId: user.id,
        personaId,
        features: {
          hookStrength: hook.length < 50 ? 1 : 0.5,
          contentLength: content.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error('Failed to save generated video:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get('personaId') || undefined;

    if (personaId) {
      await requirePersona(personaId);
    }

    const where: Record<string, unknown> = {
      userId: user.id,
      fileUrl: { not: '' }, // Only videos with actual file URLs
    };

    if (personaId) {
      where.personaId = personaId;
    }

    const videos = await db.video.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: { name: true },
        },
        broll: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      videos,
    });
  } catch (error) {
    console.error('Failed to fetch generated videos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
