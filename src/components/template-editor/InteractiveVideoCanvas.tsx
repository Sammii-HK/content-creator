'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoScene, TextOverlay } from '@/lib/video';
import SmartGuides from './SmartGuides';
import { useSnapGuides } from '@/hooks/useSnapGuides';

const templateDurationFallback = (scenes: VideoScene[]) => {
  const lastScene = scenes[scenes.length - 1];
  if (!lastScene) return 0;
  if (typeof lastScene.end === 'number') {
    return Math.max(lastScene.end, lastScene.start ?? 0);
  }
  return Math.max((lastScene.start ?? 0) + 0.01, 0);
};

interface InteractiveVideoCanvasProps {
  videoUrl: string;
  scene: VideoScene | null;
  scenes: VideoScene[];
  selectedTextId: string | null;
  content: Record<string, string>;
  viewMode: 'edit' | 'previewCuts' | 'previewFull';
  onSelect: (textId: string | null) => void;
  onPositionChange: (textId: string, position: { x: number; y: number }) => void;
}

// Helper to replace template variables
const replaceVariables = (text: string, content: Record<string, string>): string => {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => content[key.trim()] || `[${key.trim()}]`);
};

// Helper to wrap text for canvas rendering
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text];
};

// Render text overlay on canvas (reused from VideoGenerator logic)
const renderTextOverlay = (
  ctx: CanvasRenderingContext2D,
  text: TextOverlay,
  content: Record<string, string>,
  canvasWidth: number,
  canvasHeight: number
) => {
  const style = text.style || {};
  const textContent = replaceVariables(text.content || '', content);

  if (!textContent || textContent.trim() === '') return;

  const position = text.position || { x: 50, y: 50 };
  const fontSize = style.fontSize || 48;
  const fontWeight = style.fontWeight || 'bold';
  const fontFamily = style.fontFamily || "'Inter', 'Helvetica Neue', sans-serif";
  const color = style.color || '#ffffff';
  const stroke = style.stroke;
  const strokeWidth = style.strokeWidth || 0;
  const maxWidthPercent = style.maxWidth ?? 90;

  // Calculate position in pixels
  const centerX = (position.x / 100) * canvasWidth;
  const centerY = (position.y / 100) * canvasHeight;

  // Set text properties
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Handle text wrapping
  const maxWidthPx = (maxWidthPercent / 100) * canvasWidth;
  const textLines = maxWidthPercent < 100 ? wrapText(ctx, textContent, maxWidthPx) : [textContent];

  const lineHeight = fontSize * 1.2;
  const totalHeight = textLines.length * lineHeight;
  const startY = centerY - totalHeight / 2 + lineHeight / 2;

  // Measure max line width for background
  const measuredWidths = textLines.map((line) => ctx.measureText(line).width);
  const maxLineWidth = Math.max(...measuredWidths);

  // Draw background if specified
  const background = style.background;
  const backgroundColor =
    typeof background === 'string'
      ? background
      : background === false
        ? null
        : style.backgroundColor || 'rgba(0, 0, 0, 0.5)';

  if (backgroundColor) {
    const paddingX = fontSize * 0.6;
    const paddingY = fontSize * 0.4;
    const bgWidth = maxLineWidth + paddingX * 2;
    const bgHeight = totalHeight + paddingY * 2;
    const bgX = centerX - bgWidth / 2;
    const bgY = startY - lineHeight / 2 - paddingY;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
  }

  // Render each line
  textLines.forEach((line, index) => {
    const y = startY + index * lineHeight;

    // Draw stroke
    if (stroke && strokeWidth && stroke !== 'transparent') {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(line, centerX, y);
    }

    // Draw fill
    ctx.fillStyle = color;
    ctx.fillText(line, centerX, y);
  });
};

