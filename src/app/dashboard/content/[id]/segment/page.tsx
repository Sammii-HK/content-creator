'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Video {
  id: string;
  name: string;
  fileUrl: string;
  duration: number;
}

interface Segment {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  quality: number;
  description: string;
  isUsable: boolean;
}

export default function VideoSegmentation() {
  const params = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordStart, setRecordStart] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  interface TemplateSuggestion {
    templateType: string;
    reasoning: string;
    confidence: number;
    requiredSegments: Array<{ type: string }>;
  }
  const [templateSuggestions, setTemplateSuggestions] = useState<TemplateSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchVideo();
      fetchSegments();
    }
  }, [params.id]);

  const fetchVideo = async () => {
    try {
      const response = await fetch(`/api/broll/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setVideo(data.broll);
      }
    } catch (error) {
      console.error('Failed to fetch video:', error);
    }
  };

  const fetchSegments = async () => {
    try {
      const response = await fetch(`/api/broll/${params.id}/segments`);
      if (response.ok) {
        const data = await response.json();
        setSegments(data.segments || []);
        
        // Auto-get AI suggestions if we have segments
        if (data.segments && data.segments.length >= 2) {
          getAITemplateSuggestions();
        }
      }
    } catch (error) {
      console.error('Failed to fetch segments:', error);
    }
  };

  const getAITemplateSuggestions = async () => {
    if (!params.id) return;
    
    setLoadingSuggestions(true);
    try {
      const response = await fetch('/api/ai/template-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: params.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setTemplateSuggestions(data.recommendations || []);
        setMessage(`AI found ${data.recommendations?.length || 0} template suggestions!`);
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!videoRef.current) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (videoRef.current.paused) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
        break;
      case 'ArrowRight':
        e.preventDefault();
        videoRef.current.currentTime = Math.min(video?.duration || 0, videoRef.current.currentTime + 5);
        break;
      case 'KeyS':
        e.preventDefault();
        if (!isRecording) {
          startSegment();
        } else {
          saveSegment();
        }
        break;
      case 'KeyQ':
        e.preventDefault();
        if (selectedSegment) {
          quickRate(selectedSegment, 1);
        }
        break;
      case 'KeyW':
        e.preventDefault();
        if (selectedSegment) {
          quickRate(selectedSegment, 5);
        }
        break;
      case 'KeyE':
        e.preventDefault();
        if (selectedSegment) {
          quickRate(selectedSegment, 10);
        }
        break;
    }
  }, [isRecording, selectedSegment, video]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const startSegment = () => {
    setRecordStart(currentTime);
    setIsRecording(true);
    setMessage(`Recording started at ${formatTime(currentTime)}`);
  };

  const saveSegment = async () => {
    if (!recordStart || !video) return;

    const duration = currentTime - recordStart;
    if (duration < 0.5) {
      setMessage('Segment too short (minimum 0.5 seconds)');
      return;
    }

    setMessage('Saving segment...');

    const segmentData = {
      name: `${formatTime(recordStart)}-${formatTime(currentTime)}`,
      startTime: recordStart,
      endTime: currentTime,
      description: `Segment from ${formatTime(recordStart)} to ${formatTime(currentTime)}`,
      quality: 5,
      tags: [],
      isUsable: true,
    };

    try {
      const response = await fetch(`/api/broll/${params.id}/segments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(segmentData),
      });

      if (response.ok) {
        const data = await response.json();
        setSegments([...segments, data.segment]);
        setMessage(`Segment saved: ${formatTime(recordStart)} to ${formatTime(currentTime)}`);
        setIsRecording(false);
        setRecordStart(null);
      } else {
        const error = await response.json();
        setMessage(`Failed: ${error.error}`);
      }
    } catch (error) {
      setMessage('Network error');
    }
  };

  const jumpTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const quickRate = async (segmentId: string, rating: number) => {
    try {
      const response = await fetch(`/api/broll/segments/${segmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality: rating }),
      });

      if (response.ok) {
        setSegments(segments.map(s => 
          s.id === segmentId ? { ...s, quality: rating } : s
        ));
        setMessage(`Rated ${rating}/10`);
      }
    } catch (error) {
      setMessage('Failed to update rating');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Video not found</p>
          <Link href="/dashboard/content">
            <Button variant="ghost">Back to Library</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/content">
              <Button variant="ghost">← Back to Library</Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{video.name}</h1>
              <p className="text-muted-foreground">Create segments • Use keyboard shortcuts for speed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="bg-muted border-b px-6 py-3">
          <p className="text-sm">{message}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Video Player</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Space: Play/Pause • Arrow Keys: Seek • S: Start/Save Segment
                </p>
              </CardHeader>
              
              <CardContent>
                <video
                  ref={videoRef}
                  src={video.fileUrl}
                  controls
                  className="w-full rounded-lg bg-black"
                  onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                />

                <div className="mt-4 bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-lg">
                        {formatTime(currentTime)} / {formatTime(video.duration)}
                      </div>
                      {isRecording && recordStart !== null && (
                        <div className="text-sm text-orange-600 font-medium">
                          Recording since {formatTime(recordStart)} (Duration: {formatTime(currentTime - recordStart)})
                        </div>
                      )}
                    </div>
                    
                    <div className="space-x-3">
                      {!isRecording ? (
                        <Button
                          onClick={startSegment}
                          size="lg"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Start Segment (S)
                        </Button>
                      ) : (
                        <Button
                          onClick={saveSegment}
                          size="lg"
                          variant="destructive"
                        >
                          Save Segment (S)
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Segments ({segments.length})</CardTitle>
                <Button onClick={fetchSegments} variant="ghost" size="sm">
                  Refresh
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">Click segment to jump • Q=1 W=5 E=10</p>
            </CardHeader>

            <CardContent>
              {segments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✂️</div>
                  <p className="text-muted-foreground text-sm">
                    No segments yet. Play video and press S to start
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {segments.map((segment) => (
                    <div 
                      key={segment.id} 
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedSegment === segment.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setSelectedSegment(segment.id);
                        jumpTo(segment.startTime);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Button
                          variant="link"
                          className="p-0 h-auto font-mono text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            jumpTo(segment.startTime);
                          }}
                        >
                          {formatTime(segment.startTime)} → {formatTime(segment.endTime)}
                        </Button>
                        <Badge variant={segment.isUsable ? "default" : "destructive"}>
                          {segment.isUsable ? 'GOOD' : 'SKIP'}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-3">{segment.description}</p>

                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-muted-foreground mr-2">Quality:</span>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                          <Button
                            key={rating}
                            onClick={(e) => {
                              e.stopPropagation();
                              quickRate(segment.id, rating);
                            }}
                            variant={rating <= segment.quality ? "default" : "outline"}
                            size="sm"
                            className="w-6 h-6 p-0 text-xs"
                          >
                            {rating}
                          </Button>
                        ))}
                        <Badge variant="secondary" className="ml-2">
                          {segment.quality}/10
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Template Suggestions */}
        {segments.length >= 2 && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>🤖 AI Template Suggestions</CardTitle>
                <Button 
                  onClick={getAITemplateSuggestions} 
                  variant="ghost" 
                  size="sm"
                  disabled={loadingSuggestions}
                >
                  {loadingSuggestions ? 'Analyzing...' : 'Get Suggestions'}
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">
                AI analyzes your segments and suggests optimal templates
              </p>
            </CardHeader>
            <CardContent>
              {loadingSuggestions ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground text-sm mt-2">AI analyzing your content...</p>
                </div>
              ) : templateSuggestions.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">
                    Click &quot;Get Suggestions&quot; to see AI template recommendations
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templateSuggestions.map((suggestion, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium capitalize">
                            {suggestion.templateType.replace('-', ' ')}
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            {suggestion.reasoning}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {Math.round(suggestion.confidence * 100)}% match
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Needs: {suggestion.requiredSegments.map((req: { type: string }) => req.type).join(', ')}
                      </div>
                      
                      <div className="mt-2">
                        <Button size="sm" className="mr-2">
                          Use Template
                        </Button>
                        <Button size="sm" variant="outline">
                          Preview
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Keyboard Shortcuts */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Keyboard Shortcuts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-muted-foreground">
                <Badge variant="outline" className="mr-2 font-mono">Space</Badge>
                Play/Pause
              </div>
              <div className="text-muted-foreground">
                <Badge variant="outline" className="mr-2 font-mono">Arrows</Badge>
                Seek 5s
              </div>
              <div className="text-muted-foreground">
                <Badge variant="outline" className="mr-2 font-mono">S</Badge>
                Start/Save Segment
              </div>
              <div className="text-muted-foreground">
                <Badge variant="outline" className="mr-2 font-mono">Q/W/E</Badge>
                Rate 1/5/10
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}