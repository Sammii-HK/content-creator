import { NextResponse } from 'next/server';
import { videoRenderer } from '@/lib/video';
import { getSceneVideoMapping } from '@/lib/sceneMapping';
import { randomUUID } from 'crypto';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { videoUrl, template, content } = await req.json();

    if (!videoUrl || !template || !content) {
      return NextResponse.json(
        { error: 'Missing videoUrl, template, or content' },
        { status: 400 }
      );
    }

    const tempDir = path.join(os.tmpdir(), 'client-render-source');
    await fs.mkdir(tempDir, { recursive: true });
    const sourceExt = path.extname(new URL(videoUrl).pathname) || '.mp4';
    const sourcePath = path.join(tempDir, `${randomUUID()}${sourceExt}`);

    const sourceResponse = await fetch(videoUrl, { cache: 'no-store' });
    if (!sourceResponse.ok) {
      throw new Error(`Failed to download source video (${sourceResponse.status})`);
    }
    const arrayBuffer = await sourceResponse.arrayBuffer();
    await fs.writeFile(sourcePath, Buffer.from(arrayBuffer));

    const scenes = (template.scenes as any[]) || [];
    if (scenes.length === 0) {
      throw new Error('Template must include at least one scene.');
    }

    const sourceDuration = await videoRenderer.getVideoDuration(sourcePath);
    const sceneMappings = getSceneVideoMapping(scenes, sourceDuration);
    const segmentPaths: string[] = [];
    const tempArtifacts: string[] = [];

    try {
      for (const mapping of sceneMappings) {
        const segmentDuration = Math.max(0.1, mapping.outputEnd - mapping.outputStart);
        const startTime = Math.max(0, mapping.videoStart);
        const endTime =
          typeof mapping.videoEnd === 'number' ? mapping.videoEnd : startTime + segmentDuration;

        const sceneClone = {
          ...mapping.scene,
          start: 0,
          end: segmentDuration,
          text: mapping.scene.text
            ? {
                ...mapping.scene.text,
                style: { ...(mapping.scene.text.style || {}) },
                position: { ...(mapping.scene.text.position || {}) },
              }
            : mapping.scene.text,
        };

        const segmentTemplate = {
          duration: segmentDuration,
          scenes: [sceneClone],
        };

        const { outputPath } = await videoRenderer.renderToTempFile({
          template: segmentTemplate,
          brollPath: sourcePath,
          content,
          outputFormat: 'mp4',
          startTime,
          endTime,
        });

        segmentPaths.push(outputPath);
      }

      if (segmentPaths.length === 0) {
        throw new Error('Failed to render any segments.');
      }

      let finalBuffer: Buffer;

      if (segmentPaths.length === 1) {
        finalBuffer = await fs.readFile(segmentPaths[0]);
      } else {
        const concatListPath = path.join(tempDir, `${randomUUID()}_concat.txt`);
        const finalPath = path.join(tempDir, `${randomUUID()}_final.mp4`);
        const concatFileContents = segmentPaths
          .map((segmentPath) => `file '${segmentPath.replace(/'/g, "'\\''")}'`)
          .join('\n');
        await fs.writeFile(concatListPath, concatFileContents);
        tempArtifacts.push(concatListPath, finalPath);

        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input(concatListPath)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions(['-c copy'])
            .output(finalPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        });

        finalBuffer = await fs.readFile(finalPath);
      }

      const base64Video = finalBuffer.toString('base64');

      return NextResponse.json({
        videoData: base64Video,
        mimeType: 'video/mp4',
      });
    } finally {
      await Promise.all(
        [...segmentPaths, ...tempArtifacts, sourcePath].map((file) =>
          fs.unlink(file).catch(() => {})
        )
      );
    }
  } catch (error) {
    console.error('Client render failed:', error);
    return NextResponse.json(
      {
        error: 'Video rendering failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack:
          process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
