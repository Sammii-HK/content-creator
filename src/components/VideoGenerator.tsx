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
      console.warn('⚠️ Empty text content after variable replacement:', {
        originalContent: textContent,
        availableContent: Object.keys(content),
        contentValues: content,
      });
      return; // Don't render empty text
    }

    // Calculate position in pixels (position is percentage 0-100)
    // IMPORTANT: Use display dimensions, not scaled canvas dimensions, since context is already scaled
    // The canvas.width/height are scaled (displayWidth * scale), but ctx is scaled by scale,
    // so we need to use display dimensions for coordinates
    const displayWidth = ctx.canvas.width / (window.devicePixelRatio || 1);
    const displayHeight = ctx.canvas.height / (window.devicePixelRatio || 1);
    const x = (pos.x / 100) * displayWidth;
    const y = (pos.y / 100) * displayHeight;

    // Set text properties with defaults
    const fontSize = style.fontSize || 48;
    const fontWeight = style.fontWeight || 'bold';
    const fontFamily = style.fontFamily || 'Arial, sans-serif';
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text stroke/outline if specified (render stroke first, then fill)
    if (style.stroke && style.strokeWidth) {
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = style.strokeWidth;
      ctx.strokeText(text, x, y);
    }

    // Fill text with color (always render fill for visibility)
    ctx.fillStyle = style.color || '#ffffff';
    ctx.fillText(text, x, y);

    // Verify text was actually drawn by checking if pixel changed
    // IMPORTANT: getImageData uses canvas coordinates (scaled), not display coordinates
    const scale = window.devicePixelRatio || 1;
    const testX = Math.floor(x * scale);
    const testY = Math.floor(y * scale);
    if (testX >= 0 && testX < ctx.canvas.width && testY >= 0 && testY < ctx.canvas.height) {
      const imageData = ctx.getImageData(testX, testY, 1, 1);
      const pixel = imageData.data;
      const hasColor = pixel[0] > 0 || pixel[1] > 0 || pixel[2] > 0; // Check if pixel has color

      // Always log text rendering for debugging
      console.log('✅ TEXT RENDERED:', {
        text: text.substring(0, 100),
        fullText: text,
        position: `(${x.toFixed(0)}, ${y.toFixed(0)})`,
        fontSize,
        color: style.color || '#ffffff',
        stroke: style.stroke || 'none',
        canvasSize: `${ctx.canvas.width}x${ctx.canvas.height}`,
        pixelAtPosition: `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]})`,
        textVisible: hasColor ? 'YES' : 'NO - PIXEL IS BLACK/EMPTY',
        warning: !hasColor ? '⚠️ Text may not be visible - check color/position' : undefined,
      });

      if (!hasColor) {
        console.error('❌ TEXT NOT VISIBLE! Pixel at text position is black/empty:', {
          expectedColor: style.color || '#ffffff',
          actualPixel: `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]})`,
          textPosition: `(${x}, ${y})`,
          canvasSize: `${ctx.canvas.width}x${ctx.canvas.height}`,
        });
      }
    } else {
      console.error('❌ TEXT POSITION OUT OF BOUNDS!', {
        position: `(${x}, ${y})`,
        canvasSize: `${ctx.canvas.width}x${ctx.canvas.height}`,
        text: text.substring(0, 50),
      });
    }
  } catch (error) {
    console.error('❌ Error rendering text overlay:', error, {
      scene,
      availableContent: Object.keys(content),
      sceneText: scene.text as any,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
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
  sceneIndex: number;
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
        sceneIndex: index,
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
        sceneIndex: index,
      };
    }
  });
};

// Variable name mapping - maps common template variable names to content keys
const VARIABLE_MAPPING: Record<string, string[]> = {
  // body variations
  body: ['content', 'body', 'script'],
  content: ['content', 'body', 'script'],
  script: ['script', 'content', 'body'],

  // CTA variations
  cta: ['callToAction', 'cta', 'caption'],
  callToAction: ['callToAction', 'cta'],

  // Hook variations
  hook: ['hook', 'title', 'question'],
  title: ['title', 'hook'],

  // Answer variations
  answer: ['answer', 'content', 'body'],

  // Question variations
  question: ['question', 'hook'],

  // Items variations
  items: ['items', 'item1', 'item2', 'item3'],
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
    let value: string | undefined = content[varName];

    // If not found, try variable mapping
    if (!value || value === '') {
      const mappings = VARIABLE_MAPPING[varName.toLowerCase()];
      if (mappings) {
        // Try each mapped key in order
        for (const mappedKey of mappings) {
          value = content[mappedKey];
          if (value && value !== '') {
            console.log(`✅ Mapped variable "{{${varName}}}" to content key "${mappedKey}"`);
            break;
          }
        }
      }
    }

    // Also try case-insensitive search as fallback
    if (!value || value === '') {
      const lowerVarName = varName.toLowerCase();
      for (const [key, val] of Object.entries(content)) {
        if (key.toLowerCase() === lowerVarName) {
          value = val;
          console.log(`✅ Found case-insensitive match: "{{${varName}}}" -> "${key}"`);
          break;
        }
      }
    }

    if (value !== undefined && value !== null && value !== '') {
      result = result.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value);
      console.log(
        `✅ Replaced "{{${varName}}}" with: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`
      );
    } else {
      // Variable not found - log warning and leave placeholder or use fallback
      console.warn(
        `⚠️ Template variable "{{${varName}}}" not found in content. Available keys:`,
        Object.keys(content),
        `\nTried mappings:`,
        VARIABLE_MAPPING[varName.toLowerCase()] || 'none'
      );
      // Optionally remove the placeholder or show a message
      result = result.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), `[${varName}]`);
    }
  });

  return result;
};

