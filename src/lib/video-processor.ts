/**
 * Client-side video processor that handles ALL iPhone formats
 * Converts videos in the browser without user intervention
 */

export class VideoProcessor {
  /**
   * Process any video file (iPhone MOV, HEVC, etc.) and convert to web-compatible format
   */
  static async processVideo(file: File): Promise<{
    processedFile: File;
    metadata: {
      duration: number;
      width: number;
      height: number;
      originalFormat: string;
      processedFormat: string;
    };
  }> {
    console.log('Processing video:', { 
      name: file.name, 
      type: file.type, 
      size: `${(file.size / (1024 * 1024)).toFixed(1)}MB` 
    });

    // Create video element to load and analyze
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Load video
    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';

    try {
      // Wait for video to load
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video'));
      });

      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        originalFormat: file.type,
        processedFormat: 'video/webm'
      };

      console.log('Video metadata:', metadata);

      // If it's already a compatible format and reasonable size, use as-is
      const isCompatible = file.type === 'video/mp4' || file.type === 'video/webm';
      const isReasonableSize = file.size < 50 * 1024 * 1024; // 50MB

      if (isCompatible && isReasonableSize) {
        console.log('Video is already compatible, using original');
        URL.revokeObjectURL(videoUrl);
        return {
          processedFile: file,
          metadata: { ...metadata, processedFormat: file.type }
        };
      }

      // Convert to web-compatible format using canvas + MediaRecorder
      console.log('Converting video to web-compatible format...');
      
      // Set canvas size (optimize for web)
      const maxDimension = 1080;
      let { width, height } = metadata;
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      canvas.width = width;
      canvas.height = height;

      // Set up recording
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000 // 2.5 Mbps for good quality
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);

      // Record the video
      const processedBlob = await new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };

        recorder.onerror = (e) => reject(new Error('Recording failed'));

        recorder.start();
        video.currentTime = 0;
        video.play();

        // Render frames
        const renderFrame = () => {
          if (video.ended || video.currentTime >= video.duration) {
            recorder.stop();
            video.pause();
            return;
          }

          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(renderFrame);
        };

        video.ontimeupdate = renderFrame;
      });

      // Create new file from processed blob
      const processedFile = new File(
        [processedBlob], 
        file.name.replace(/\.[^/.]+$/, '.webm'),
        { type: 'video/webm' }
      );

      console.log('✅ Video conversion complete:', {
        originalSize: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
        processedSize: `${(processedFile.size / (1024 * 1024)).toFixed(1)}MB`,
        compression: `${(((file.size - processedFile.size) / file.size) * 100).toFixed(1)}% smaller`
      });

      URL.revokeObjectURL(videoUrl);

      return {
        processedFile,
        metadata: { ...metadata, processedFormat: 'video/webm' }
      };

    } catch (error) {
      URL.revokeObjectURL(videoUrl);
      console.error('Video processing failed:', error);
      throw new Error(`Video processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Quick compatibility check
   */
  static isVideoCompatible(file: File): boolean {
    const compatibleTypes = ['video/mp4', 'video/webm'];
    return compatibleTypes.includes(file.type) && file.size < 50 * 1024 * 1024;
  }

  /**
   * Estimate processing time
   */
  static estimateProcessingTime(file: File): string {
    const sizeMB = file.size / (1024 * 1024);
    const estimatedSeconds = Math.max(10, sizeMB * 2); // ~2 seconds per MB
    
    if (estimatedSeconds < 60) {
      return `~${Math.round(estimatedSeconds)} seconds`;
    } else {
      return `~${Math.round(estimatedSeconds / 60)} minutes`;
    }
  }
}

export const videoProcessor = VideoProcessor;