// Calculate text bounding box for click detection
const getTextBoundingBox = (
  text: TextOverlay,
  content: Record<string, string>,
  canvasWidth: number,
  canvasHeight: number,
  ctx: CanvasRenderingContext2D
): { x: number; y: number; width: number; height: number } | null => {
  const style = text.style || {};
  const textContent = replaceVariables(text.content || '', content);

  if (!textContent || textContent.trim() === '') return null;

  const position = text.position || { x: 50, y: 50 };
  const fontSize = style.fontSize || 48;
  const fontWeight = style.fontWeight || 'bold';
  const fontFamily = style.fontFamily || "'Inter', 'Helvetica Neue', sans-serif";
  const maxWidthPercent = style.maxWidth ?? 90;

  const centerX = (position.x / 100) * canvasWidth;
  const centerY = (position.y / 100) * canvasHeight;

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  const maxWidthPx = (maxWidthPercent / 100) * canvasWidth;
  const textLines = maxWidthPercent < 100 ? wrapText(ctx, textContent, maxWidthPx) : [textContent];

  const lineHeight = fontSize * 1.2;
  const totalHeight = textLines.length * lineHeight;

  const measuredWidths = textLines.map((line) => ctx.measureText(line).width);
  const maxLineWidth = Math.max(...measuredWidths);

  const paddingX = fontSize * 0.6;
  const paddingY = fontSize * 0.4;
  const width = maxLineWidth + paddingX * 2;
  const height = totalHeight + paddingY * 2;

  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
};