// IndexedDB helper for caching generated videos
const getVideoCacheKey = (
  template: Record<string, unknown>,
  content: Record<string, string | string[]>
) => {
  const contentHash = Object.entries(content)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${typeof v === 'string' ? v : v.join(',')}`)
    .join('|');
  return `video_${template.duration}_${contentHash.slice(0, 100)}`;
};

const openVideoCacheDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VideoCache', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos');
      }
    };
  });
};

const getCachedVideo = async (key: string): Promise<Blob | null> => {
  try {
    const db = await openVideoCacheDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['videos'], 'readonly');
      const store = transaction.objectStore('videos');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to get cached video:', error);
    return null;
  }
};

const saveCachedVideo = async (key: string, blob: Blob): Promise<void> => {
  try {
    const db = await openVideoCacheDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['videos'], 'readwrite');
      const store = transaction.objectStore('videos');
      const request = store.put(blob, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to cache video:', error);
  }
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
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true); // Preview play/pause state
  const [showDebugPanel, setShowDebugPanel] = useState(false); // Debug panel visibility

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const previewAnimationRef = useRef<number | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const previewStartTimeRef = useRef<number | null>(null);
  const previewLastSceneIndexRef = useRef<number>(-1);
  const isSeekingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const previewSceneMappingCacheRef = useRef<any[] | null>(null);
  const previewCurrentMappingCacheRef = useRef<any | null>(null);
  const previewDrawDimensionsCacheRef = useRef<{
    drawWidth: number;
    drawHeight: number;
    drawX: number;
    drawY: number;
  } | null>(null);

  const generateVideo = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Check cache first
    const cacheKey = getVideoCacheKey(template, content);
    const cachedBlob = await getCachedVideo(cacheKey);

    if (cachedBlob) {
      console.log('✅ Using cached video from IndexedDB');
      const videoUrl = URL.createObjectURL(cachedBlob);
      setGeneratedVideo(videoUrl);
      if (onComplete) {
        onComplete(cachedBlob);
      }
      return;
    }

    console.log('🎬 Generating new video (not in cache)');
    setIsGenerating(true);
    setProgress(0);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    // Log template and content info for debugging - COMPREHENSIVE TEXT LOGGING
    const scenes = (template.scenes as any[]) || [];
    console.log('🎬 ========== VIDEO GENERATION START ==========');
    console.log('📋 Template Info:', {
      templateDuration: template.duration,
      sceneCount: scenes.length,
      availableContent: Object.keys(content),
      contentValues: content,
    });

    console.log('📝 ALL SCENES AND EXPECTED TEXT:');
    scenes.forEach((s: any, index: number) => {
      const textContent = s.text?.content || 'NO TEXT DEFINED';
      const variables = textContent.match(/\{\{(\w+)\}\}/g) || [];
      const replacedText = replaceVariables(textContent, content);

      console.log(`  Scene ${index + 1} (${s.start}s - ${s.end}s):`, {
        originalText: textContent,
        variablesFound: variables,
        replacedText: replacedText,
        hasTextObject: !!s.text,
        textObject: s.text,
        position: s.text?.position,
        style: s.text?.style,
        willRender:
          replacedText.trim() !== '' &&
          replacedText !== textContent.replace(/\{\{(\w+)\}\}/g, '[$1]'),
      });
    });
    console.log('🎬 ============================================');

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

      // Cache expensive calculations that don't change
      // Ensure we have valid video dimensions
      const videoWidth = video.videoWidth || 1920;
      const videoHeight = video.videoHeight || 1080;
      const videoAspect = videoWidth / videoHeight;
      const targetAspect = 9 / 16; // 0.5625 for vertical video
      let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

      // Pre-calculate draw dimensions (only changes if video dimensions change)
      // For 9:16 output, we need to fit the video properly
      if (videoAspect > targetAspect) {
        // Video is wider than 9:16 - crop sides (letterbox)
        drawHeight = canvas.height; // Fill full height (1920)
        drawWidth = drawHeight * videoAspect; // Calculate width based on video aspect
        drawX = (canvas.width - drawWidth) / 2; // Center horizontally
        drawY = 0;
      } else {
        // Video is taller or same as 9:16 - crop top/bottom (pillarbox)
        drawWidth = canvas.width; // Fill full width (1080)
        drawHeight = drawWidth / videoAspect; // Calculate height based on video aspect
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2; // Center vertically
      }

      console.log('📐 Aspect ratio calculation:', {
        videoSize: `${videoWidth}x${videoHeight}`,
        videoAspect: videoAspect.toFixed(3),
        targetAspect: targetAspect.toFixed(3),
        canvasSize: `${canvas.width}x${canvas.height}`,
        drawSize: `${drawWidth.toFixed(0)}x${drawHeight.toFixed(0)}`,
        drawPosition: `(${drawX.toFixed(0)}, ${drawY.toFixed(0)})`,
      });

      // Render loop
      const startTime = Date.now();
      let lastSceneIndex = -1;
      let currentMappingCache: any = sceneVideoMapping[0]; // Cache current scene
      let animationFrameId: number;
      let lastGoodFrame: ImageData | null = null; // Store last good frame to prevent flashes
      let nextSceneSeekTime: number | null = null; // Pre-seek to next scene to prevent flashes
      const PRE_SEEK_BUFFER = 0.1; // Seek 100ms before scene cut

      const renderFrame = () => {
        const elapsed = Date.now() - startTime;
        const outputTime = elapsed / 1000; // Output video time in seconds

        setProgress((elapsed / duration) * 100);

        if (elapsed >= duration) {
          recorder.stop();
          video.pause();
          return;
        }

        // Find current scene based on output time (optimized: check cached scene first)
        let currentMapping = currentMappingCache;

        // Only search if we're outside the cached scene's time range
        if (outputTime < currentMapping.outputStart || outputTime >= currentMapping.outputEnd) {
          // Find new scene (linear search, but only when scene changes)
          currentMapping =
            sceneVideoMapping.find(
              (m: any) => outputTime >= m.outputStart && outputTime < m.outputEnd
            ) || sceneVideoMapping[0];
          currentMappingCache = currentMapping;
        }

        if (!currentMapping) {
          animationFrameId = requestAnimationFrame(renderFrame);
          return;
        }

        // Calculate position within current scene (0-1) - cache scene duration
        const sceneDuration = currentMapping.outputEnd - currentMapping.outputStart;
        const sceneProgress = (outputTime - currentMapping.outputStart) / sceneDuration;

        // Map to source video time - cache video segment duration
        const videoSegmentDuration = currentMapping.videoEnd - currentMapping.videoStart;

        // Seek video to correct position if scene changed
        // Use cached index if available, otherwise find it
        const currentSceneIndex =
          currentMapping === currentMappingCache && lastSceneIndex >= 0
            ? lastSceneIndex
            : sceneVideoMapping.indexOf(currentMapping);
        let seekTime = 0;

        // PRE-SEEK: If we're close to the end of a scene, pre-seek to the next scene
        const timeUntilNextScene = currentMapping.outputEnd - outputTime;
        if (timeUntilNextScene <= PRE_SEEK_BUFFER && timeUntilNextScene > 0) {
          const nextSceneIndex = currentSceneIndex + 1;
          if (nextSceneIndex < sceneVideoMapping.length && !nextSceneSeekTime) {
            const nextMapping = sceneVideoMapping[nextSceneIndex];
            nextSceneSeekTime = nextMapping.videoStart;
            console.log(
              `⏩ Pre-seeking to next scene ${nextSceneIndex + 1} at ${nextSceneSeekTime.toFixed(2)}s (${timeUntilNextScene.toFixed(2)}s before cut)`
            );
            isSeekingRef.current = true;
            video.currentTime = nextSceneSeekTime;
            video.addEventListener(
              'seeked',
              () => {
                isSeekingRef.current = false;
              },
              { once: true }
            );
          }
        }

        if (currentSceneIndex !== lastSceneIndex) {
          // Scene changed - seek to start of this scene's video segment
          seekTime = Math.max(0, Math.min(currentMapping.videoStart, sourceVideoDuration));
          console.log(
            `🎞️ Scene ${currentSceneIndex + 1}: Jumping to ${seekTime.toFixed(2)}s in source video (output ${currentMapping.outputStart.toFixed(2)}-${currentMapping.outputEnd.toFixed(2)}s)`
          );

          // Reset pre-seek flag
          nextSceneSeekTime = null;

          // Set seeking flag and seek video (non-blocking)
          isSeekingRef.current = true;
          const handleSeeked = () => {
            video.removeEventListener('seeked', handleSeeked);
            // Wait for frame to be ready using double RAF for smooth transition
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                // Double-check video is ready and at correct position
                if (video.readyState >= 2 && Math.abs(video.currentTime - seekTime) < 0.1) {
                  isSeekingRef.current = false;
                } else {
                  // If not ready, wait a bit more
                  setTimeout(() => {
                    isSeekingRef.current = false;
                  }, 100);
                }
              });
            });
          };
          video.addEventListener('seeked', handleSeeked, { once: true });
          video.currentTime = seekTime;
          // Fallback timeout in case seeked event doesn't fire
          setTimeout(() => {
            video.removeEventListener('seeked', handleSeeked);
            isSeekingRef.current = false;
          }, 500);

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

          // If video has drifted more than 0.3 seconds, correct it (increased threshold to reduce CPU usage)
          if (drift > 0.3) {
            seekTime = Math.max(0, Math.min(targetVideoTime, sourceVideoDuration));
            video.currentTime = seekTime;
          }
        }

        // Ensure video is playing
        if (video.paused) {
          video.play().catch(console.error);
        }

        // CRITICAL: ALWAYS draw a frame - MediaRecorder needs consistent frames
        // Never skip drawing, even when seeking - use last good frame if needed
        const videoReady = video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
        const notSeeking = !isSeekingRef.current;

        // Draw video frame (or reuse last good frame if seeking)
        if (videoReady && notSeeking) {
          // Draw fresh video frame
          ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
          // Save this frame as the last good frame (WITHOUT text, so we can add text on top)
          // Create a temporary canvas to save just the video frame
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d')!;
          tempCtx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
          lastGoodFrame = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
        } else if (lastGoodFrame) {
          // If seeking or not ready, reuse last good frame to prevent flashes
          ctx.putImageData(lastGoodFrame, 0, 0);
        } else {
          // No good frame yet - fill with black
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // CRITICAL: ALWAYS render text overlay if scene has text - regardless of seeking state
        // This ensures text appears on every frame - render AFTER video frame
        if (currentMapping) {
          const scene = currentMapping.scene;
          const mappedSceneIndex = currentMapping.sceneIndex ?? currentSceneIndex;

          // Verify scene exists and has text
          if (!scene) {
            console.error(`❌ Scene ${mappedSceneIndex + 1} is null/undefined in mapping:`, {
              currentMapping,
              sceneIndex: currentSceneIndex,
              outputTime: outputTime.toFixed(2),
            });
          } else if (scene.text) {
            try {
              // Always render text, even during seeks - this goes on top of the video frame
              const textContent = (scene.text as any)?.content || '';
              const replacedText = replaceVariables(textContent, content);

              // Only log once per scene change to reduce console spam
              if (mappedSceneIndex !== previewLastSceneIndexRef.current) {
                if (replacedText && replacedText.trim() !== '') {
                  console.log(
                    `✅ Scene ${mappedSceneIndex + 1} text ready: "${replacedText.substring(0, 50)}${replacedText.length > 50 ? '...' : ''}"`
                  );
                } else {
                  console.warn(
                    `⚠️ Scene ${mappedSceneIndex + 1} has empty text after replacement:`,
                    {
                      original: textContent,
                      replaced: replacedText,
                      availableContent: Object.keys(content),
                    }
                  );
                }
              }

              // Always render text overlay
              renderTextOverlay(ctx, scene, content);
            } catch (error) {
              console.error(`❌ Error rendering text for Scene ${mappedSceneIndex + 1}:`, error, {
                sceneIndex: currentSceneIndex,
                scene,
                sceneText: scene.text,
                availableContent: Object.keys(content),
                outputTime: outputTime.toFixed(2),
              });
            }
          } else {
            // Log if scene exists but has no text (only once per scene)
            if (mappedSceneIndex !== previewLastSceneIndexRef.current) {
              console.warn(`⚠️ Scene ${mappedSceneIndex + 1} has no text property:`, {
                sceneStart: currentMapping.outputStart,
                sceneEnd: currentMapping.outputEnd,
                sceneKeys: Object.keys(scene),
                sceneObject: scene,
              });
            }
          }
        } else {
          console.warn(`⚠️ No scene mapping at ${outputTime.toFixed(2)}s:`, {
            currentMapping,
            sceneIndex: currentSceneIndex,
          });
        }

        animationFrameId = requestAnimationFrame(renderFrame);
      };

      // Initialize video position and wait for it to be ready before starting recording
      video.currentTime = sceneVideoMapping[0]?.videoStart || 0;

      // Wait for video to seek and be ready before starting render loop
      await new Promise<void>((resolve) => {
        const handleSeeked = () => {
          video.removeEventListener('seeked', handleSeeked);
          // Small delay to ensure frame is loaded
          setTimeout(() => {
            resolve();
          }, 50);
        };
        video.addEventListener('seeked', handleSeeked);
        // If already seeked, resolve immediately
        if (video.readyState >= 2) {
          setTimeout(() => resolve(), 50);
        }
      });

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

      // Cache the video in IndexedDB
      const cacheKey = getVideoCacheKey(template, content);
      await saveCachedVideo(cacheKey, videoBlob);
      console.log('💾 Video cached in IndexedDB with key:', cacheKey);

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
    // Debug: Log first few calls to verify it's being called
    if (Math.random() < 0.05) {
      console.log('🎨 renderPreviewFrame called', {
        hasVideoRef: !!videoRef.current,
        hasCanvasRef: !!canvasRef.current,
        isPreviewMode,
        isGenerating,
        hasGeneratedVideo: !!generatedVideo,
        isMounted: isMountedRef.current,
      });
    }

    if (
      !videoRef.current ||
      !canvasRef.current ||
      !isPreviewMode ||
      isGenerating ||
      generatedVideo
    ) {
      if (Math.random() < 0.1) {
        console.warn('⚠️ renderPreviewFrame early exit:', {
          hasVideoRef: !!videoRef.current,
          hasCanvasRef: !!canvasRef.current,
          isPreviewMode,
          isGenerating,
          hasGeneratedVideo: !!generatedVideo,
        });
      }
      if (previewAnimationRef.current) {
        cancelAnimationFrame(previewAnimationRef.current);
        previewAnimationRef.current = null;
      }
      previewStartTimeRef.current = null;
      previewLastSceneIndexRef.current = -1;
      // Clear caches when preview stops
      previewSceneMappingCacheRef.current = null;
      previewCurrentMappingCacheRef.current = null;
      previewDrawDimensionsCacheRef.current = null;
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('⚠️ Could not get 2d context from canvas');
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

    // Clear canvas with black background (so we can see if canvas is rendering)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Debug: Log canvas setup
    if (Math.random() < 0.01) {
      console.log('🎨 Canvas setup:', {
        displayWidth,
        displayHeight,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        scale,
        isPreviewMode,
        videoUrl: videoUrl.substring(0, 50) + '...',
      });
    }

    // Draw video frame
    if (video.readyState >= 2 && video.videoWidth > 0 && video.duration > 0) {
      const scenes = (template.scenes as any[]) || [];
      const templateDuration = ((template.duration as number) || 10) * 1000; // milliseconds
      const sourceVideoDuration = video.duration;

      // Calculate output time based on elapsed preview time
      const elapsed = Date.now() - previewStartTimeRef.current;
      const outputTime = (elapsed % templateDuration) / 1000; // Output video time in seconds (loops)

      // Auto-pause at the end of each loop cycle (when outputTime wraps back to ~0)
      const timeInCycle = elapsed % templateDuration;
      const cycleProgress = timeInCycle / templateDuration;
      const isNearEndOfCycle = cycleProgress > 0.98; // 98% through the cycle

      if (isNearEndOfCycle && isPreviewPlaying) {
        // Pause at the end of the cycle
        if (isMountedRef.current) {
          setIsPreviewPlaying(false);
        }
        video.pause();
      }

      // Clear any pending timeout when playing
      if (isPreviewPlaying && previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }

      // When paused, still render the current frame but check less frequently
      if (!isPreviewPlaying) {
        // Render current frame even when paused (so user can see it)
        // But schedule next check less frequently to save CPU
        if (previewTimeoutRef.current === null) {
          previewTimeoutRef.current = window.setTimeout(() => {
            if (isMountedRef.current) {
              previewAnimationRef.current = requestAnimationFrame(renderPreviewFrame);
            }
          }, 500);
        }
        // Continue rendering the current frame - don't return early
      }

      // Cache scene mapping (only recalculate if scenes or duration changed)
      let sceneVideoMapping = previewSceneMappingCacheRef.current;
      if (!sceneVideoMapping || sceneVideoMapping.length !== scenes.length) {
        sceneVideoMapping = getSceneVideoMapping(scenes, sourceVideoDuration);
        previewSceneMappingCacheRef.current = sceneVideoMapping;
      }

      // Find current scene based on output time (optimized: check cached scene first)
      let currentMapping = previewCurrentMappingCacheRef.current || sceneVideoMapping[0];

      // Only search if we're outside the cached scene's time range
      if (
        !currentMapping ||
        outputTime < currentMapping.outputStart ||
        outputTime >= currentMapping.outputEnd
      ) {
        // Find new scene (linear search, but only when scene changes)
        currentMapping =
          sceneVideoMapping.find(
            (m: any) => outputTime >= m.outputStart && outputTime < m.outputEnd
          ) || sceneVideoMapping[0];
        previewCurrentMappingCacheRef.current = currentMapping;
      }

      if (currentMapping) {
        // Calculate position within current scene (0-1) - cache scene duration
        const sceneDuration = currentMapping.outputEnd - currentMapping.outputStart;
        const sceneProgress = (outputTime - currentMapping.outputStart) / sceneDuration;

        // Map to source video time - cache video segment duration
        const videoSegmentDuration = currentMapping.videoEnd - currentMapping.videoStart;
        const targetVideoTime = currentMapping.videoStart + sceneProgress * videoSegmentDuration;

        // Seek video to correct position if scene changed or drifted
        // Use cached index if available, otherwise find it
        const currentSceneIndex =
          currentMapping === previewCurrentMappingCacheRef.current &&
          previewLastSceneIndexRef.current >= 0
            ? previewLastSceneIndexRef.current
            : sceneVideoMapping.indexOf(currentMapping);
        const currentVideoTime = video.currentTime;
        const drift = Math.abs(currentVideoTime - targetVideoTime);

        if (currentSceneIndex !== previewLastSceneIndexRef.current) {
          // Scene changed - seek to start of this scene's video segment
          const seekTime = Math.max(0, Math.min(currentMapping.videoStart, sourceVideoDuration));
          if (Math.abs(video.currentTime - seekTime) > 0.1) {
            isSeekingRef.current = true;
            video.currentTime = seekTime;

            // Wait for seek to complete and frame to be ready before allowing drawing
            video.addEventListener(
              'seeked',
              () => {
                // Small delay to ensure frame is fully loaded and rendered
                setTimeout(() => {
                  // Double-check video is ready and at correct position
                  if (video.readyState >= 2 && Math.abs(video.currentTime - seekTime) < 0.1) {
                    isSeekingRef.current = false;
                  } else {
                    // If not ready, wait a bit more
                    setTimeout(() => {
                      isSeekingRef.current = false;
                    }, 50);
                  }
                }, 50);
              },
              { once: true }
            );
          }
          previewLastSceneIndexRef.current = currentSceneIndex;
          if (isMountedRef.current) {
            setCurrentScene(currentSceneIndex);
          }
        } else if (drift > 0.4) {
          // Within same scene but drifted - correct position (increased threshold to reduce CPU usage)
          const seekTime = Math.max(0, Math.min(targetVideoTime, sourceVideoDuration));
          video.currentTime = seekTime;
        }

        // Ensure video is playing (only if preview is playing)
        if (isPreviewPlaying && video.paused) {
          video.play().catch(console.error);
        } else if (!isPreviewPlaying && !video.paused) {
          video.pause();
        }

        // Draw video frame - render even when paused (just don't update as frequently)
        const previewVideoReady =
          video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
        const previewNotSeeking = !isSeekingRef.current;

        // Debug: Log video state periodically (only every 60 frames to avoid spam)
        if (Math.random() < 0.017) {
          console.log('🎬 Preview video state:', {
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            duration: video.duration,
            currentTime: video.currentTime,
            previewVideoReady,
            previewNotSeeking,
            isPreviewPlaying,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            displayWidth,
            displayHeight,
          });
        }

        // Always render if video is ready - even when paused (just shows current frame)
        if (previewVideoReady && previewNotSeeking) {
          // Cache draw dimensions (only recalculate if video dimensions changed)
          let drawDims = previewDrawDimensionsCacheRef.current;
          // Check if video dimensions changed by comparing with cached values
          const videoWidth = video.videoWidth || 1920;
          const videoHeight = video.videoHeight || 1080;
          const videoAspect = videoWidth / videoHeight;
          const targetAspect = 9 / 16;
          const needsRecalc =
            !drawDims || Math.abs(videoAspect - drawDims.drawWidth / drawDims.drawHeight) > 0.001;

          if (needsRecalc) {
            if (videoAspect > targetAspect) {
              // Video is wider than 9:16 - crop sides (letterbox)
              const drawHeight = displayHeight;
              const drawWidth = drawHeight * videoAspect;
              drawDims = {
                drawWidth,
                drawHeight,
                drawX: (displayWidth - drawWidth) / 2,
                drawY: 0,
              };
            } else {
              // Video is taller or same as 9:16 - crop top/bottom (pillarbox)
              const drawWidth = displayWidth;
              const drawHeight = drawWidth / videoAspect;
              drawDims = {
                drawWidth,
                drawHeight,
                drawX: 0,
                drawY: (displayHeight - drawHeight) / 2,
              };
            }
            previewDrawDimensionsCacheRef.current = drawDims;
          }

          // Draw video frame - this covers the entire canvas area, preventing flashes
          if (drawDims) {
            try {
              ctx.drawImage(
                video,
                drawDims.drawX,
                drawDims.drawY,
                drawDims.drawWidth,
                drawDims.drawHeight
              );
              // Debug: Log successful draw occasionally
              if (Math.random() < 0.01) {
                console.log('✅ Video frame drawn to canvas:', {
                  drawX: drawDims.drawX,
                  drawY: drawDims.drawY,
                  drawWidth: drawDims.drawWidth,
                  drawHeight: drawDims.drawHeight,
                  videoWidth: video.videoWidth,
                  videoHeight: video.videoHeight,
                });
              }
            } catch (error) {
              console.error('❌ Error drawing video frame:', error);
            }
          } else {
            console.warn('⚠️ No drawDims calculated for preview');
          }
        } else {
          // Video not ready - draw a placeholder so user knows something is happening
          if (Math.random() < 0.01) {
            console.warn('⚠️ Video not ready for preview:', {
              readyState: video.readyState,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              previewNotSeeking,
            });
          }
          // Draw a placeholder background
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          ctx.fillStyle = '#ffffff';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Loading video...', displayWidth / 2, displayHeight / 2);
        }

        // CRITICAL: ALWAYS render text overlay if scene has text (even if video not ready)
        // This ensures text appears on every frame in preview too
        if (currentMapping && currentMapping.scene) {
          const scene = currentMapping.scene;
          // Check if scene has text property - be more lenient
          if (scene.text) {
            try {
              // Always render text for current scene - ensure it's rendered AFTER video frame
              renderTextOverlay(ctx, scene, content);
            } catch (error) {
              console.error('❌ Error rendering text overlay in preview:', error, {
                sceneIndex: currentSceneIndex,
                scene,
                sceneText: scene.text,
              });
            }
          } else {
            // Log missing text for debugging
            console.warn(`⚠️ Scene ${currentSceneIndex + 1} has no text property:`, {
              scene,
              sceneKeys: Object.keys(scene),
            });
          }
        } else {
          console.warn(`⚠️ No scene mapping found for scene ${currentSceneIndex + 1}:`, {
            currentMapping,
          });
        }
        // If seeking, keep previous frame visible to prevent flash
      }
    }

    // Schedule next frame
    if (isMountedRef.current) {
      if (isPreviewPlaying) {
        // When playing, use requestAnimationFrame for smooth animation
        previewAnimationRef.current = requestAnimationFrame(renderPreviewFrame);
      } else {
        // When paused, schedule next check with setTimeout (already handled above if needed)
        // The setTimeout is set in the paused check above, so we don't need to do anything here
        // But make sure we have a timeout scheduled
        if (previewTimeoutRef.current === null) {
          previewTimeoutRef.current = window.setTimeout(() => {
            if (isMountedRef.current) {
              previewAnimationRef.current = requestAnimationFrame(renderPreviewFrame);
            }
          }, 500);
        }
      }
    } else {
      previewAnimationRef.current = null;
    }
  };

  // Start/stop preview rendering
  useEffect(() => {
    console.log('🔍 Preview useEffect triggered:', {
      isPreviewMode,
      isGenerating,
      generatedVideo: !!generatedVideo,
      videoUrl: videoUrl ? videoUrl.substring(0, 50) + '...' : 'MISSING',
      hasTemplate: !!template,
      hasContent: !!content,
      hasVideoRef: !!videoRef.current,
      hasCanvasRef: !!canvasRef.current,
    });

    if (
      isPreviewMode &&
      !isGenerating &&
      !generatedVideo &&
      videoRef.current &&
      canvasRef.current
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      console.log('✅ Starting preview setup:', {
        videoSrc: video.src,
        videoUrl,
        videoReadyState: video.readyState,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        canvasClientWidth: canvas.clientWidth,
        canvasClientHeight: canvas.clientHeight,
      });

      // Reset preview timing when video metadata loads
      const handleLoadedMetadata = () => {
        console.log('🎬 Video metadata loaded!', {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          duration: video.duration,
          currentTime: video.currentTime,
        });
        previewStartTimeRef.current = Date.now();
        previewLastSceneIndexRef.current = -1;
        setIsPreviewPlaying(true); // Auto-play when video loads
        // Clear caches when video loads (new video = new dimensions/scenes)
        previewSceneMappingCacheRef.current = null;
        previewCurrentMappingCacheRef.current = null;
        previewDrawDimensionsCacheRef.current = null;

        if (video.readyState >= 2) {
          const scenes = (template.scenes as any[]) || [];
          if (scenes.length > 0 && video.duration > 0) {
            const sceneVideoMapping = getSceneVideoMapping(scenes, video.duration);
            previewSceneMappingCacheRef.current = sceneVideoMapping;
            previewCurrentMappingCacheRef.current = sceneVideoMapping[0];
            if (sceneVideoMapping.length > 0) {
              video.currentTime = sceneVideoMapping[0].videoStart;
            }
          }
          if (isPreviewPlaying) {
            video.play().catch((err) => {
              console.error('❌ Error playing video:', err);
            });
          }
          console.log('🚀 Calling renderPreviewFrame from handleLoadedMetadata');
          renderPreviewFrame();
        } else {
          console.warn('⚠️ Video readyState < 2 in handleLoadedMetadata:', video.readyState);
        }
      };

      const handleError = (e: Event) => {
        console.error('❌ Video error event:', e, {
          error: video.error,
          src: video.src,
          videoUrl,
        });
      };
      const handleLoadStart = () => {
        console.log('📥 Video loadstart event');
      };
      const handleCanPlay = () => {
        console.log('▶️ Video canplay event', {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
        });
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('canplay', handleCanPlay);

      // Ensure video src is set - always reload if URL changed or src is empty
      if (!video.src || video.src !== videoUrl) {
        console.log('🔄 Setting video src:', videoUrl);
        video.src = videoUrl;
        video.load();
        // Reset preview state when video URL changes
        previewStartTimeRef.current = null;
        previewLastSceneIndexRef.current = -1;
        previewSceneMappingCacheRef.current = null;
        previewCurrentMappingCacheRef.current = null;
        previewDrawDimensionsCacheRef.current = null;
      }

      if (video.readyState >= 2) {
        console.log('✅ Video already ready, starting preview');
        if (isPreviewPlaying) {
          video.play().catch((err) => {
            console.error('❌ Error playing video:', err);
          });
        }
        console.log('🚀 Calling renderPreviewFrame from useEffect');
        renderPreviewFrame();
      } else {
        console.log(
          '⏳ Video not ready yet, waiting for loadedmetadata. ReadyState:',
          video.readyState
        );
      }

      return () => {
        // Cleanup: cancel all animation frames and timeouts
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('canplay', handleCanPlay);
        if (previewAnimationRef.current) {
          cancelAnimationFrame(previewAnimationRef.current);
          previewAnimationRef.current = null;
        }
        if (previewTimeoutRef.current) {
          clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }
        // Pause video to stop processing but DON'T reset currentTime or src
        // This allows video to resume when preview is re-enabled
        if (video) {
          video.pause();
        }
      };
    } else {
      // Cleanup when preview is disabled
      if (previewAnimationRef.current) {
        cancelAnimationFrame(previewAnimationRef.current);
        previewAnimationRef.current = null;
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewMode, isGenerating, generatedVideo, videoUrl, template, content, isPreviewPlaying]);

  // Cleanup on unmount - critical for preventing memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    const video = videoRef.current; // Capture ref value for cleanup

    return () => {
      isMountedRef.current = false;
      // Cancel all animation frames
      if (previewAnimationRef.current) {
        cancelAnimationFrame(previewAnimationRef.current);
        previewAnimationRef.current = null;
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      // Pause and cleanup video (use captured value)
      if (video) {
        video.pause();
        video.src = '';
        video.load();
      }
      // Clear all caches
      previewSceneMappingCacheRef.current = null;
      previewCurrentMappingCacheRef.current = null;
      previewDrawDimensionsCacheRef.current = null;
    };
  }, []);

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
            <>
              <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className={clsx(
                  'flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  showDebugPanel
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
                title="Show template debug info"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Debug</span>
              </button>
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
            </>
          )}
        </div>
      </div>

      {/* Video Preview Area */}
      <div className="mb-6">
        <div className="bg-black rounded-lg aspect-[9/16] max-w-xs mx-auto relative overflow-hidden">
          {/* Preview Play/Pause Controls */}
          {isPreviewMode && !generatedVideo && (
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={() => {
                  const wasPlaying = isPreviewPlaying;
                  setIsPreviewPlaying(!isPreviewPlaying);
                  if (!wasPlaying) {
                    // When resuming, adjust start time to continue from current position
                    const currentStartTime = previewStartTimeRef.current;
                    if (currentStartTime !== null) {
                      const elapsed = Date.now() - currentStartTime;
                      const templateDuration = ((template.duration as number) || 10) * 1000;
                      const currentTimeInCycle = elapsed % templateDuration;
                      previewStartTimeRef.current = Date.now() - currentTimeInCycle;
                    } else {
                      // Initialize start time if null
                      previewStartTimeRef.current = Date.now();
                    }
                  }
                }}
                className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition-colors"
                title={isPreviewPlaying ? 'Pause Preview' : 'Play Preview'}
              >
                {isPreviewPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          )}
          {/* Source video (always hidden, used for canvas rendering) */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="hidden"
            crossOrigin="anonymous"
            preload="auto"
            muted
            playsInline
          />

          {/* Canvas for preview and generation */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              display: (isPreviewMode || isGenerating) && !generatedVideo ? 'block' : 'none',
              backgroundColor: '#000000', // Black background so we can see if canvas is visible
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
                autoPlay
                onEnded={(e) => {
                  // Pause video when it ends (don't loop)
                  e.currentTarget.pause();
                }}
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

      {/* Comprehensive Debug Panel */}
      {showDebugPanel && (
        <div className="mt-6 border-2 border-yellow-300 rounded-lg bg-yellow-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-900 text-lg">🔍 Template Debug Panel</h4>
            <button
              onClick={() => setShowDebugPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Template Overview */}
          <div className="mb-4 p-3 bg-white rounded border border-yellow-200">
            <h5 className="font-semibold text-gray-800 mb-2">Template Overview</h5>
            <div className="text-sm space-y-1">
              <p>
                <strong>Duration:</strong> {(template.duration as number) || 10}s
              </p>
              <p>
                <strong>Total Scenes:</strong> {(template.scenes as any[])?.length || 0}
              </p>
              <p>
                <strong>Current Scene (Preview):</strong> {currentScene + 1} /{' '}
                {(template.scenes as any[])?.length || 0}
              </p>
            </div>
          </div>

          {/* All Scenes with Text Analysis */}
          <div className="mb-4">
            <h5 className="font-semibold text-gray-800 mb-2">All Scenes & Text Analysis</h5>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(template.scenes as any[])?.map((scene: any, index: number) => {
                const textContent = scene.text?.content || 'NO TEXT DEFINED';
                const variables = textContent.match(/\{\{(\w+)\}\}/g) || [];
                const replacedText = replaceVariables(textContent, content);
                const hasText = !!scene.text;
                const textWillRender =
                  replacedText.trim() !== '' &&
                  replacedText !== textContent.replace(/\{\{(\w+)\}\}/g, '[$1]');
                const isCurrentScene = index === currentScene;
                const missingVars = variables.filter((v: string) => {
                  const varName = v.replace(/[{}]/g, '');
                  const mappings = VARIABLE_MAPPING[varName.toLowerCase()] || [];
                  const hasDirect = content[varName];
                  const hasMapped = mappings.some((m: string) => content[m]);
                  return !hasDirect && !hasMapped;
                });

                return (
                  <div
                    key={index}
                    className={clsx(
                      'p-3 rounded border-2',
                      isCurrentScene ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200',
                      !hasText
                        ? 'border-red-300 bg-red-50'
                        : missingVars.length > 0
                          ? 'border-orange-300 bg-orange-50'
                          : ''
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">
                            Scene {index + 1}
                            {isCurrentScene && ' (CURRENT)'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {scene.start}s - {scene.end}s ({(scene.end - scene.start).toFixed(1)}s)
                          </span>
                          {hasText && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                              ✓ Has Text
                            </span>
                          )}
                          {!hasText && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                              ✗ No Text
                            </span>
                          )}
                          {missingVars.length > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                              ⚠ Missing Vars
                            </span>
                          )}
                        </div>

                        {hasText ? (
                          <div className="text-sm space-y-1 mt-2">
                            <div>
                              <strong>Original Text:</strong>{' '}
                              <code className="bg-gray-100 px-1 rounded">{textContent}</code>
                            </div>
                            <div>
                              <strong>Variables Found:</strong>{' '}
                              {variables.length > 0 ? (
                                <span className="text-blue-600">{variables.join(', ')}</span>
                              ) : (
                                <span className="text-gray-500">None</span>
                              )}
                            </div>
                            <div>
                              <strong>Replaced Text:</strong>{' '}
                              <code
                                className={clsx(
                                  'px-1 rounded',
                                  textWillRender
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                )}
                              >
                                {replacedText || '[EMPTY]'}
                              </code>
                            </div>
                            {missingVars.length > 0 && (
                              <div className="text-orange-700">
                                <strong>Missing Variables:</strong> {missingVars.join(', ')} -
                                Available keys: {Object.keys(content).join(', ')}
                              </div>
                            )}
                            <div className="text-xs text-gray-600 mt-1">
                              <strong>Position:</strong> x: {scene.text?.position?.x || 50}%, y:{' '}
                              {scene.text?.position?.y || 50}% | <strong>Style:</strong>{' '}
                              {scene.text?.style?.fontSize || 48}px,{' '}
                              {scene.text?.style?.color || '#ffffff'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-red-600 mt-1">
                            ⚠️ This scene has no text overlay defined
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }) || (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
                  ⚠️ No scenes found in template
                </div>
              )}
            </div>
          </div>

          {/* Variable Mapping Reference */}
          <div className="mb-4 p-3 bg-white rounded border border-yellow-200">
            <h5 className="font-semibold text-gray-800 mb-2">Variable Mapping Reference</h5>
            <div className="text-sm space-y-1">
              <p>
                <strong>Available Content Keys:</strong> {Object.keys(content).join(', ') || 'None'}
              </p>
              <div className="mt-2">
                <strong>Variable Mappings:</strong>
                <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                  {Object.entries(VARIABLE_MAPPING).map(([key, mappings]) => (
                    <li key={key}>
                      <code>{`{{${key}}}`}</code> → tries: {mappings.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Test Render Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                if (!canvasRef.current || !videoRef.current) return;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                const video = videoRef.current;
                if (!ctx || !video) return;

                // Set canvas size
                const displayWidth = canvas.clientWidth || 540;
                const displayHeight = canvas.clientHeight || 960;
                const scale = window.devicePixelRatio || 1;
                canvas.width = displayWidth * scale;
                canvas.height = displayHeight * scale;
                ctx.scale(scale, scale);

                // Draw video frame
                if (video.readyState >= 2 && video.videoWidth > 0) {
                  const videoWidth = video.videoWidth || 1920;
                  const videoHeight = video.videoHeight || 1080;
                  const videoAspect = videoWidth / videoHeight;
                  const targetAspect = 9 / 16;

                  let drawWidth, drawHeight, drawX, drawY;
                  if (videoAspect > targetAspect) {
                    drawHeight = displayHeight;
                    drawWidth = drawHeight * videoAspect;
                    drawX = (displayWidth - drawWidth) / 2;
                    drawY = 0;
                  } else {
                    drawWidth = displayWidth;
                    drawHeight = drawWidth / videoAspect;
                    drawX = 0;
                    drawY = (displayHeight - drawHeight) / 2;
                  }

                  ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);

                  // Render ALL text overlays for testing
                  const scenes = (template.scenes as any[]) || [];
                  scenes.forEach((scene: any, index: number) => {
                    if (scene.text) {
                      try {
                        renderTextOverlay(ctx, scene, content);
                        console.log(`✅ Test rendered text for Scene ${index + 1}`);
                      } catch (error) {
                        console.error(`❌ Failed to test render Scene ${index + 1}:`, error);
                      }
                    }
                  });

                  alert('Test render complete! Check the preview canvas and console for results.');
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              🧪 Test Render All Text Overlays
            </button>
          </div>
        </div>
      )}

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
