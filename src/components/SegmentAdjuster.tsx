'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface AdjustedSegment {
  id: string;
  startTime: number;
  endTime: number;
  adjustedStartTime?: number;
  adjustedEndTime?: number;
  quality?: number;
}

interface SegmentAdjusterProps {
  videoUrl?: string;
  videoDuration?: number;
  segments: AdjustedSegment[];
  script?: {
    hook?: string;
    script?: string[];
    callToAction?: string;
  };
  onChange: (segments: AdjustedSegment[]) => void;
}

const formatTime = (value: number) => {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  const ms = Math.floor((value % 1) * 10);
  return `${minutes}:${seconds}.${ms}`;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function SegmentAdjuster({
  videoUrl,
  videoDuration,
  segments,
  script,
  onChange,
}: SegmentAdjusterProps) {
  const [previewSegmentId, setPreviewSegmentId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const normalizedSegments = useMemo(
    () =>
      segments.map((segment) => ({
        ...segment,
        adjustedStartTime:
          typeof segment.adjustedStartTime === 'number'
            ? segment.adjustedStartTime
            : segment.startTime,
        adjustedEndTime:
          typeof segment.adjustedEndTime === 'number' ? segment.adjustedEndTime : segment.endTime,
      })),
    [segments]
  );

  const clearRaf = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const updateSegment = (segmentId: string, nextStart: number, nextEnd: number) => {
    const updatedSegments = normalizedSegments.map((segment) => {
      if (segment.id !== segmentId) {
        return segment;
      }
      const maxDuration = videoDuration ?? Math.max(segment.endTime, segment.startTime + 0.5);
      const safeStart = clamp(nextStart, 0, maxDuration - 0.05);
      const safeEnd = clamp(nextEnd, safeStart + 0.05, maxDuration);
      return {
        ...segment,
        adjustedStartTime: Number(safeStart.toFixed(2)),
        adjustedEndTime: Number(safeEnd.toFixed(2)),
      };
    });

    onChange(updatedSegments);
  };

  const handleSliderChange = (segmentId: string, value: number[]) => {
    const [start, end] = value;
    updateSegment(segmentId, start, end);
  };

  const handleNumberInput = (
    segmentId: string,
    field: 'adjustedStartTime' | 'adjustedEndTime',
    value: string
  ) => {
    const target = normalizedSegments.find((segment) => segment.id === segmentId);
    if (!target) return;

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return;

    const currentStart =
      field === 'adjustedStartTime' ? numericValue : (target.adjustedStartTime ?? target.startTime);
    const currentEnd =
      field === 'adjustedEndTime' ? numericValue : (target.adjustedEndTime ?? target.endTime);
    updateSegment(segmentId, currentStart, currentEnd);
  };

  const overlayTextForSegment = useCallback(
    (index: number) => {
      if (Array.isArray(script?.script) && script?.script[index]) {
        return script.script[index];
      }
      return script?.hook || '';
    },
    [script]
  );

  useEffect(() => {
    if (!previewSegmentId) {
      clearRaf();
      return;
    }

    const segment = normalizedSegments.find((item) => item.id === previewSegmentId);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!segment || !video || !canvas) {
      return;
    }

    let cancelled = false;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    canvas.width = 360;
    canvas.height = 640;

    const ensureMetadata = () =>
      video.readyState >= 2
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            const handleLoaded = () => {
              video.removeEventListener('loadedmetadata', handleLoaded);
              resolve();
            };
            video.addEventListener('loadedmetadata', handleLoaded);
            video.load();
          });

    const drawFrame = () => {
      if (cancelled || !video || !ctx) return;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const videoAspect = video.videoWidth / video.videoHeight;
        const targetAspect = canvas.width / canvas.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let drawX = 0;
        let drawY = 0;

        if (videoAspect > targetAspect) {
          drawHeight = canvas.height;
          drawWidth = drawHeight * videoAspect;
          drawX = (canvas.width - drawWidth) / 2;
        } else {
          drawWidth = canvas.width;
          drawHeight = drawWidth / videoAspect;
          drawY = (canvas.height - drawHeight) / 2;
        }

        try {
          ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
        } catch {
          // ignore draw errors
        }
      }

      const segmentIndex = normalizedSegments.findIndex((seg) => seg.id === segment.id);
      const overlayText = overlayTextForSegment(segmentIndex);
      if (overlayText) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        const padding = 16;
        const boxWidth = canvas.width - padding * 2;
        const boxHeight = 90;
        const boxX = padding;
        const boxY = canvas.height - boxHeight - padding;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        const textX = canvas.width / 2;
        ctx.fillText(overlayText, textX, boxY + boxHeight / 2 + 8, boxWidth - padding);
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    ensureMetadata()
      .then(() => {
        if (cancelled) return;
        const start = segment.adjustedStartTime ?? segment.startTime;
        const end = segment.adjustedEndTime ?? segment.endTime;

        video.currentTime = start;
        video.muted = true;
        video.play().catch(() => {});

        const handleTimeUpdate = () => {
          if (video.currentTime >= end) {
            video.pause();
            setPreviewSegmentId(null);
          }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        drawFrame();

        return () => {
          video.removeEventListener('timeupdate', handleTimeUpdate);
        };
      })
      .catch(() => setPreviewSegmentId(null));

    return () => {
      cancelled = true;
      clearRaf();
    };
  }, [previewSegmentId, normalizedSegments, overlayTextForSegment]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segment Adjustment Preview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Fine-tune the exact in/out points for each clip. Preview updates instantly without
          rendering the final video.
        </p>
      </CardHeader>
      <CardContent>
        {!videoUrl ? (
          <p className="text-sm text-muted-foreground">
            Upload or select a video to preview segment adjustments.
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
            <div className="space-y-3">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={360}
                  height={640}
                  className="w-full rounded-2xl border bg-black shadow-inner aspect-[9/16]"
                />
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="hidden"
                  playsInline
                  preload="auto"
                  muted
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Preview uses the original B-roll and overlays to match final rendering without
                running FFmpeg.
              </p>
            </div>
            <div className="space-y-6">
              {normalizedSegments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No segments selected for this plan yet.
                </p>
              ) : (
                normalizedSegments.map((segment, index) => {
                  const adjustedStart =
                    typeof segment.adjustedStartTime === 'number'
                      ? segment.adjustedStartTime
                      : segment.startTime;
                  const adjustedEnd =
                    typeof segment.adjustedEndTime === 'number'
                      ? segment.adjustedEndTime
                      : segment.endTime;
                  const sliderMax = videoDuration ?? Math.max(segment.endTime + 1, adjustedEnd + 1);
                  return (
                    <div key={segment.id} className="rounded-xl border p-4 shadow-sm space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold">Segment {index + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            Original {formatTime(segment.startTime)} → {formatTime(segment.endTime)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Adjusted {formatTime(adjustedStart)} → {formatTime(adjustedEnd)}
                          </p>
                        </div>
                        <Button
                          variant={previewSegmentId === segment.id ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => setPreviewSegmentId(segment.id)}
                        >
                          {previewSegmentId === segment.id ? 'Previewing…' : 'Preview'}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Slider
                          min={0}
                          max={sliderMax}
                          step={0.1}
                          value={[adjustedStart, adjustedEnd]}
                          onValueChange={(value) => handleSliderChange(segment.id, value)}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              Start (s)
                            </label>
                            <Input
                              type="number"
                              step="0.1"
                              min={0}
                              max={sliderMax}
                              value={adjustedStart}
                              onChange={(event) =>
                                handleNumberInput(
                                  segment.id,
                                  'adjustedStartTime',
                                  event.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              End (s)
                            </label>
                            <Input
                              type="number"
                              step="0.1"
                              min={0}
                              max={sliderMax}
                              value={adjustedEnd}
                              onChange={(event) =>
                                handleNumberInput(segment.id, 'adjustedEndTime', event.target.value)
                              }
                            />
                          </div>
                        </div>
                        {script?.script?.[index] && (
                          <p className="text-xs text-muted-foreground">
                            Overlay: “{script.script[index]}”
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
