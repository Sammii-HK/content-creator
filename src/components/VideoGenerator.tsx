'use client';

import { useState, useRef, useEffect } from 'react';
import { PlayIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

// Helper functions
const renderTextOverlay = (
  ctx: CanvasRenderingContext2D,
  scene: Record<string, unknown>,
  content: Record<string, string>
) => {
  try {
    // Safely extract text properties with defaults
    const sceneText = (scene.text as any) || {};
    const textContent = sceneText.content || '';
    const style = sceneText.style || {};
    const pos = sceneText.position || { x: 50, y: 50 };

    // Replace template variables
    const text = replaceVariables(textContent, content);
    if (!text || text.trim() === '') {
      return; // Don't render empty text
    }

    // Calculate position in pixels (position is percentage 0-100)
    const x = (pos.x / 100) * ctx.canvas.width;
    const y = (pos.y / 100) * ctx.canvas.height;

    // Set text properties with defaults
    const fontSize = style.fontSize || 48;
    const fontWeight = style.fontWeight || 'bold';
    const fontFamily = style.fontFamily || 'Arial, sans-serif';
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text stroke/outline if specified
    if (style.stroke && style.strokeWidth) {
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = style.strokeWidth;
      ctx.strokeText(text, x, y);
    }

    // Fill text with color
    ctx.fillStyle = style.color || '#ffffff';
    ctx.fillText(text, x, y);
  } catch (error) {
    console.error('Error rendering text overlay:', error, {
      scene,
      availableContent: Object.keys(content),
    });
  }
};

// Shared function to calculate scene-to-video mapping
const getSceneVideoMapping = (
  scenes: any[],
  sourceVideoDuration: number
): Array<{
  outputStart: number;
  outputEnd: number;
  videoStart: number;
  videoEnd: number;
  scene: any;
}> => {
  return scenes.map((scene: any, index: number) => {
    if (scene.videoStart !== undefined && scene.videoEnd !== undefined) {
      // Use explicit video segment if provided
      return {
        outputStart: scene.start,
        outputEnd: scene.end,
        videoStart: scene.videoStart,
        videoEnd: scene.videoEnd,
        scene: scene,
      };
    } else {
      // Distribute scenes evenly across source video
      const sceneDuration = scene.end - scene.start;
      const totalScenes = scenes.length;
      const videoSegmentDuration = sourceVideoDuration / totalScenes;
      const videoStart = index * videoSegmentDuration;
      const videoEnd = Math.min(videoStart + sceneDuration, sourceVideoDuration);

      return {
        outputStart: scene.start,
        outputEnd: scene.end,
        videoStart: videoStart,
        videoEnd: videoEnd,
        scene: scene,
      };
    }
  });
};

const replaceVariables = (text: string, content: Record<string, string>): string => {
  let result = text;

  // Find all template variables in the text
  const variablePattern = /\{\{(\w+)\}\}/g;
  const foundVariables = new Set<string>();
  let match;
  while ((match = variablePattern.exec(text)) !== null) {
    foundVariables.add(match[1]);
  }

  // Replace each variable
  foundVariables.forEach((varName) => {
    const value = content[varName];
    if (value !== undefined && value !== null && value !== '') {
      result = result.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value);
    } else {
      // Variable not found - log warning and leave placeholder or use fallback
      console.warn(
        `⚠️ Template variable "{{${varName}}}" not found in content. Available keys:`,
        Object.keys(content)
      );
      // Optionally remove the placeholder or show a message
      result = result.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), `[${varName}]`);
    }
  });

  return result;
};

interface VideoGeneratorProps {
  videoUrl: string;
  template: Record<string, unknown>;
  content: Record<string, string>;
  onComplete?: (videoBlob: Blob) => void;
}

