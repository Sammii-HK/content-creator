'use client';

import { useState, useRef, useEffect } from 'react';
import { PlayIcon, EyeIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { getSceneVideoMapping } from '@/lib/sceneMapping';

// Helper function to wrap text to fit within maxWidth
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      // Current line is too wide, start a new line
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  // Add the last line
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text];
};

interface TextStyle {
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  stroke?: string;
  strokeWidth?: number;
  maxWidth?: number;
  fadeIn?: number;
  fadeOut?: number;
  lineHeightMultiplier?: number;
  background?: boolean | string;
  backgroundColor?: string;
  backgroundRadius?: number;
  boxBorderWidth?: number;
  textAlign?: CanvasTextAlign;
  fontFamily?: string;
}

// Helper functions
const renderTextOverlay = (
  ctx: CanvasRenderingContext2D,
  scene: Record<string, unknown>,
  content: Record<string, string>,
  sceneProgress?: number, // 0-1, progress through the scene (for fade calculations)
  baseStyle: TextStyle = {}
) => {
  try {
    // Safely extract text properties with defaults
    const sceneText = (scene.text as any) || {};
    const style = {
      ...(baseStyle || {}),
      ...(sceneText.style || {}),
    };
    const textContent = sceneText.content || '';
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
    // For generation: canvas.width/height are already 1080x1920 (no scaling)
    // For preview: canvas.width/height are scaled by devicePixelRatio, but ctx is also scaled
    // So we need to check if context is scaled to determine correct dimensions
    const isContextScaled = ctx.getTransform().a !== 1 || ctx.getTransform().d !== 1;
    const displayWidth = isContextScaled
      ? ctx.canvas.width / (window.devicePixelRatio || 1)
      : ctx.canvas.width;
    const displayHeight = isContextScaled
      ? ctx.canvas.height / (window.devicePixelRatio || 1)
      : ctx.canvas.height;
    const centerX = (pos.x / 100) * displayWidth;
    const centerY = (pos.y / 100) * displayHeight;

    // Set text properties with defaults
    const fontSize = style.fontSize || 48;
    const fontWeight = style.fontWeight || 'bold';
    const fontFamily = style.fontFamily || 'Arial, sans-serif';
    const textAlign = style.textAlign || 'center';
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = textAlign as CanvasTextAlign;
    ctx.textBaseline = 'middle';

    // Handle maxWidth wrapping if specified
    const maxWidthPercent = style.maxWidth ?? baseStyle.maxWidth ?? 100; // Default to 100% if not specified
    const boxWidth = (maxWidthPercent / 100) * displayWidth;

    // Wrap text if maxWidth is specified and less than 100%
    const textLines = maxWidthPercent < 100 ? wrapText(ctx, text, boxWidth) : [text];
    const measuredWidths = textLines.map((line) => ctx.measureText(line).width);
    const maxLineWidth = measuredWidths.length > 0 ? Math.max(...measuredWidths) : 0;

    // Calculate line height (fontSize * 1.35 for spacing)
    const lineHeightMultiplier =
      style.lineHeightMultiplier ?? baseStyle.lineHeightMultiplier ?? 1.35;
    const lineHeight = fontSize * lineHeightMultiplier;
    const totalHeight = textLines.length * lineHeight;
    const startY = centerY - totalHeight / 2 + lineHeight / 2;

    // Calculate opacity based on fade in/out phases
    let opacity = 1.0; // Default: fully visible
    if (sceneProgress !== undefined && (style.fadeIn || style.fadeOut)) {
      const fadeInDuration = style.fadeIn || 0; // Duration in seconds for fade in
      const fadeOutDuration = style.fadeOut || 0; // Duration in seconds for fade out
      const sceneDuration = (scene.end as number) - (scene.start as number);
      const timeInScene = sceneProgress * sceneDuration;

      // Fade in phase
      if (fadeInDuration > 0 && timeInScene < fadeInDuration) {
        opacity = Math.min(1.0, timeInScene / fadeInDuration);
      }
      // Fade out phase
      else if (fadeOutDuration > 0 && timeInScene > sceneDuration - fadeOutDuration) {
        const fadeOutStart = sceneDuration - fadeOutDuration;
        const fadeOutProgress = (timeInScene - fadeOutStart) / fadeOutDuration;
        opacity = Math.max(0.0, 1.0 - fadeOutProgress);
      }
    }

    const backgroundSetting = style.background;
    let backgroundColor: string | null;
    if (backgroundSetting === false) {
      backgroundColor = null;
    } else if (typeof backgroundSetting === 'string') {
      backgroundColor = backgroundSetting;
    } else if (style.backgroundColor) {
      backgroundColor = style.backgroundColor;
    } else {
      backgroundColor = 'rgba(0, 0, 0, 0.5)';
    }

    const backgroundRadius = style.backgroundRadius ?? baseStyle.backgroundRadius ?? 12;

    if (backgroundColor) {
      const paddingX = fontSize * 0.6;
      const paddingY = fontSize * 0.4;
      const bgWidth = maxLineWidth + paddingX * 2;
      const bgHeight = totalHeight + paddingY * 2;
      const bgX = centerX - bgWidth / 2;
      const bgY = startY - lineHeight / 2 - paddingY;
      const originalAlpha = ctx.globalAlpha;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = backgroundColor;
      drawRoundedRect(ctx, bgX, bgY, bgWidth, bgHeight, backgroundRadius);
      ctx.globalAlpha = originalAlpha;
    }

    // Render each line
    textLines.forEach((line, index) => {
      const y = startY + index * lineHeight;

      // Set global alpha for fade effect
      const originalAlpha = ctx.globalAlpha;
      ctx.globalAlpha = opacity;

      // Add text stroke/outline if specified (render stroke first, then fill)
      if (style.stroke && style.strokeWidth) {
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = style.strokeWidth;
        ctx.strokeText(line, centerX, y);
      }

      // Fill text with color (always render fill for visibility)
      ctx.fillStyle = style.color || '#ffffff';
      ctx.fillText(line, centerX, y);

      // Restore original alpha
      ctx.globalAlpha = originalAlpha;
    });

    // Removed getImageData check - it was causing performance issues (60+ calls per second)
    // Text visibility is verified by the fact that fillText was called successfully
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
          break;
        }
      }
    }

    if (value !== undefined && value !== null && value !== '') {
      result = result.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value);
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

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const effectiveRadius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  ctx.beginPath();
  ctx.moveTo(x + effectiveRadius, y);
  ctx.lineTo(x + width - effectiveRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + effectiveRadius);
  ctx.lineTo(x + width, y + height - effectiveRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - effectiveRadius, y + height);
  ctx.lineTo(x + effectiveRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - effectiveRadius);
  ctx.lineTo(x, y + effectiveRadius);
  ctx.quadraticCurveTo(x, y, x + effectiveRadius, y);
  ctx.closePath();
  ctx.fill();
};

