'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoScene, TextOverlay } from '@/lib/video';
import SmartGuides from './SmartGuides';
import { useSnapGuides } from '@/hooks/useSnapGuides';

interface InteractiveVideoCanvasProps {
  videoUrl: string;
  scene: VideoScene | null;
  selectedTextId: string | null;
  content: Record<string, string>;
  isPreviewMode: boolean;
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
  selectedTextId,
  content,
  isPreviewMode,
  onSelect,
  onPositionChange,
}: InteractiveVideoCanvasProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{
    textId: string;
    startX: number;
    startY: number;
    startPos: { x: number; y: number };
  } | null>(null);

  const { snapPoints, activeGuides, calculateSnappedPosition, resetGuides } = useSnapGuides();

  // Render loop
  useEffect(() => {
    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !scene) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw video frame
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      // Draw text overlay
      if (scene.text) {
        renderTextOverlay(ctx, scene.text, content, canvas.width, canvas.height);
      }

      // Draw selection indicator
      if (!isPreviewMode && selectedTextId && scene.text?.id === selectedTextId) {
        const bbox = getTextBoundingBox(scene.text, content, canvas.width, canvas.height, ctx);
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
  }, [scene, content, selectedTextId, isPreviewMode]);

  // Handle canvas click
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPreviewMode || !scene?.text || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bbox = getTextBoundingBox(scene.text, content, canvas.width, canvas.height, ctx);

      if (
        bbox &&
        x >= bbox.x &&
        x <= bbox.x + bbox.width &&
        y >= bbox.y &&
        y <= bbox.y + bbox.height
      ) {
        onSelect(scene.text.id!);
      } else {
        onSelect(null);
      }
    },
    [isPreviewMode, scene, content, onSelect]
  );

  // Handle drag start
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (isPreviewMode || !scene?.text || !selectedTextId || scene.text.id !== selectedTextId)
        return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bbox = getTextBoundingBox(scene.text, content, canvas.width, canvas.height, ctx);

      if (
        bbox &&
        x >= bbox.x &&
        x <= bbox.x + bbox.width &&
        y >= bbox.y &&
        y <= bbox.y + bbox.height
      ) {
        setIsDragging(true);
        dragStateRef.current = {
          textId: scene.text.id!,
          startX: event.clientX,
          startY: event.clientY,
          startPos: scene.text.position,
        };
        canvas.setPointerCapture(event.pointerId);
      }
    },
    [isPreviewMode, scene, content, selectedTextId]
  );

  // Handle drag move
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging || !dragStateRef.current || !canvasRef.current) return;

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

    const handlePointerUp = () => {
      setIsDragging(false);
      dragStateRef.current = null;
      resetGuides();
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
  }, [isDragging, onPositionChange, calculateSnappedPosition, resetGuides]);

  return (
    <div ref={containerRef} className="relative flex flex-col items-center gap-4">
      <div className="text-sm font-medium text-secondary">
        Scene {scene ? scene.start.toFixed(1) : 0}s - {scene ? scene.end.toFixed(1) : 0}s
      </div>
      <div className="relative">
        <video
          ref={videoRef}
          src={videoUrl}
          className="hidden"
          loop
          muted
          playsInline
          autoPlay
          crossOrigin="anonymous"
        />
        <canvas
          ref={canvasRef}
          width={1080}
          height={1920}
          className={`aspect-[9/16] w-full max-w-[420px] rounded-3xl shadow-theme-xl ${
            isPreviewMode ? 'cursor-default' : 'cursor-move'
          }`}
          onClick={handleCanvasClick}
          onPointerDown={handlePointerDown}
        />
        {!isPreviewMode && <SmartGuides activeGuides={activeGuides} snapPoints={snapPoints} />}
        {!isPreviewMode && !isDragging && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur">
            Click & drag text to reposition
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveVideoCanvas;
