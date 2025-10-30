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
  content: string;
  position: { x: number; y: number }; // Percentage positions
  style: {
    fontSize: number;
    fontWeight: string;
    color: string;
    stroke?: string;
    strokeWidth?: number;
  };
}

export interface VideoScene {
  start: number;
  end: number;
  text: TextOverlay;
  filters?: string[];
}

export interface VideoTemplate {
  duration: number;
  scenes: VideoScene[];
}

export interface VideoRenderOptions {
  template: VideoTemplate;
  brollPath: string;
  content: {
    [key: string]: string; // Template variables like {{hook}}, {{content}}
  };
  outputFormat?: 'mp4' | 'webm';
  resolution?: '1080x1920' | '720x1280'; // Vertical formats
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

  /**
   * Render video with template and content
   */
  async renderVideo(options: VideoRenderOptions): Promise<string> {
    const {
      template,
      brollPath,
      content,
      outputFormat = 'mp4',
      resolution = '1080x1920'
    } = options;

    const outputId = uuidv4();
    const outputPath = path.join(this.tempDir, `video_${outputId}.${outputFormat}`);

    try {
      // Create ffmpeg command
      const command = ffmpeg(brollPath);

      // Set output format and resolution
      command
        .outputFormat(outputFormat)
        .size(resolution)
        .aspect('9:16') // Vertical aspect ratio
        .duration(template.duration);

      // Add video filters
      const videoFilters: string[] = [];

      // Crop and scale to vertical format
      videoFilters.push('scale=1080:1920:force_original_aspect_ratio=increase');
      videoFilters.push('crop=1080:1920');

      // Apply scene-based filters
      template.scenes.forEach((scene) => {
        if (scene.filters && scene.filters.length > 0) {
          const timeFilter = `enable='between(t,${scene.start},${scene.end})'`;
          scene.filters.forEach(filter => {
            videoFilters.push(`${filter}:${timeFilter}`);
          });
        }
      });

      if (videoFilters.length > 0) {
        command.videoFilters(videoFilters);
      }

      // Generate text overlays
      const textFilters = await this.generateTextOverlays(template.scenes, content);
      if (textFilters.length > 0) {
        command.complexFilter(textFilters);
      }

      // Execute rendering
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

      // Upload to blob storage
      const videoBuffer = await fs.readFile(outputPath);
      const blob = await put(`videos/${outputId}.${outputFormat}`, videoBuffer, {
        access: 'public',
        contentType: `video/${outputFormat}`,
      });

      // Clean up temp file
      await fs.unlink(outputPath).catch(console.error);

      return blob.url;

    } catch (error) {
      console.error('Video rendering failed:', error);
      // Clean up on error
      await fs.unlink(outputPath).catch(() => {});
      throw error;
    }
  }

  /**
   * Generate text overlay filters for FFmpeg
   */
  private async generateTextOverlays(scenes: VideoScene[], content: Record<string, string>): Promise<string[]> {
    const textFilters: string[] = [];

    scenes.forEach((scene) => {
      const textContent = this.replaceTemplateVariables(scene.text.content, content);
      
      // Calculate position in pixels (assuming 1080x1920 resolution)
      const x = Math.round((scene.text.position.x / 100) * 1080);
      const y = Math.round((scene.text.position.y / 100) * 1920);

      // Create drawtext filter
      const drawtext = [
        `text='${textContent.replace(/'/g, "\\'")}'`,
        `fontsize=${scene.text.style.fontSize}`,
        `fontcolor=${scene.text.style.color}`,
        `x=${x}`,
        `y=${y}`,
        `enable='between(t,${scene.start},${scene.end})'`,
        `box=1`,
        `boxcolor=black@0.5`,
        `boxborderw=5`
      ];

      // Add stroke if specified
      if (scene.text.style.stroke && scene.text.style.strokeWidth) {
        drawtext.push(`bordercolor=${scene.text.style.stroke}`);
        drawtext.push(`borderw=${scene.text.style.strokeWidth}`);
      }

      textFilters.push(`drawtext=${drawtext.join(':')}`);
    });

    return textFilters;
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
        ffmpeg(videoPath)
          .ffprobe((err, _metadata) => {
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
        textCoverage: Math.random() * 30 // Percentage of screen covered by text
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
            timemarks: ['50%'] // Take screenshot at 50% of video
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
        format: 'mp4'
      },
      instagram: {
        resolution: '1080x1920',
        bitrate: '3500k',
        fps: 30,
        format: 'mp4'
      },
      youtube: {
        resolution: '1080x1920',
        bitrate: '4000k',
        fps: 30,
        format: 'mp4'
      }
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

export const videoRenderer = new VideoRenderer();
