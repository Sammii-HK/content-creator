'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Video {
  id: string;
  name: string;
  duration: number;
  category: string;
  segmentCount?: number;
}

interface ContentPlan {
  video: any;
  template: any;
  script: any;
  segments: any[];
  timeline: any[];
}

export default function AIStudio() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [contentPlan, setContentPlan] = useState<ContentPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

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
                segmentCount: segData.segments?.length || 0
              };
            } catch {
              return { ...video, segmentCount: 0 };
            }
          })
        );
        
        setVideos(videosWithSegments.filter(v => v.segmentCount > 0));
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async () => {
    if (!selectedVideo || !prompt.trim()) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: selectedVideo,
          prompt: prompt.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setContentPlan(data.contentPlan);
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            <p className="text-muted-foreground">Generate authentic content using your voice + video segments</p>
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
                    disabled={generating || !selectedVideo || !prompt.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {generating ? '🤖 AI Generating...' : '✨ Generate Content'}
                  </Button>

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
                      <Badge variant="outline">
                        {contentPlan.segments.length} segments
                      </Badge>
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
                            <p key={i} className="text-sm">• {line}</p>
                          ))}
                        </div>
                        <p className="text-sm"><strong>Caption:</strong> {contentPlan.script.caption}</p>
                        <div className="flex flex-wrap gap-1">
                          {contentPlan.script.hashtags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Video Segments */}
                    <div>
                      <h4 className="font-medium mb-2">🎬 Selected Segments</h4>
                      <div className="space-y-2">
                        {contentPlan.segments.map((segment: any, i: number) => (
                          <div key={segment.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="font-mono text-sm">
                              {formatDuration(segment.startTime)} → {formatDuration(segment.endTime)}
                            </span>
                            <Badge variant="secondary">{segment.quality}/10</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="font-medium mb-2">⏱️ Timeline Preview</h4>
                      <div className="space-y-1 text-sm">
                        {contentPlan.timeline.map((item: any, i: number) => (
                          <div key={i} className="flex items-center space-x-2">
                            <span className="font-mono w-16">
                              {formatDuration(item.startTime)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {item.type}
                            </Badge>
                            <span className="text-muted-foreground">
                              {item.content || `Segment ${i + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <Button className="w-full" size="lg">
                        🎥 Create Video
                      </Button>
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
