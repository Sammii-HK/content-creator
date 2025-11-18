import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { put } from '@vercel/blob';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export interface TextOverlay {
  id?: string;
  content: string;
  position: { x: number; y: number }; // Percentage positions
  style: {
    fontSize: number;
    fontWeight: string;
    color: string;
    stroke?: string;
    strokeWidth?: number;
    maxWidth?: number;
    background?: boolean | string;
    backgroundColor?: string;
    boxBorderWidth?: number;
    lineHeightMultiplier?: number;
    backgroundRadius?: number;
    fontFamily?: string;
  };
}

export interface VideoScene {
  start: number;
  end: number;
  text: TextOverlay;
  filters?: string[];
}

export interface VideoTemplate {
  name?: string;
  duration: number;
  scenes: VideoScene[];
  textStyle?: Partial<TextOverlay['style']> & {
    background?: boolean | string;
    backgroundColor?: string;
    maxWidth?: number;
    lineHeightMultiplier?: number;
    backgroundRadius?: number;
    boxBorderWidth?: number;
    fontFamily?: string;
  };
}

export interface VideoRenderOptions {
  template: VideoTemplate;
  brollPath: string;
  content: {
    [key: string]: string; // Template variables like {{hook}}, {{content}}
  };
  outputFormat?: 'mp4' | 'webm';
  resolution?: '1080x1920' | '720x1280'; // Vertical formats
  startTime?: number;
  endTime?: number;
}

export interface VideoSegmentRange {
  sourceStart: number;
  sourceEnd: number;
}

export class VideoRenderer {
  private tempDir = path.join(os.tmpdir(), 'smart-content-studio');

  constructor() {
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  async renderToTempFile(
    options: VideoRenderOptions
  ): Promise<{ outputPath: string; format: string }> {
    const {
      template,
      brollPath,
      content,
      outputFormat = 'mp4',
      resolution = '1080x1920',
      startTime,
      endTime,
    } = options;

    const outputId = uuidv4();
    const outputPath = path.join(this.tempDir, `video_${outputId}.${outputFormat}`);

    try {
      const command = ffmpeg(brollPath);
      if (typeof startTime === 'number') {
        command.seekInput(Math.max(0, startTime));
      }
      const durationOverride =
        typeof endTime === 'number' && typeof startTime === 'number'
          ? Math.max(0.1, endTime - startTime)
          : template.duration;
      command
        .outputFormat(outputFormat)
        .size(resolution)
        .aspect('9:16')
        .duration(durationOverride)
        .noAudio()
        .videoCodec('libx264');

      const videoFilters: string[] = [];
      videoFilters.push('scale=1080:1920:force_original_aspect_ratio=increase');
      videoFilters.push('crop=1080:1920');

      template.scenes.forEach((scene) => {
        if (scene.filters && scene.filters.length > 0) {
          const timeFilter = `enable='between(t,${scene.start},${scene.end})'`;
          scene.filters.forEach((filter) => {
            videoFilters.push(`${filter}:${timeFilter}`);
          });
        }
      });

      const textFilters = await this.generateTextOverlays(
        template.scenes,
        content,
        template.textStyle
      );
      if (textFilters.length > 0) {
        videoFilters.push(...textFilters);
      }

      if (videoFilters.length > 0) {
        command.videoFilters(videoFilters);
      }

      await new Promise<void>((resolve, reject) => {
        command
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('FFmpeg process started:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('Processing: ' + progress.percent + '% done');
          })
          .on('end', () => {
            console.log('Video rendering completed');
            resolve();
          })
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
            reject(err);
          })
          .run();
      });

