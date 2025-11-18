'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SegmentAdjuster from '@/components/SegmentAdjuster';

interface Video {
  id: string;
  name: string;
  duration: number;
  category: string;
  fileUrl?: string;
  segmentCount?: number;
}

interface ContentPlan {
  video: any;
  template: any;
  script: any;
  segments: any[];
  timeline: any[];
}

interface PlanSegment {
  id: string;
  startTime: number;
  endTime: number;
  adjustedStartTime?: number;
  adjustedEndTime?: number;
  quality?: number;
}

interface TimelineItem {
  type: string;
  startTime: number;
  endTime: number;
  content?: string;
  segmentId?: string;
  sourceStart?: number;
  sourceEnd?: number;
  position?: { x: number; y: number };
}

export default function AIStudio() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [contentPlan, setContentPlan] = useState<ContentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [adjustedSegments, setAdjustedSegments] = useState<PlanSegment[]>([]);
  const [showAdjuster, setShowAdjuster] = useState(false);
  const [creatingVideo, setCreatingVideo] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationResult, setCreationResult] = useState<{
    videoUrl?: string;
    videoId?: string;
  } | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    const storedPersona =
      typeof window !== 'undefined' ? localStorage.getItem('activePersona') : null;
    setActivePersonaId(storedPersona);
  }, []);

  useEffect(() => {
    if (!contentPlan) {
      setAdjustedSegments([]);
      return;
    }

    const normalized: PlanSegment[] = (contentPlan.segments || []).map((segment: PlanSegment) => ({
      ...segment,
      adjustedStartTime:
        typeof segment.adjustedStartTime === 'number'
          ? segment.adjustedStartTime
          : segment.startTime,
      adjustedEndTime:
        typeof segment.adjustedEndTime === 'number' ? segment.adjustedEndTime : segment.endTime,
    }));
    setAdjustedSegments(normalized);
  }, [contentPlan]);

  const planVideo = useMemo(() => {
    if (contentPlan?.video?.id) {
      return videos.find((video) => video.id === contentPlan.video.id) || null;
    }
    return videos.find((video) => video.id === selectedVideo) || null;
  }, [videos, contentPlan, selectedVideo]);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/broll');
      if (response.ok) {
        const data = await response.json();

        // Get videos with segment counts
        const videosWithSegments = await Promise.all(
          (data.broll || []).map(async (video: any) => {
            try {
              const segResponse = await fetch(`/api/broll/${video.id}/segments`);
              const segData = await segResponse.json();
              return {
                ...video,
                segmentCount: segData.segments?.length || 0,
              };
            } catch {
              return { ...video, segmentCount: 0 };
            }
          })
        );

        setVideos(videosWithSegments.filter((v) => v.segmentCount > 0));
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentsAdjusted = (segments: PlanSegment[]) => {
    setAdjustedSegments(segments);
    setContentPlan((previous) => {
      if (!previous) return previous;
      const updatedTimeline = buildTimelineFromSegments(
        segments,
        previous.script,
        previous.template?.type || 'instagram-reel'
      );
      return {
        ...previous,
        segments,
        timeline: updatedTimeline,
      };
    });
  };

  const generateContent = async () => {
    if (!selectedVideo || !prompt.trim()) return;
    if (!activePersonaId) {
      alert('Select a persona first using the persona switcher in the dashboard header.');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: selectedVideo,
          prompt: prompt.trim(),
          personaId: activePersonaId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setContentPlan(data.contentPlan);
        setCreationResult(null);
        setCreationError(null);
        setShowAdjuster(false);
      } else {
        const error = await response.json();
        alert(`Failed to generate content: ${error.error}`);
      }
    } catch (error) {
      alert('Network error generating content');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateVideo = async () => {
    if (!contentPlan) {
      alert('Generate a content plan first.');
      return;
    }
    if (!activePersonaId) {
      alert('Select a persona first using the persona switcher.');
      return;
    }
    if (!planVideo?.id) {
      alert('Select a source video with segments.');
      return;
    }

    setCreatingVideo(true);
    setCreationError(null);
    setCreationResult(null);

    try {
      const response = await fetch('/api/ai/create-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId: activePersonaId,
          videoId: contentPlan.video.id,
          segments: adjustedSegments,
          timeline: contentPlan.timeline,
          script: contentPlan.script,
          template: contentPlan.template,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Video creation failed');
      }

      const data = await response.json();
      setCreationResult({
        videoUrl: data.videoUrl || data.video?.fileUrl,
        videoId: data.video?.id,
      });
    } catch (error) {
      setCreationError(error instanceof Error ? error.message : 'Video creation failed');
    } finally {
      setCreatingVideo(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const segmentsForDisplay: PlanSegment[] = adjustedSegments.length
    ? adjustedSegments
    : (contentPlan?.segments as PlanSegment[]) || [];
  const timelineToDisplay: TimelineItem[] = (contentPlan?.timeline as TimelineItem[]) || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost">← Dashboard</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">🎬 AI Content Studio</h1>
            <p className="text-muted-foreground">
              Generate authentic content using your voice + video segments
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading videos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Content Generator */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>🤖 Generate Content</CardTitle>
                  <p className="text-muted-foreground">
                    AI will use your voice + video segments to create authentic content
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Video Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Video</label>
                    <select
                      value={selectedVideo}
                      onChange={(e) => setSelectedVideo(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Choose a video with segments...</option>
                      {videos.map((video) => (
                        <option key={video.id} value={video.id}>
                          {video.name} ({video.segmentCount} segments)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Content Prompt */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Content Idea</label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe what you want to create...

Examples:
• Create a motivational morning routine video
• Make an engaging productivity tips reel  
• Generate content about work-life balance
• Create a behind-the-scenes video"
                      className="w-full h-32 p-3 border rounded-lg resize-none"
                    />
                  </div>

                  <Button
                    onClick={generateContent}
                    disabled={generating || !selectedVideo || !prompt.trim() || !activePersonaId}
                    className="w-full"
                    size="lg"
                  >
                    {generating ? '🤖 AI Generating...' : '✨ Generate Content'}
                  </Button>

                  {!activePersonaId && (
                    <p className="text-xs text-amber-600">
                      Select an active persona from the dashboard switcher to enable generation.
                    </p>
                  )}

                  {videos.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      <p>No videos with segments found.</p>
                      <Link href="/dashboard/content" className="text-primary hover:underline">
                        Create some segments first →
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Voice Profile Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">🧠 Your Digital Voice</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <Link href="/dashboard/voice-profile">
                      <Button variant="outline" className="w-full">
                        Manage Voice Profile
                      </Button>
                    </Link>
                    <p className="text-muted-foreground text-xs mt-2">
                      Train AI to write in your authentic voice
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generated Content Preview */}
            <div>
              {contentPlan ? (
                <Card>
                  <CardHeader>
                    <CardTitle>✨ Generated Content</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {contentPlan.template.type.replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline">{contentPlan.segments.length} segments</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Script Preview */}
                    <div>
                      <h4 className="font-medium mb-2">📝 Your Script</h4>
                      <div className="bg-muted rounded-lg p-4 space-y-2">
                        <p className="font-medium text-primary">Hook: {contentPlan.script.hook}</p>
                        <div>
                          <p className="text-sm font-medium mb-1">Script:</p>
                          {contentPlan.script.script.map((line: string, i: number) => (
                            <p key={i} className="text-sm">
                              • {line}
                            </p>
                          ))}
                        </div>
                        <p className="text-sm">
                          <strong>Caption:</strong> {contentPlan.script.caption}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {contentPlan.script.hashtags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Video Segments */}
                    <div>
                      <h4 className="font-medium mb-2">🎬 Selected Segments</h4>
                      <div className="space-y-2">
                        {segmentsForDisplay.map((segment, i: number) => (
                          <div
                            key={segment.id || i}
                            className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-2 bg-muted rounded"
                          >
                            <div>
                              <span className="block font-mono text-sm">
                                Original: {formatDuration(segment.startTime)} →{' '}
                                {formatDuration(segment.endTime)}
                              </span>
                              <span className="block font-mono text-xs text-primary">
                                Adjusted:{' '}
                                {formatDuration(segment.adjustedStartTime ?? segment.startTime)} →{' '}
                                {formatDuration(segment.adjustedEndTime ?? segment.endTime)}
                              </span>
                            </div>
                            <Badge variant="secondary">{segment.quality}/10</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="font-medium mb-2">⏱️ Timeline Preview</h4>
                      <div className="space-y-1 text-sm">
                        {timelineToDisplay.map((item, i: number) => (
                          <div key={`${item.type}-${i}`} className="flex items-center space-x-2">
                            <span className="font-mono w-16">{formatDuration(item.startTime)}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.type}
                            </Badge>
                            <span className="text-muted-foreground">
                              {item.type === 'video-segment' && item.segmentId
                                ? `Segment ${item.segmentId} (${formatDuration(
                                    item.sourceStart ?? 0
                                  )} → ${formatDuration(item.sourceEnd ?? 0)})`
                                : item.content || `Segment ${i + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Segment Adjuster */}
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowAdjuster((prev) => !prev)}
                      >
                        {showAdjuster ? 'Hide Segment Adjuster' : 'Adjust Segments'}
                      </Button>
                      {showAdjuster && planVideo?.fileUrl ? (
                        <SegmentAdjuster
                          videoUrl={planVideo.fileUrl}
                          videoDuration={planVideo.duration}
                          segments={segmentsForDisplay}
                          script={contentPlan.script}
                          onChange={handleSegmentsAdjusted}
                        />
                      ) : (
                        showAdjuster && (
                          <p className="text-sm text-muted-foreground">
                            Select a video that has an accessible file URL to preview adjustments.
                          </p>
                        )
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleCreateVideo}
                        disabled={creatingVideo || !activePersonaId}
                      >
                        {creatingVideo ? 'Rendering…' : '🎥 Create Video'}
                      </Button>
                      {creationError && (
                        <p className="text-sm text-red-500 text-center">{creationError}</p>
                      )}
                      {creationResult?.videoUrl && (
                        <a
                          href={creationResult.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center text-sm text-primary underline"
                        >
                          View rendered video →
                        </a>
                      )}
                      <Button variant="outline" className="w-full">
                        📋 Save as Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="text-4xl mb-4">🎭</div>
                    <p className="text-muted-foreground">
                      Select a video and describe what you want to create
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function buildTimelineFromSegments(
  segments: PlanSegment[],
  script: any,
  _templateType?: string
): TimelineItem[] {
  const timeline: TimelineItem[] = [];
  let currentTime = 0;

  if (script?.hook) {
    timeline.push({
      type: 'text-overlay',
      startTime: currentTime,
      endTime: currentTime + 3,
      content: script.hook,
      position: { x: 0.5, y: 0.3 },
    });
  }

  segments.forEach((segment, index) => {
    const start =
      typeof segment.adjustedStartTime === 'number' ? segment.adjustedStartTime : segment.startTime;
    const end =
      typeof segment.adjustedEndTime === 'number' ? segment.adjustedEndTime : segment.endTime;
    const duration = Math.max(0, end - start);
    if (duration <= 0.05) {
      return;
    }

    timeline.push({
      type: 'video-segment',
      startTime: currentTime,
      endTime: currentTime + duration,
      segmentId: segment.id,
      sourceStart: start,
      sourceEnd: end,
    });

    if (Array.isArray(script?.script) && script.script[index]) {
      timeline.push({
        type: 'text-overlay',
        startTime: currentTime + 1,
        endTime: currentTime + Math.max(1, duration - 0.5),
        content: script.script[index],
        position: { x: 0.5, y: 0.7 },
      });
    }

    currentTime += duration;
  });

  if (script?.callToAction) {
    timeline.push({
      type: 'text-overlay',
      startTime: Math.max(0, currentTime - 3),
      endTime: currentTime,
      content: script.callToAction,
      position: { x: 0.5, y: 0.8 },
    });
  }

  return timeline;
}