const InteractiveVideoCanvas = ({
  videoUrl,
  scene,
  scenes,
  selectedTextId,
  content,
  viewMode,
  onSelect,
  onPositionChange,
}: InteractiveVideoCanvasProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(scene?.text?.id ?? null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const nextScenePreloadRef = useRef<number | null>(null);
  const lastFrameRef = useRef<ImageData | null>(null);
  const dragStateRef = useRef<{
    textId: string;
    startX: number;
    startY: number;
    startPos: { x: number; y: number };
    wasPlaying?: boolean;
  } | null>(null);

  const { snapPoints, activeGuides, calculateSnappedPosition, resetGuides } = useSnapGuides();

  const activeSceneIdRef = useRef(activeSceneId);
  useEffect(() => {
    activeSceneIdRef.current = activeSceneId;
  }, [activeSceneId]);

  useEffect(() => {
    if (viewMode === 'edit') {
      setActiveSceneId(scene?.text?.id ?? null);
    }
    if (viewMode === 'previewFull' && scene?.text?.id) {
      setActiveSceneId(scene.text.id);
    }
  }, [viewMode, scene?.text?.id]);

  const editingSceneStart = typeof scene?.start === 'number' ? scene.start : 0;
  const editingSceneEnd =
    typeof scene?.end === 'number' && scene.end > editingSceneStart
      ? scene.end
      : editingSceneStart + 0.01;

  const firstSceneStart = scenes.length ? (scenes[0]?.start ?? 0) : 0;
  const templateEnd = templateDurationFallback(scenes);
  const isPreviewMode = viewMode !== 'edit';
  const isFullPreview = viewMode === 'previewFull';

  const playbackStart = isFullPreview ? firstSceneStart : editingSceneStart;
  const playbackEnd = isFullPreview ? templateEnd : editingSceneEnd;

  const currentRenderScene =
    (isFullPreview
      ? scenes.find((timelineScene) => timelineScene.text?.id === activeSceneId)
      : scene) || scene;

  // Render loop
  useEffect(() => {
    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (video && video.readyState >= 2 && videoUrl && !isTransitioning) {
        // Draw current frame when not transitioning
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Cache the frame continuously for smooth transitions
        try {
          lastFrameRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (_e) {
          // Ignore if canvas is tainted (CORS issues)
        }
      } else if (isTransitioning && lastFrameRef.current) {
        // During transition, show the last cached frame to avoid black flash
        ctx.putImageData(lastFrameRef.current, 0, 0);
      } else if (video && video.readyState >= 2 && videoUrl && isTransitioning) {
        // Video is ready but transitioning - draw it and cache it immediately
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          lastFrameRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (_e) {
          // Ignore if canvas is tainted
        }
      } else if (video && videoUrl && video.readyState < 2) {
        // Video is loading - show cached frame if available
        if (lastFrameRef.current) {
          ctx.putImageData(lastFrameRef.current, 0, 0);
        } else {
          // Fallback gradient when no video is loaded
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#0f172a');
          gradient.addColorStop(1, '#1e293b');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else {
        // Fallback gradient when no video is loaded
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#1e293b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw text overlay
      if (currentRenderScene?.text) {
        renderTextOverlay(ctx, currentRenderScene.text, content, canvas.width, canvas.height);
      }

      // Draw selection indicator
      if (!isPreviewMode && selectedTextId && currentRenderScene?.text?.id === selectedTextId) {
        const bbox = getTextBoundingBox(
          currentRenderScene.text,
          content,
          canvas.width,
          canvas.height,
          ctx
        );
        if (bbox) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);

          // Draw corner handles
          const handleSize = 8;
          ctx.fillStyle = '#3b82f6';
          const corners = [
            { x: bbox.x, y: bbox.y },
            { x: bbox.x + bbox.width, y: bbox.y },
            { x: bbox.x, y: bbox.y + bbox.height },
            { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
          ];
          corners.forEach((corner) => {
            ctx.fillRect(
              corner.x - handleSize / 2,
              corner.y - handleSize / 2,
              handleSize,
              handleSize
            );
          });
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    scene,
    currentRenderScene,
    content,
    selectedTextId,
    isPreviewMode,
    videoUrl,
    scenes,
    isTransitioning,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleLoaded = () => {
      setVideoDuration(video.duration || 0);
    };
    video.addEventListener('loadedmetadata', handleLoaded);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded);
    };
  }, [videoUrl]);

  // Sync video playback to scene cuts
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) {
      setSceneProgress(0);
      return;
    }

    const startPlayback = () => {
      if (isFullPreview && scenes.length > 0) {
        // Start at first scene
        const firstScene = scenes[0];
        video.currentTime = typeof firstScene.start === 'number' ? firstScene.start : 0;
        setCurrentSceneIndex(0);
      } else {
        video.currentTime = playbackStart;
      }
      video.play().catch(() => {
        /* ignored */
      });
    };

    if (video.readyState >= 2) {
      startPlayback();
    } else {
      const handleLoaded = () => {
        startPlayback();
      };
      video.addEventListener('loadeddata', handleLoaded, { once: true });
      return () => {
        video.removeEventListener('loadeddata', handleLoaded);
      };
    }
  }, [playbackStart, videoUrl, isPreviewMode, isFullPreview, scenes]);

  // Loop within scene range & update progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) {
      setSceneProgress(0);
      return;
    }

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;

      if (isPreviewMode && isFullPreview && scenes.length > 0) {
        // Scene-based playback: jump between segments
        const currentScene = scenes[currentSceneIndex];
        if (!currentScene) {
          setCurrentSceneIndex(0);
          return;
        }

        const sceneStart = typeof currentScene.start === 'number' ? currentScene.start : 0;
        const sceneEnd =
          typeof currentScene.end === 'number' && currentScene.end > sceneStart
            ? currentScene.end
            : sceneStart + 0.01;

        // Enforce segment boundaries - ensure video stays within current segment
        if (currentTime < sceneStart) {
          // Video somehow went before segment start - jump to start
          video.currentTime = sceneStart;
          return;
        }

        // Update active scene for rendering
        if (currentScene.text?.id && currentScene.text.id !== activeSceneIdRef.current) {
          activeSceneIdRef.current = currentScene.text.id;
          setActiveSceneId(currentScene.text.id);
        }

        // Calculate progress within current scene
        const sceneDuration = Math.max(sceneEnd - sceneStart, 0.01);
        const progress =
          sceneDuration > 0
            ? Math.min(Math.max((currentTime - sceneStart) / sceneDuration, 0), 1)
            : 0;
        setSceneProgress(progress);

        // Mark that we're approaching the end (for transition preparation)
        const preloadThreshold = sceneEnd - 0.2;
        if (currentTime >= preloadThreshold && nextScenePreloadRef.current !== currentSceneIndex) {
          nextScenePreloadRef.current = currentSceneIndex;
          // Frame will be cached in the render loop automatically
        }

        // Enforce segment boundaries - jump to next scene when current scene ends
        // Use a small buffer (0.05s) to ensure we catch the boundary
        if (currentTime >= sceneEnd - 0.05) {
          const nextIndex = (currentSceneIndex + 1) % scenes.length;
          const nextScene = scenes[nextIndex];

          // Only jump if we've actually reached or passed the end
          if (currentTime >= sceneEnd) {
            setIsTransitioning(true);
            setCurrentSceneIndex(nextIndex);
            nextScenePreloadRef.current = null;

            const nextStart = typeof nextScene.start === 'number' ? nextScene.start : 0;

            // Seek to next segment start and ensure continuous playback
            const handleSeeked = () => {
              // Verify we're at the right position
              if (Math.abs(video.currentTime - nextStart) < 0.1) {
                setIsTransitioning(false);
                // Always ensure video plays to continue the loop
                video
                  .play()
                  .then(() => {
                    // Video is playing, loop will continue automatically
                  })
                  .catch(() => {
                    // If play fails, retry after a short delay
                    setTimeout(() => {
                      video.play().catch(() => {});
                    }, 100);
                  });
              } else {
                // Retry seek if not at correct position
                video.currentTime = nextStart;
                video.addEventListener('seeked', handleSeeked, { once: true });
              }
            };

            video.pause();
            video.currentTime = nextStart;
            video.addEventListener('seeked', handleSeeked, { once: true });
          } else {
            // Approaching end - ensure we don't go past it
            if (currentTime > sceneEnd) {
              const nextStart = typeof nextScene.start === 'number' ? nextScene.start : 0;
              video.currentTime = nextStart;
              setCurrentSceneIndex(nextIndex);
            }
          }
        }
      } else {
        // Single scene loop (edit mode or preview cuts)
        const duration = Math.max(playbackEnd - playbackStart, 0.01);
        const progress =
          duration > 0 ? Math.min(Math.max((currentTime - playbackStart) / duration, 0), 1) : 0;
        setSceneProgress(progress);

        if (currentTime >= playbackEnd) {
          video.currentTime = playbackStart;
          video.play().catch(() => {});
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [
    playbackStart,
    playbackEnd,
    isPreviewMode,
    isFullPreview,
    scenes,
    videoDuration,
    videoUrl,
    currentSceneIndex,
  ]);

  // Handle canvas click
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      // Don't handle click if we just finished dragging
      if (isDragging || viewMode !== 'edit' || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      // Scale click coordinates to match canvas internal dimensions
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Check all scenes' text overlays, not just the current scene
      let clickedTextId: string | null = null;

      // First check current scene's text
      if (scene?.text) {
        const bbox = getTextBoundingBox(scene.text, content, canvas.width, canvas.height, ctx);
        if (
          bbox &&
          x >= bbox.x &&
          x <= bbox.x + bbox.width &&
          y >= bbox.y &&
          y <= bbox.y + bbox.height
        ) {
          clickedTextId = scene.text.id!;
        }
      }

      // If not found, check other scenes (in case text overlaps)
      if (!clickedTextId && scenes.length > 0) {
        for (const checkScene of scenes) {
          if (checkScene.text && checkScene.text.id !== scene?.text?.id) {
            const bbox = getTextBoundingBox(
              checkScene.text,
              content,
              canvas.width,
              canvas.height,
              ctx
            );
            if (
              bbox &&
              x >= bbox.x &&
              x <= bbox.x + bbox.width &&
              y >= bbox.y &&
              y <= bbox.y + bbox.height
            ) {
              clickedTextId = checkScene.text.id!;
              break;
            }
          }
        }
      }

      onSelect(clickedTextId);
    },
    [viewMode, scene, scenes, content, onSelect, isDragging]
  );

  // Handle drag start
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (viewMode !== 'edit' || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      // Scale pointer coordinates to match canvas internal dimensions
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Find which text overlay was clicked/dragged - check all scenes
      let targetText: TextOverlay | null = null;
      let targetTextId: string | null = null;

      // Check all scenes to find clicked text
      for (const checkScene of scenes) {
        if (checkScene.text) {
          const bbox = getTextBoundingBox(
            checkScene.text,
            content,
            canvas.width,
            canvas.height,
            ctx
          );
          if (
            bbox &&
            x >= bbox.x &&
            x <= bbox.x + bbox.width &&
            y >= bbox.y &&
            y <= bbox.y + bbox.height
          ) {
            targetText = checkScene.text;
            targetTextId = checkScene.text.id!;
            break;
          }
        }
      }

      if (targetText && targetTextId) {
        event.preventDefault();
        event.stopPropagation();

        // Select the text if not already selected
        if (selectedTextId !== targetTextId) {
          onSelect(targetTextId);
        }

        // Pause video during drag to improve frame rate
        const video = videoRef.current;
        if (video && !video.paused) {
          video.pause();
          dragStateRef.current = {
            textId: targetTextId,
            startX: event.clientX,
            startY: event.clientY,
            startPos: targetText.position,
            wasPlaying: true,
          };
        } else {
          dragStateRef.current = {
            textId: targetTextId,
            startX: event.clientX,
            startY: event.clientY,
            startPos: targetText.position,
            wasPlaying: false,
          };
        }

        setIsDragging(true);
        canvas.setPointerCapture(event.pointerId);
      }
    },
    [viewMode, scenes, content, selectedTextId, onSelect]
  );

  // Handle drag move
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging || !dragStateRef.current || !canvasRef.current) return;
      event.preventDefault();

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      const deltaX = ((event.clientX - dragStateRef.current.startX) / rect.width) * 100;
      const deltaY = ((event.clientY - dragStateRef.current.startY) / rect.height) * 100;

      const newPos = {
        x: Math.max(0, Math.min(100, dragStateRef.current.startPos.x + deltaX)),
        y: Math.max(0, Math.min(100, dragStateRef.current.startPos.y + deltaY)),
      };

      const snappedPos = calculateSnappedPosition(newPos);
      onPositionChange(dragStateRef.current.textId, snappedPos);
    };

    const handlePointerUp = (event?: PointerEvent) => {
      const video = videoRef.current;
      const wasPlaying = dragStateRef.current?.wasPlaying ?? false;

      if (canvasRef.current && dragStateRef.current) {
        canvasRef.current.releasePointerCapture(event?.pointerId ?? 0);
      }

      setIsDragging(false);
      dragStateRef.current = null;
      resetGuides();

      // Resume video playback if it was playing before drag
      if (video && wasPlaying && viewMode === 'edit') {
        video.play().catch(() => {
          // Ignore play errors (e.g., user interaction required)
        });
      }
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, onPositionChange, calculateSnappedPosition, resetGuides, viewMode]);

  return (
    <div ref={containerRef} className="relative flex flex-col items-center gap-4 text-foreground">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground-secondary">
        {viewMode === 'edit'
          ? 'Scene Window'
          : viewMode === 'previewFull'
            ? 'Preview Mode • Full Clip'
            : 'Preview Mode • Cut-by-cut'}
      </div>
      <div
        className="relative flex w-full max-w-[420px] flex-col items-center gap-4"
        style={{ minWidth: 0 }}
      >
        <video
          ref={videoRef}
          src={videoUrl || undefined}
          className="hidden"
          muted
          playsInline
          autoPlay
          preload="auto"
          crossOrigin="anonymous"
        />
        <canvas
          ref={canvasRef}
          width={1080}
          height={1920}
          className={`aspect-[9/16] w-full rounded-[32px] border border-theme/40 shadow-theme-xl transition ${
            isPreviewMode ? 'cursor-default' : isDragging ? 'cursor-grabbing' : 'cursor-move'
          }`}
          style={{ touchAction: 'none' }}
          onClick={handleCanvasClick}
          onPointerDown={handlePointerDown}
        />
        {!isPreviewMode && <SmartGuides activeGuides={activeGuides} snapPoints={snapPoints} />}
        {!isPreviewMode && !isDragging && (
          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1 text-[11px] text-white backdrop-blur">
            Click & drag text to reposition
          </div>
        )}
        <div className="w-full space-y-2">
          <div className="flex flex-wrap items-center justify-between text-[11px] uppercase tracking-[0.2em] text-foreground-secondary">
            <span>
              {viewMode === 'previewFull'
                ? `Scene ${currentSceneIndex + 1} of ${scenes.length}`
                : viewMode === 'previewCuts'
                  ? 'Preview Cut'
                  : 'Cut Range'}
            </span>
            <span>
              {viewMode === 'previewFull' && scenes.length > 0
                ? (() => {
                    const currentScene = scenes[currentSceneIndex];
                    const sceneStart =
                      typeof currentScene?.start === 'number' ? currentScene.start : 0;
                    const sceneEnd =
                      typeof currentScene?.end === 'number' && currentScene.end > sceneStart
                        ? currentScene.end
                        : sceneStart + 0.01;
                    return `${sceneStart.toFixed(2)}s – ${sceneEnd.toFixed(2)}s`;
                  })()
                : `${playbackStart.toFixed(2)}s – ${playbackEnd.toFixed(2)}s`}
            </span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-accent"
              style={{ width: `${sceneProgress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveVideoCanvas;