export default function VideoGenerator({
  videoUrl,
  template,
  content,
  onComplete,
}: VideoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(true); // Start with preview enabled

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const previewAnimationRef = useRef<number | null>(null);
  const previewStartTimeRef = useRef<number | null>(null);
  const previewLastSceneIndexRef = useRef<number>(-1);

  const generateVideo = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsGenerating(true);
    setProgress(0);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    // Log template and content info for debugging
    const scenes = (template.scenes as any[]) || [];
    console.log('🎬 Starting video generation:', {
      templateDuration: template.duration,
      sceneCount: scenes.length,
      availableContent: Object.keys(content),
      scenes: scenes.map((s: any) => ({
        outputTime: `${s.start}s-${s.end}s`,
        textContent: s.text?.content || 'No text',
        variables: (s.text?.content || '').match(/\{\{(\w+)\}\}/g) || [],
      })),
    });

    // Set canvas size for vertical video
    canvas.width = 1080;
    canvas.height = 1920;

    try {
      // Wait for video to be ready
      if (video.readyState < 2) {
        await new Promise<void>((resolve) => {
          const handleCanPlay = () => {
            video.removeEventListener('canplay', handleCanPlay);
            resolve();
          };
          video.addEventListener('canplay', handleCanPlay);
          video.load();
        });
      }

      // Set up recording
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const recordingPromise = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          if (blob.size > 0) {
            resolve(blob);
          } else {
            reject(new Error('Empty video blob'));
          }
        };
        recorder.onerror = (e) => {
          reject(new Error('Recording error'));
        };
      });

      // Start recording
      recorder.start(100); // Collect data every 100ms

      const scenes = (template.scenes as any[]) || [];
      const duration = ((template.duration as number) || 10) * 1000; // Convert to milliseconds
      const sourceVideoDuration = video.duration || 30; // Fallback if duration not available

      // Map scenes to source video times using shared function
      const sceneVideoMapping = getSceneVideoMapping(scenes, sourceVideoDuration);

      console.log('🎬 Scene-to-video mapping:', sceneVideoMapping);

      // Render loop
      const startTime = Date.now();
      let lastSceneIndex = -1;
      let animationFrameId: number;

      const renderFrame = () => {
        const elapsed = Date.now() - startTime;
        const outputTime = elapsed / 1000; // Output video time in seconds

        setProgress((elapsed / duration) * 100);

        if (elapsed >= duration) {
          recorder.stop();
          video.pause();
          return;
        }

        // Find current scene based on output time
        const currentMapping =
          sceneVideoMapping.find(
            (m: any) => outputTime >= m.outputStart && outputTime < m.outputEnd
          ) || sceneVideoMapping[0];

        if (!currentMapping) {
          animationFrameId = requestAnimationFrame(renderFrame);
          return;
        }

        // Calculate position within current scene (0-1)
        const sceneProgress =
          (outputTime - currentMapping.outputStart) /
          (currentMapping.outputEnd - currentMapping.outputStart);

        // Map to source video time
        const sourceVideoTime =
          currentMapping.videoStart +
          sceneProgress * (currentMapping.videoEnd - currentMapping.videoStart);

        // Seek video to correct position if scene changed
        const currentSceneIndex = sceneVideoMapping.indexOf(currentMapping);
        if (currentSceneIndex !== lastSceneIndex) {
          // Scene changed - seek to start of this scene's video segment
          const sceneStartTime = currentMapping.videoStart;
          console.log(
            `🎞️ Scene ${currentSceneIndex + 1}: Jumping to ${sceneStartTime.toFixed(2)}s in source video (output ${currentMapping.outputStart.toFixed(2)}-${currentMapping.outputEnd.toFixed(2)}s)`
          );
          video.currentTime = Math.max(0, Math.min(sceneStartTime, sourceVideoDuration));
          lastSceneIndex = currentSceneIndex;
          setCurrentScene(currentSceneIndex);
        } else {
          // Within same scene - map output progress to video segment progress
          // Calculate how far through the scene we are (0-1)
          const sceneProgress =
            (outputTime - currentMapping.outputStart) /
            (currentMapping.outputEnd - currentMapping.outputStart);
          // Map to position within video segment
          const targetVideoTime =
            currentMapping.videoStart +
            sceneProgress * (currentMapping.videoEnd - currentMapping.videoStart);

          // Only seek if video has drifted significantly (let it play naturally otherwise)
          const currentVideoTime = video.currentTime;
          const expectedVideoTime = targetVideoTime;
          const drift = Math.abs(currentVideoTime - expectedVideoTime);

          // If video has drifted more than 0.15 seconds, correct it (reduced for smoother playback)
          if (drift > 0.15) {
            const seekTime = Math.max(0, Math.min(targetVideoTime, sourceVideoDuration));
            video.currentTime = seekTime;
          }
        }

        // Ensure video is playing
        if (video.paused) {
          video.play().catch(console.error);
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw video frame (crop to vertical) - ensure video is ready
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          const videoAspect = video.videoWidth / video.videoHeight;
          const targetAspect = 9 / 16;

          let drawWidth, drawHeight, drawX, drawY;

          if (videoAspect > targetAspect) {
            // Video is wider - crop sides
            drawHeight = canvas.height;
            drawWidth = drawHeight * videoAspect;
            drawX = (canvas.width - drawWidth) / 2;
            drawY = 0;
          } else {
            // Video is taller - crop top/bottom
            drawWidth = canvas.width;
            drawHeight = drawWidth / videoAspect;
            drawX = 0;
            drawY = (canvas.height - drawHeight) / 2;
          }

          ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);

          // Render text overlay for current scene
          if (currentMapping.scene && currentMapping.scene.text) {
            try {
              renderTextOverlay(ctx, currentMapping.scene, content);
            } catch (error) {
              console.error('Error rendering text overlay:', error, {
                scene: currentMapping.scene,
                availableContent: Object.keys(content),
              });
            }
          }
        }

        animationFrameId = requestAnimationFrame(renderFrame);
      };

      // Initialize video position
      video.currentTime = sceneVideoMapping[0]?.videoStart || 0;
      await video.play();
      renderFrame();

      // Wait for recording to complete
      const videoBlob = await recordingPromise;
      console.log(
        '🎥 Video recording complete, blob size:',
        videoBlob.size,
        'bytes, type:',
        videoBlob.type
      );
      const videoUrl = URL.createObjectURL(videoBlob);
      setGeneratedVideo(videoUrl);

      if (onComplete) {
        console.log('📞 Calling onComplete callback...');
        onComplete(videoBlob);
      } else {
        console.warn('⚠️ No onComplete callback provided');
      }
    } catch (error) {
      console.error('Video generation failed:', error);
      alert('Video generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const downloadVideo = () => {
    if (!generatedVideo) return;

    const a = document.createElement('a');
    a.href = generatedVideo;
    a.download = `smart-content-${Date.now()}.webm`;
    a.click();
  };

  // Preview rendering function - uses same scene mapping logic as generation
  const renderPreviewFrame = () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !isPreviewMode ||
      isGenerating ||
      generatedVideo
    ) {
      if (previewAnimationRef.current) {
        cancelAnimationFrame(previewAnimationRef.current);
        previewAnimationRef.current = null;
      }
      previewStartTimeRef.current = null;
      previewLastSceneIndexRef.current = -1;
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      previewAnimationRef.current = requestAnimationFrame(renderPreviewFrame);
      return;
    }

    // Initialize preview start time if not set
    if (previewStartTimeRef.current === null) {
      previewStartTimeRef.current = Date.now();
    }

    // Set canvas internal resolution (for rendering quality)
    const displayWidth = canvas.clientWidth || 540;
    const displayHeight = canvas.clientHeight || 960;
    const scale = window.devicePixelRatio || 1;
    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;
    ctx.scale(scale, scale);

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Draw video frame
    if (video.readyState >= 2 && video.videoWidth > 0 && video.duration > 0) {
      const scenes = (template.scenes as any[]) || [];
      const templateDuration = ((template.duration as number) || 10) * 1000; // milliseconds
      const sourceVideoDuration = video.duration;

      // Calculate output time based on elapsed preview time (looping)
      const elapsed = Date.now() - previewStartTimeRef.current;
      const outputTime = (elapsed % templateDuration) / 1000; // Output video time in seconds

      // Get scene-to-video mapping using shared function
      const sceneVideoMapping = getSceneVideoMapping(scenes, sourceVideoDuration);

      // Find current scene based on output time
      const currentMapping =
        sceneVideoMapping.find(
          (m: any) => outputTime >= m.outputStart && outputTime < m.outputEnd
        ) || sceneVideoMapping[0];

      if (currentMapping) {
        // Calculate position within current scene (0-1)
        const sceneProgress =
          (outputTime - currentMapping.outputStart) /
          (currentMapping.outputEnd - currentMapping.outputStart);

        // Map to source video time
        const targetVideoTime =
          currentMapping.videoStart +
          sceneProgress * (currentMapping.videoEnd - currentMapping.videoStart);

        // Seek video to correct position if scene changed or drifted
        const currentSceneIndex = sceneVideoMapping.indexOf(currentMapping);
        const currentVideoTime = video.currentTime;
        const drift = Math.abs(currentVideoTime - targetVideoTime);

        if (currentSceneIndex !== previewLastSceneIndexRef.current) {
          // Scene changed - seek to start of this scene's video segment
          const seekTime = Math.max(0, Math.min(currentMapping.videoStart, sourceVideoDuration));
          if (Math.abs(video.currentTime - seekTime) > 0.1) {
            video.currentTime = seekTime;
          }
          previewLastSceneIndexRef.current = currentSceneIndex;
          setCurrentScene(currentSceneIndex);
        } else if (drift > 0.2) {
          // Within same scene but drifted - correct position (reduced threshold for smoother playback)
          const seekTime = Math.max(0, Math.min(targetVideoTime, sourceVideoDuration));
          video.currentTime = seekTime;
        }

        // Ensure video is playing
        if (video.paused) {
          video.play().catch(console.error);
        }

        // Draw video frame (crop to vertical)
        const videoAspect = video.videoWidth / video.videoHeight;
        const targetAspect = 9 / 16;

        let drawWidth, drawHeight, drawX, drawY;

        if (videoAspect > targetAspect) {
          // Video is wider - crop sides
          drawHeight = displayHeight;
          drawWidth = drawHeight * videoAspect;
          drawX = (displayWidth - drawWidth) / 2;
          drawY = 0;
        } else {
          // Video is taller - crop top/bottom
          drawWidth = displayWidth;
          drawHeight = drawWidth / videoAspect;
          drawX = 0;
          drawY = (displayHeight - drawHeight) / 2;
        }

        ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);

        // Render text overlay for current scene
        if (currentMapping.scene && currentMapping.scene.text) {
          renderTextOverlay(ctx, currentMapping.scene, content);
        }
      }
    }

    previewAnimationRef.current = requestAnimationFrame(renderPreviewFrame);
  };

  // Start/stop preview rendering
  useEffect(() => {
    if (
      isPreviewMode &&
      !isGenerating &&
      !generatedVideo &&
      videoRef.current &&
      canvasRef.current
    ) {
      const video = videoRef.current;

      // Reset preview timing when video metadata loads
      const handleLoadedMetadata = () => {
        previewStartTimeRef.current = Date.now();
        previewLastSceneIndexRef.current = -1;
        if (video.readyState >= 2) {
          const scenes = (template.scenes as any[]) || [];
          if (scenes.length > 0 && video.duration > 0) {
            const sceneVideoMapping = getSceneVideoMapping(scenes, video.duration);
            if (sceneVideoMapping.length > 0) {
              video.currentTime = sceneVideoMapping[0].videoStart;
            }
          }
          video.play().catch(console.error);
          renderPreviewFrame();
        }
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);

      if (video.readyState >= 2) {
        video.play().catch(console.error);
        renderPreviewFrame();
      }

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        if (previewAnimationRef.current) {
          cancelAnimationFrame(previewAnimationRef.current);
        }
      };
    } else {
      if (previewAnimationRef.current) {
        cancelAnimationFrame(previewAnimationRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewMode, isGenerating, generatedVideo, videoUrl, template, content]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Video Generator</h3>
          <p className="text-xs text-gray-500 mt-1">
            {isPreviewMode && !generatedVideo && 'Live preview • '}
            {isGenerating && 'Generating final video • '}
            {generatedVideo && '✓ Generated video ready'}
          </p>
        </div>
        <div className="flex space-x-2">
          {!generatedVideo && (
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={clsx(
                'flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors',
                isPreviewMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <EyeIcon className="h-4 w-4" />
              <span>Preview</span>
            </button>
          )}
        </div>
      </div>

      {/* Video Preview Area */}
      <div className="mb-6">
        <div className="bg-black rounded-lg aspect-[9/16] max-w-xs mx-auto relative overflow-hidden">
          {/* Source video (always hidden, used for canvas rendering) */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="hidden"
            crossOrigin="anonymous"
            preload="auto"
            muted
            loop
            playsInline
          />

          {/* Canvas for preview and generation */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              display: (isPreviewMode || isGenerating) && !generatedVideo ? 'block' : 'none',
            }}
          />

          {/* Generated video */}
          {generatedVideo && (
            <div className="relative w-full h-full">
              <video
                ref={previewRef}
                src={generatedVideo}
                className="w-full h-full object-cover"
                controls
                loop
                autoPlay
              />
              <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                ✓ GENERATED
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-semibold text-blue-900">Generating final video...</span>
            </div>
            <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-blue-700 mt-2">
            This may take a few moments. The video is being recorded with text overlays.
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={generateVideo}
          disabled={isGenerating}
          className={clsx(
            'flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors',
            isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          )}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4" />
              <span>Generate Video</span>
            </>
          )}
        </button>

        {generatedVideo && (
          <button
            onClick={downloadVideo}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>Download</span>
          </button>
        )}
      </div>

      {/* Template Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">
          Template: {(template.name as string) || 'Custom'}
        </h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Duration: {(template.duration as number) || 10}s</p>
          <p>Scenes: {(template.scenes as any[])?.length || 0}</p>
          <p>
            Content:{' '}
            {Object.entries(content)
              .map(([k, v]) => {
                const valueStr =
                  typeof v === 'string'
                    ? v
                    : Array.isArray(v)
                      ? (v as unknown as string[]).join(', ')
                      : String(v || '');
                return `${k}: "${valueStr.slice(0, 30)}${valueStr.length > 30 ? '...' : ''}"`;
              })
              .join(', ')}
          </p>
        </div>
      </div>

      {/* Cost Info */}
      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 rounded-full p-1">
            <span className="text-green-600 text-xs font-bold">$0</span>
          </div>
          <p className="text-sm text-green-800 font-medium">
            Free client-side video generation • Unlimited videos • No server costs
          </p>
        </div>
      </div>
    </div>
  );
}