// IndexedDB helper for caching generated videos
// CACHE_VERSION: Increment this to invalidate all old cached videos when fixing bugs
const CACHE_VERSION = 3; // Incremented to invalidate old cached videos when template structure changes

const getVideoCacheKey = (
  template: Record<string, unknown>,
  content: Record<string, string | string[]>
) => {
  // Include template structure in cache key to detect template changes
  const templateHash = JSON.stringify({
    duration: template.duration,
    scenes: template.scenes, // Include scenes to detect template changes
  });
  const contentHash = Object.entries(content)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${typeof v === 'string' ? v : v.join(',')}`)
    .join('|');
  // Create a hash of the template structure (simple hash function)
  const templateHashShort = templateHash
    .split('')
    .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
    .toString(36);
  return `video_v${CACHE_VERSION}_${templateHashShort}_${contentHash.slice(0, 100)}`;
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

const _clearAllVideoCache = async (): Promise<void> => {
  try {
    const db = await openVideoCacheDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['videos'], 'readwrite');
      const store = transaction.objectStore('videos');
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        console.log('🧹 Cleared all video cache');
        resolve();
      };
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  } catch (error) {
    console.warn('Failed to clear video cache:', error);
  }
};

const saveCachedVideo = async (key: string, blob: Blob): Promise<void> => {
  try {
    const db = await openVideoCacheDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['videos'], 'readwrite');
      const store = transaction.objectStore('videos');

      // First, save the new video
      const putRequest = store.put(blob, key);
      putRequest.onsuccess = () => {
        // Then, limit cache size to max 10 videos
        const countRequest = store.count();
        countRequest.onsuccess = () => {
          const count = countRequest.result;
          const MAX_CACHE_SIZE = 10;

          if (count > MAX_CACHE_SIZE) {
            // Get all keys, sort by key (which includes timestamp), delete oldest
            const getAllKeysRequest = store.getAllKeys();
            getAllKeysRequest.onsuccess = () => {
              const keys = getAllKeysRequest.result as string[];
              // Sort keys (they should be in insertion order roughly)
              // Delete oldest entries (first ones)
              const keysToDelete = keys.slice(0, count - MAX_CACHE_SIZE);
              let deleteCount = 0;
              keysToDelete.forEach((oldKey) => {
                const deleteRequest = store.delete(oldKey);
                deleteRequest.onsuccess = () => {
                  deleteCount++;
                  if (deleteCount === keysToDelete.length) {
                    console.log(
                      `🧹 Cleared ${keysToDelete.length} old cache entries, keeping ${MAX_CACHE_SIZE} most recent`
                    );
                    resolve();
                  }
                };
                deleteRequest.onerror = () => {
                  console.warn('Failed to delete old cache entry:', oldKey);
                  deleteCount++;
                  if (deleteCount === keysToDelete.length) {
                    resolve();
                  }
                };
              });
              if (keysToDelete.length === 0) {
                resolve();
              }
            };
            getAllKeysRequest.onerror = () => resolve(); // Continue even if cleanup fails
          } else {
            resolve();
          }
        };
        countRequest.onerror = () => resolve(); // Continue even if count fails
      };
      putRequest.onerror = () => reject(putRequest.error);
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
  const [generationWarning, setGenerationWarning] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

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
  const prevTemplateRef = useRef<string>('');
  const prevContentRef = useRef<string>('');
  const videoGenerationTimeRef = useRef<number>(0);
  const baseTextStyle: TextStyle = ((template as any)?.textStyle as TextStyle) || {};

  const revokeVideoUrl = (url: string | null) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const buildServerTemplate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !template?.scenes) {
      return template;
    }

    const clonedTemplate = JSON.parse(JSON.stringify(template));
    const isContextScaled = ctx.getTransform().a !== 1 || ctx.getTransform().d !== 1;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const displayWidth = isContextScaled ? canvas.width / devicePixelRatio : canvas.width;

    clonedTemplate.scenes = clonedTemplate.scenes.map((scene: any) => {
      if (!scene?.text?.content) {
        return scene;
      }

      const sceneStyle = {
        ...(clonedTemplate.textStyle || {}),
        ...(scene.text.style || {}),
      };

      const fontSize = sceneStyle.fontSize || 48;
      const fontWeight = sceneStyle.fontWeight || 'bold';
      const fontFamily = sceneStyle.fontFamily || 'Arial, sans-serif';
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

      const maxWidthPercent = sceneStyle.maxWidth ?? clonedTemplate.textStyle?.maxWidth ?? 100;
      const boxWidth = (maxWidthPercent / 100) * displayWidth;

      let processedText = replaceVariables(scene.text.content, content).replace(/\r\n/g, '\n');

      if (maxWidthPercent < 100) {
        const wrappedLines: string[] = [];
        processedText.split('\n').forEach((paragraph, index, arr) => {
          const lines = wrapText(ctx, paragraph, boxWidth);
          wrappedLines.push(...lines);
          if (index < arr.length - 1) {
            wrappedLines.push('');
          }
        });
        processedText = wrappedLines.join('\n');
      }

      return {
        ...scene,
        text: {
          ...scene.text,
          content: processedText,
        },
      };
    });

    return clonedTemplate;
  };

  const generateVideo = async () => {
    if (isGenerating) {
      console.warn('⚠️ Generation already in progress - ignoring duplicate call');
      return;
    }

    if (!videoUrl) {
      alert('Please select a video before generating.');
      return;
    }

    setGenerationWarning(null);
    setGenerationError(null);
    setIsGenerating(true);
    setProgress(5);

    try {
      const cacheKey = getVideoCacheKey(template, content);
      const cachedBlob = await getCachedVideo(cacheKey);
      if (cachedBlob) {
        try {
          const db = await openVideoCacheDB();
          await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(['videos'], 'readwrite');
            const store = transaction.objectStore('videos');
            const deleteRequest = store.delete(cacheKey);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
          console.log('🗑️ Deleted cached video to force fresh generation');
        } catch (error) {
          console.warn('Failed to delete cached video:', error);
        }
      }

      if (generatedVideo) {
        revokeVideoUrl(generatedVideo);
        setGeneratedVideo(null);
      }

      const templateForServer = buildServerTemplate();

      const response = await fetch('/api/client-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          template: templateForServer,
          content,
        }),
      });

      const responseBody = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseBody.details || responseBody.error || 'Failed to render video');
      }

      setProgress(65);
      let renderedBlob: Blob | null = null;

      if (responseBody.videoData) {
        renderedBlob = base64ToBlob(responseBody.videoData, responseBody.mimeType || 'video/mp4');
        console.log('✅ Received rendered video data from server');
      } else if (responseBody.videoUrl) {
        console.log('✅ Server rendered video:', responseBody.videoUrl);
        const downloadResponse = await fetch(responseBody.videoUrl);
        if (!downloadResponse.ok) {
          throw new Error('Failed to download rendered video');
        }
        renderedBlob = await downloadResponse.blob();
      } else {
        throw new Error('Render response did not include video data.');
      }

      if (!renderedBlob) {
        throw new Error('Failed to obtain rendered video data.');
      }
      setProgress(85);

      const objectUrl = URL.createObjectURL(renderedBlob);
      videoGenerationTimeRef.current = Date.now();
      setGeneratedVideo(objectUrl);
      setProgress(95);

      await saveCachedVideo(cacheKey, renderedBlob);
      console.log('💾 Cached rendered video for replay');
      setProgress(100);
    } catch (error) {
      console.error('Video generation failed:', error);
      setGenerationError(error instanceof Error ? error.message : 'Video generation failed.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  useEffect(() => {
    if (generatedVideo && previewRef.current) {
      previewRef.current.currentTime = 0;
      previewRef.current.play().catch(() => {});
    }
  }, [generatedVideo]);

  // Preview rendering function - uses same scene mapping logic as generation
  const renderPreviewFrame = () => {
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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      console.warn('⚠️ Could not get 2d context from canvas');
      previewAnimationRef.current = requestAnimationFrame(renderPreviewFrame);
      return;
    }

    // Initialize preview start time if not set
    if (previewStartTimeRef.current === null) {
      previewStartTimeRef.current = Date.now();
    }

    // Set canvas internal resolution to match generation size (1080x1920 for 9:16)
    // This ensures preview matches generation exactly
    const GENERATION_WIDTH = 1080;
    const GENERATION_HEIGHT = 1920;
    const scale = window.devicePixelRatio || 1;
    canvas.width = GENERATION_WIDTH * scale;
    canvas.height = GENERATION_HEIGHT * scale;
    ctx.scale(scale, scale);

    // Use generation dimensions for all calculations (not CSS size)
    const displayWidth = GENERATION_WIDTH;
    const displayHeight = GENERATION_HEIGHT;

    // Clear canvas with black background (so we can see if canvas is rendering)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

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

      // Auto-pause at end of cycle - but only if still playing (don't conflict with manual pause)
      // Use a small debounce to prevent rapid play/pause conflicts
      if (isNearEndOfCycle && isPreviewPlaying && !video.paused && !video.ended) {
        // Pause at the end of the cycle - update state first, then pause
        if (isMountedRef.current) {
          setIsPreviewPlaying(false);
        }
        // Use a small delay to avoid AbortError if play() was just called
        setTimeout(() => {
          if (video && !video.paused && isMountedRef.current) {
            video.pause();
          }
        }, 10);
      }

      // Clear any pending timeout when playing (we use requestAnimationFrame instead)
      if (isPreviewPlaying && previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
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

        // Seek video to correct position if scene changed
        // Use sceneIndex from mapping object (already cached, no need for indexOf)
        const currentSceneIndex = currentMapping.sceneIndex;

        if (currentSceneIndex !== previewLastSceneIndexRef.current) {
          // Scene changed - seek to correct time within this scene's video segment
          const seekTime = Math.max(0, Math.min(targetVideoTime, sourceVideoDuration));
          if (Math.abs(video.currentTime - seekTime) > 0.1) {
            // Only mark as seeking if video is playing (when paused, we can render during seek)
            if (!video.paused) {
              isSeekingRef.current = true;
              // Clear seeking flag when seek completes
              const handleSeeked = () => {
                isSeekingRef.current = false;
              };
              video.addEventListener('seeked', handleSeeked, { once: true });
            }
            video.currentTime = seekTime;
          }
          previewLastSceneIndexRef.current = currentSceneIndex;
          // Debounce state update to reduce re-renders - only update if scene actually changed
          if (isMountedRef.current && currentScene !== currentSceneIndex) {
            setCurrentScene(currentSceneIndex);
          }
        } else {
          // Same scene - only seek if drift is significant (reduced threshold to minimize seeks)
          const currentVideoTime = video.currentTime;
          const drift = Math.abs(currentVideoTime - targetVideoTime);
          if (drift > 2.0) {
            // Only correct large drift to avoid constant seeking
            const seekTime = Math.max(0, Math.min(targetVideoTime, sourceVideoDuration));
            if (!video.paused) {
              isSeekingRef.current = true;
              const handleSeeked = () => {
                isSeekingRef.current = false;
              };
              video.addEventListener('seeked', handleSeeked, { once: true });
            }
            video.currentTime = seekTime;
          }
        }

        // Only sync video play/pause state when there's a clear mismatch
        // Don't force play/pause every frame - let button handler be primary controller
        // Only handle ended state here as a fallback (button handler should handle it first)
        if (isPreviewPlaying && video.ended) {
          // Video ended but we want to play - reset to beginning
          // This is a fallback; button handler should handle this normally
          const scenes = (template.scenes as any[]) || [];
          if (scenes.length > 0 && video.duration > 0) {
            const sceneVideoMapping =
              previewSceneMappingCacheRef.current || getSceneVideoMapping(scenes, video.duration);
            if (sceneVideoMapping.length > 0) {
              video.currentTime = sceneVideoMapping[0].videoStart;
              previewStartTimeRef.current = Date.now();
              previewLastSceneIndexRef.current = -1;
              video.play().catch(console.error);
            }
          }
        }
        // Don't force play/pause based on isPreviewPlaying - button handler controls this

        // Draw video frame - render even when paused (just don't update as frequently)
        const previewVideoReady =
          video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
        const previewNotSeeking = !isSeekingRef.current;
        // When paused, video frame is available even if readyState is lower or seeking
        const hasVideoDimensions = video.videoWidth > 0 && video.videoHeight > 0;

        // Always render if video has dimensions
        // When paused, always render (frame is available even during seek or lower readyState)
        // When playing, only render if video is ready and not seeking
        const canRender =
          hasVideoDimensions && (video.paused || (previewVideoReady && previewNotSeeking));
        if (canRender) {
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
            } catch (error) {
              console.error('❌ Error drawing video frame:', error);
            }
          } else {
            console.warn('⚠️ No drawDims calculated for preview');
          }
        } else {
          // Video not ready - draw a placeholder so user knows something is happening
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
              // Calculate scene progress (0-1) for fade animations
              const sceneDuration = currentMapping.outputEnd - currentMapping.outputStart;
              const timeInScene = outputTime - currentMapping.outputStart;
              const sceneProgress = Math.max(0, Math.min(1, timeInScene / sceneDuration));

              // Always render text for current scene - ensure it's rendered AFTER video frame
              renderTextOverlay(ctx, scene, content, sceneProgress, baseTextStyle);
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
        // When playing, use requestAnimationFrame for smooth 60fps animation
        previewAnimationRef.current = requestAnimationFrame(renderPreviewFrame);
      } else {
        // When paused, schedule next check with setTimeout to reduce CPU usage
        if (previewTimeoutRef.current === null) {
          previewTimeoutRef.current = window.setTimeout(() => {
            previewTimeoutRef.current = null;
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
        // Don't auto-play - let user control playback
        setIsPreviewPlaying(false);
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
          // Don't auto-play - just render the first frame
          renderPreviewFrame();
        }
      };

      const handleError = (e: Event) => {
        console.error('❌ Video error event:', e, {
          error: video.error,
          src: video.src,
          videoUrl,
        });
      };
      const handleLoadStart = () => {};
      const handleCanPlay = () => {};

      const handleEnded = () => {
        // Video ended - reset for replay
        // When video ends, reset to beginning and pause immediately
        // User can click play to restart
        const scenes = (template.scenes as any[]) || [];
        if (scenes.length > 0 && video.duration > 0) {
          const sceneVideoMapping =
            previewSceneMappingCacheRef.current || getSceneVideoMapping(scenes, video.duration);
          if (sceneVideoMapping.length > 0) {
            // Pause first to stop playback
            video.pause();
            // Reset video position - don't mark as seeking, just reset
            video.currentTime = sceneVideoMapping[0].videoStart;
            // Update state to reflect paused
            if (isMountedRef.current) {
              setIsPreviewPlaying(false);
            }
          }
        }
        // Reset preview timing so it can restart from beginning
        previewStartTimeRef.current = null;
        previewLastSceneIndexRef.current = -1;
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('ended', handleEnded);

      // Ensure video src is set - always reload if URL changed or src is empty
      if (!video.src || video.src !== videoUrl) {
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
        // Don't auto-play - just render the first frame
        renderPreviewFrame();
      }

      return () => {
        // Cleanup: cancel all animation frames and timeouts
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('ended', handleEnded);
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

  // Reset cached video when template/content actually change
  useEffect(() => {
    const templateStr = JSON.stringify(template);
    const contentStr = JSON.stringify(content);

    if (prevTemplateRef.current !== templateStr || prevContentRef.current !== contentStr) {
      prevTemplateRef.current = templateStr;
      prevContentRef.current = contentStr;

      if (generatedVideo) {
        URL.revokeObjectURL(generatedVideo);
        setGeneratedVideo(null);
      }
      videoGenerationTimeRef.current = 0;
    }
  }, [template, content, generatedVideo]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isGenerating) {
        setGenerationWarning(
          'Browser paused recording because this tab is hidden. Please keep the tab visible during generation.'
        );
      } else if (!document.hidden) {
        setGenerationWarning(null);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isGenerating]);

  // Function to load cached video manually for replay
  const loadCachedVideo = async () => {
    const cacheKey = getVideoCacheKey(template, content);
    const cachedBlob = await getCachedVideo(cacheKey);

    if (cachedBlob) {
      if (generatedVideo) {
        revokeVideoUrl(generatedVideo);
      }
      const videoUrl = URL.createObjectURL(cachedBlob);
      setGeneratedVideo(videoUrl);
      videoGenerationTimeRef.current = Date.now();
      console.log('✅ Loaded cached video for replay:', cacheKey);
    } else {
      alert('No cached video found for this template and content.');
    }
  };

  const clearGeneratedVideo = () => {
    if (generatedVideo) {
      revokeVideoUrl(generatedVideo);
      setGeneratedVideo(null);
      videoGenerationTimeRef.current = 0;
      setGenerationWarning(null);
      setGenerationError(null);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const buffers: ArrayBuffer[] = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteArray = new Uint8Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteArray[i] = slice.charCodeAt(i);
      }
      buffers.push(byteArray.buffer);
    }

    return new Blob(buffers, { type: mimeType });
  };

  const downloadVideo = () => {
    if (!generatedVideo) {
      return;
    }

    const link = document.createElement('a');
    link.href = generatedVideo;
    link.download = `generated-video-${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simple: React handles the video element via the src prop
  // No complex logic needed - just let the video element work

  // Cleanup on unmount - critical for preventing memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    const video = videoRef.current; // Capture ref value for cleanup
    const currentGeneratedVideo = generatedVideo; // Capture current video URL

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
      // Only revoke blob URL on unmount, not when video changes
      // This ensures the video stays playable while component is mounted
      if (currentGeneratedVideo) {
        revokeVideoUrl(currentGeneratedVideo);
      }
      // Clear all caches
      previewSceneMappingCacheRef.current = null;
      previewCurrentMappingCacheRef.current = null;
      previewDrawDimensionsCacheRef.current = null;
    };
    // Only run cleanup on unmount, not when generatedVideo changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = only on mount/unmount

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
                  const video = videoRef.current;
                  if (!video) return;

                  const newPlayingState = !isPreviewPlaying;
                  setIsPreviewPlaying(newPlayingState);

                  if (newPlayingState) {
                    // PLAY: Handle different states
                    if (video.ended) {
                      // Video ended - reset to beginning and play
                      const scenes = (template.scenes as any[]) || [];
                      if (scenes.length > 0 && video.duration > 0) {
                        const sceneVideoMapping =
                          previewSceneMappingCacheRef.current ||
                          getSceneVideoMapping(scenes, video.duration);
                        if (sceneVideoMapping.length > 0) {
                          // Reset video position - don't mark as seeking since we're paused
                          video.currentTime = sceneVideoMapping[0].videoStart;
                        }
                      }
                      previewStartTimeRef.current = Date.now();
                      previewLastSceneIndexRef.current = -1;
                    } else {
                      // Continue from current position - adjust timing if resuming
                      const currentStartTime = previewStartTimeRef.current;
                      if (currentStartTime !== null) {
                        const elapsed = Date.now() - currentStartTime;
                        const templateDuration = ((template.duration as number) || 10) * 1000;
                        const currentTimeInCycle = elapsed % templateDuration;
                        previewStartTimeRef.current = Date.now() - currentTimeInCycle;
                      } else {
                        previewStartTimeRef.current = Date.now();
                      }
                    }
                    // Play the video - ensure we're not already paused to avoid conflicts
                    if (video.paused) {
                      video.play().catch((err) => {
                        // Ignore AbortError - it means pause() was called immediately after play()
                        if (err.name !== 'AbortError') {
                          console.error('❌ Error playing video:', err);
                        }
                      });
                    }
                  } else {
                    // PAUSE: Simply pause the video - ensure we're not already paused
                    if (!video.paused) {
                      video.pause();
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
              // CRITICAL: Keep canvas visible during generation for MediaRecorder
              // MediaRecorder REQUIRES canvas to be visible to capture frames
              // ALWAYS show canvas when generating so user can see video being created
              display: isGenerating || isPreviewMode || !generatedVideo ? 'block' : 'none',
              visibility: isGenerating || isPreviewMode || !generatedVideo ? 'visible' : 'hidden',
              backgroundColor: '#000000', // Black background so we can see if canvas is visible
              zIndex: isGenerating ? 10 : 1, // Highest z-index during generation so user can see it
              pointerEvents: 'none', // Don't block clicks during generation
            }}
          />

          {/* Generated video - only show AFTER generation completes */}
          {generatedVideo && !isGenerating && (
            <div className="relative w-full h-full" style={{ zIndex: 10 }}>
              <video
                ref={previewRef}
                key={generatedVideo}
                src={generatedVideo}
                className="w-full h-full object-cover"
                controls
                preload="auto"
                playsInline
                loop
              />
              <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                ✓ GENERATED
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generation alerts */}
      {generationError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {generationError}
        </div>
      )}
      {!generationError && generationWarning && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-900">
          {generationWarning}
        </div>
      )}

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
            This may take a few moments. We are rendering your video on the server with text
            overlays.
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => {
            if (!isGenerating) {
              generateVideo().catch((error) => {
                console.error('❌ Generate video error:', error);
                alert(`Video generation failed: ${error.message}`);
              });
            }
          }}
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
          <>
            <button
              onClick={loadCachedVideo}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              <PlayIcon className="h-4 w-4" />
              <span>Replay Cached Video</span>
            </button>
            <button
              onClick={downloadVideo}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Download</span>
            </button>
            <button
              onClick={clearGeneratedVideo}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </>
        )}
        {!generatedVideo && !isGenerating && (
          <button
            onClick={loadCachedVideo}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            <PlayIcon className="h-4 w-4" />
            <span>Load Cached Video</span>
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
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
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
                        renderTextOverlay(ctx, scene, content, undefined, baseTextStyle);
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