      return { outputPath, format: outputFormat };
    } catch (error) {
      await fs.unlink(outputPath).catch(() => {});
      throw error;
    }
  }

  /**
   * Render video and upload to blob storage
   */
  async renderVideo(options: VideoRenderOptions): Promise<string> {
    const { outputPath, format } = await this.renderToTempFile(options);

    try {
      const videoBuffer = await fs.readFile(outputPath);
      const blob = await put(`videos/${uuidv4()}.${format}`, videoBuffer, {
        access: 'public',
        contentType: `video/${format}`,
      });
      return blob.url;
    } finally {
      await fs.unlink(outputPath).catch(console.error);
    }
  }

  /**
   * Render video and return the raw buffer (no upload)
   */
  async renderVideoToBuffer(options: VideoRenderOptions): Promise<Buffer> {
    const { outputPath } = await this.renderToTempFile(options);
    try {
      return await fs.readFile(outputPath);
    } finally {
      await fs.unlink(outputPath).catch(console.error);
    }
  }

  /**
   * Render a video composed of multiple segments from the source footage.
   * Each segment is trimmed, concatenated, and then rendered with the provided template.
   */
  async renderMultiSegmentVideo(
    options: VideoRenderOptions & { segments: VideoSegmentRange[] }
  ): Promise<string> {
    const { segments, ...baseOptions } = options;
    if (!segments || segments.length === 0) {
      throw new Error('At least one segment is required to render a multi-segment video');
    }

    const tempSegmentFiles: string[] = [];
    const concatListPath = path.join(this.tempDir, `concat_${uuidv4()}.txt`);
    const mergedSegmentsPath = path.join(this.tempDir, `merged_${uuidv4()}.mp4`);

    try {
      for (const segment of segments) {
        const start = Math.max(0, segment.sourceStart);
        const end = Math.max(start, segment.sourceEnd);
        const duration = Math.max(0, end - start);
        if (duration <= 0.05) {
          continue;
        }
        const segmentPath = path.join(this.tempDir, `segment_${uuidv4()}.mp4`);
        await new Promise<void>((resolve, reject) => {
          ffmpeg(baseOptions.brollPath)
            .seekInput(start)
            .duration(Math.max(0.1, duration))
            .outputOptions(['-c', 'copy'])
            .output(segmentPath)
            .on('end', () => resolve())
            .on('error', reject)
            .run();
        });
        tempSegmentFiles.push(segmentPath);
      }

      if (tempSegmentFiles.length === 0) {
        throw new Error('No valid segments were provided to render');
      }

      const concatFileContent = tempSegmentFiles
        .map((filePath) => `file '${filePath.replace(/'/g, "'\\''")}'`)
        .join('\n');
      await fs.writeFile(concatListPath, concatFileContent, 'utf-8');

      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(concatListPath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions(['-c', 'copy'])
          .output(mergedSegmentsPath)
          .on('end', () => resolve())
          .on('error', reject)
          .run();
      });

      const videoUrl = await this.renderVideo({
        ...baseOptions,
        brollPath: mergedSegmentsPath,
        startTime: undefined,
        endTime: undefined,
      });

      return videoUrl;
    } finally {
      await Promise.all(tempSegmentFiles.map((file) => fs.unlink(file).catch(() => {})));
      await fs.unlink(concatListPath).catch(() => {});
      await fs.unlink(mergedSegmentsPath).catch(() => {});
    }
  }

  /**
   * Generate text overlay filters for FFmpeg
   */
  private async generateTextOverlays(
    scenes: VideoScene[],
    content: Record<string, string>,
    baseStyle: Partial<TextOverlay['style']> & {
      background?: boolean | string;
      backgroundColor?: string;
      maxWidth?: number;
      boxBorderWidth?: number;
    } = {}
  ): Promise<string[]> {
    const textFilters: string[] = [];

    scenes.forEach((scene) => {
      if (!scene?.text?.content) {
        return;
      }

      const style = {
        ...(baseStyle || {}),
        ...(scene.text.style || {}),
      };
      const maxWidthPercent = style.maxWidth ?? baseStyle.maxWidth ?? 100;
      const maxWidthPx = Math.max(10, (maxWidthPercent / 100) * 1080);
      const fontSize = style.fontSize ?? 48;
      const approxCharWidth = fontSize * 0.6;
      const maxCharsPerLine = Math.max(1, Math.floor(maxWidthPx / approxCharWidth));

      const wrappedLines =
        maxWidthPercent < 100
          ? wrapTextForFFmpeg(
              this.replaceTemplateVariables(scene.text.content, content),
              maxCharsPerLine
            )
          : [this.replaceTemplateVariables(scene.text.content, content)];

      const textContent = wrappedLines.join('\n').replace(/'/g, "\\'");
      const position = scene.text.position || { x: 50, y: 50 };
      const anchorX = Math.max(0, Math.min(100, position.x ?? 50)) / 100;
      const anchorY = Math.max(0, Math.min(100, position.y ?? 50)) / 100;
      const centeredX = `(main_w*${anchorX.toFixed(4)})-(text_w/2)`;
      const centeredY = `(main_h*${anchorY.toFixed(4)})-(text_h/2)`;
      const xExpr = `max(0,min(main_w-text_w,${centeredX}))`;
      const yExpr = `max(0,min(main_h-text_h,${centeredY}))`;

      // Create drawtext filter
      const drawtext = [
        `text='${textContent}'`,
        `fontsize=${style.fontSize ?? 48}`,
        `fontcolor=${style.color ?? '#ffffff'}`,
        `x='${xExpr}'`,
        `y='${yExpr}'`,
        `enable='between(t,${scene.start},${scene.end})'`,
      ];

      const lineSpacingMultiplier =
        style.lineHeightMultiplier ?? baseStyle.lineHeightMultiplier ?? 1.35;
      const lineSpacingPx = (lineSpacingMultiplier - 1) * (style.fontSize ?? 48);
      if (Math.abs(lineSpacingPx) > 0.01) {
        drawtext.push(`line_spacing=${lineSpacingPx.toFixed(2)}`);
      }

      let backgroundColor: string | null = null;
      if (style.background === false) {
        backgroundColor = null;
      } else if (typeof style.background === 'string') {
        backgroundColor = style.background;
      } else if (style.backgroundColor) {
        backgroundColor = style.backgroundColor;
      } else {
        backgroundColor = 'black@0.5';
      }

      if (backgroundColor) {
        drawtext.push(
          `box=1`,
          `boxcolor=${backgroundColor}`,
          `boxborderw=${style.boxBorderWidth ?? baseStyle.boxBorderWidth ?? 5}`
        );
      } else {
        drawtext.push(`box=0`);
      }

      // Add stroke if specified
      if (style.stroke && style.strokeWidth) {
        drawtext.push(`bordercolor=${style.stroke}`);
        drawtext.push(`borderw=${style.strokeWidth}`);
      }

      textFilters.push(`drawtext=${drawtext.join(':')}`);
    });

    return textFilters;
  }

  async getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath).ffprobe((err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(metadata.format?.duration ?? 0);
      });
    });
  }

  /**
   * Replace template variables in text content
   */
  private replaceTemplateVariables(text: string, content: Record<string, string>): string {
    let result = text;

    Object.entries(content).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
  }

  /**
   * Extract visual features from video for ML analysis
   */
  async extractFeatures(videoPath: string): Promise<{
    avgBrightness: number;
    avgContrast: number;
    motionLevel: number;
    colorVariance: number;
    textCoverage: number;
  }> {
    // const analysisPath = path.join(this.tempDir, `analysis_${uuidv4()}.json`);

    try {
      // Use ffprobe to analyze video
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath).ffprobe((err, _metadata) => {
          if (err) {
            reject(err);
            return;
          }

          // Extract basic metadata
          // const duration = metadata.format.duration || 0;
          // const width = metadata.streams[0]?.width || 0;
          // const height = metadata.streams[0]?.height || 0;

          resolve();
        });
      });

      // For now, return mock values - in production, you'd use OpenCV or similar
      return {
        avgBrightness: Math.random() * 100,
        avgContrast: Math.random() * 100,
        motionLevel: Math.random() * 100,
        colorVariance: Math.random() * 100,
        textCoverage: Math.random() * 30, // Percentage of screen covered by text
      };
    } catch (error) {
      console.error('Feature extraction failed:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail from video
   */
  async generateThumbnail(videoPath: string): Promise<string> {
    const thumbnailId = uuidv4();
    const thumbnailPath = path.join(this.tempDir, `thumb_${thumbnailId}.jpg`);

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            count: 1,
            folder: this.tempDir,
            filename: `thumb_${thumbnailId}.jpg`,
            timemarks: ['50%'], // Take screenshot at 50% of video
          })
          .on('end', () => resolve())
          .on('error', reject);
      });

      // Upload thumbnail to blob storage
      const thumbnailBuffer = await fs.readFile(thumbnailPath);
      const blob = await put(`thumbnails/${thumbnailId}.jpg`, thumbnailBuffer, {
        access: 'public',
        contentType: 'image/jpeg',
      });

      // Clean up temp file
      await fs.unlink(thumbnailPath).catch(console.error);

      return blob.url;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      throw error;
    }
  }

  /**
   * Optimize video for different platforms
   */
  async optimizeForPlatform(
    inputPath: string,
    platform: 'tiktok' | 'instagram' | 'youtube'
  ): Promise<string> {
    const platformSettings = {
      tiktok: {
        resolution: '1080x1920',
        bitrate: '2500k',
        fps: 30,
        format: 'mp4',
      },
      instagram: {
        resolution: '1080x1920',
        bitrate: '3500k',
        fps: 30,
        format: 'mp4',
      },
      youtube: {
        resolution: '1080x1920',
        bitrate: '4000k',
        fps: 30,
        format: 'mp4',
      },
    };

    const settings = platformSettings[platform];
    const outputId = uuidv4();
    const outputPath = path.join(this.tempDir, `optimized_${outputId}.${settings.format}`);

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .size(settings.resolution)
          .videoBitrate(settings.bitrate)
          .fps(settings.fps)
          .format(settings.format)
          .output(outputPath)
          .on('end', () => resolve())
          .on('error', reject)
          .run();
      });

      // Upload optimized video
      const videoBuffer = await fs.readFile(outputPath);
      const blob = await put(`optimized/${platform}/${outputId}.${settings.format}`, videoBuffer, {
        access: 'public',
        contentType: `video/${settings.format}`,
      });

      // Clean up temp file
      await fs.unlink(outputPath).catch(console.error);

      return blob.url;
    } catch (error) {
      console.error('Platform optimization failed:', error);
      throw error;
    }
  }
}

const wrapTextForFFmpeg = (text: string, maxCharsPerLine: number): string[] => {
  const cleanText = text ?? '';
  if (!cleanText.trim()) return [''];

  const words = cleanText.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    if (!currentLine) {
      currentLine = word;
      return;
    }

    if ((currentLine + ' ' + word).length > maxCharsPerLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = `${currentLine} ${word}`;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

export const videoRenderer = new VideoRenderer();
