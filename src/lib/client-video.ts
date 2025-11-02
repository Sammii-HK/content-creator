/**
 * Client-side video generation using Web APIs
 * Works in modern browsers, no server FFmpeg needed
 */

export interface ClientVideoOptions {
  videoUrl: string;
  template: any;
  content: Record<string, string>;
  duration: number;
}

export class ClientVideoRenderer {
  /**
   * Generate video in the browser using Canvas API
   */
  async renderVideo(options: ClientVideoOptions): Promise<Blob> {
    const { videoUrl, template, content, duration } = options;

    // Create video element
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
    });

    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size for vertical video (9:16)
    canvas.width = 1080;
    canvas.height = 1920;

    // Set up MediaRecorder for output
    const stream = canvas.captureStream(30); // 30 FPS
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      recorder.onerror = reject;

      // Start recording
      recorder.start();
      video.currentTime = 0;
      video.play();

      // Render frames
      const renderFrame = () => {
        if (video.currentTime >= duration) {
          recorder.stop();
          video.pause();
          return;
        }

        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Find current scene and render text
        const currentScene = template.scenes.find((scene: any) => 
          video.currentTime >= scene.start && video.currentTime < scene.end
        );

        if (currentScene) {
          this.renderTextOverlay(ctx, currentScene, content, canvas.width, canvas.height);
        }

        requestAnimationFrame(renderFrame);
      };

      video.ontimeupdate = renderFrame;
    });
  }

  private renderTextOverlay(
    ctx: CanvasRenderingContext2D, 
    scene: any, 
    content: Record<string, string>,
    width: number,
    height: number
  ) {
    const text = this.replaceVariables(scene.text.content, content);
    const style = scene.text.style;
    const pos = scene.text.position;

    // Set text style
    ctx.font = `${style.fontWeight} ${style.fontSize}px Arial`;
    ctx.fillStyle = style.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add stroke if specified
    if (style.stroke) {
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = style.strokeWidth || 2;
      ctx.strokeText(text, (pos.x / 100) * width, (pos.y / 100) * height);
    }

    // Fill text
    ctx.fillText(text, (pos.x / 100) * width, (pos.y / 100) * height);
  }

  private replaceVariables(text: string, content: Record<string, string>): string {
    let result = text;
    Object.entries(content).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  }
}

export const clientVideoRenderer = new ClientVideoRenderer();
