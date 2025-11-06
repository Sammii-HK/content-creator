'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function SimpleVideoEditor() {
  const params = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [message, setMessage] = useState('');

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
      }
    } catch (error) {
      console.error('Failed to fetch segments:', error);
    }
  };

  const markStart = () => {
    setStartTime(currentTime);
    setMessage(`✅ Start marked at ${formatTime(currentTime)}`);
  };

  const createSegment = async () => {
    if (startTime === null) {
      setMessage('❌ Mark start time first');
      return;
    }

    if (currentTime <= startTime) {
      setMessage('❌ End time must be after start time');
      return;
    }

    const duration = currentTime - startTime;
    if (duration < 1) {
      setMessage('❌ Segment must be at least 1 second');
      return;
    }

    setMessage('💾 Creating segment...');

    const segmentData = {
      name: `Clip ${formatTime(startTime)}-${formatTime(currentTime)}`,
      startTime,
      endTime: currentTime,
      description: `Video segment from ${formatTime(startTime)} to ${formatTime(currentTime)}`,
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
        setMessage(`✅ Segment created: ${formatTime(startTime)} to ${formatTime(currentTime)}`);
        setStartTime(null);
      } else {
        const error = await response.json();
        setMessage(`❌ Failed: ${error.error}`);
      }
    } catch (error) {
      setMessage('❌ Network error');
    }
  };

  const updateRating = async (segmentId: string, rating: number) => {
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
        setMessage(`✅ Rated ${rating}/10`);
      }
    } catch (error) {
      setMessage('❌ Failed to update rating');
    }
  };

  const jumpTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
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
        <p>Loading video...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/dashboard/content">
            <Button variant="ghost">← Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{video.name}</h1>
            <p className="text-muted-foreground">Create segments from this video</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Player */}
          <Card>
            <CardHeader>
              <CardTitle>Video Player</CardTitle>
            </CardHeader>
            <CardContent>
              <video
                ref={videoRef}
                src={video.fileUrl}
                controls
                className="w-full rounded-lg mb-4"
                onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
              />

              {/* Simple Controls */}
              <div className="space-y-4">
                <div className="text-center">
                  <p className="font-mono text-lg mb-2">
                    Current: {formatTime(currentTime)} / {formatTime(video.duration)}
                  </p>
                  {startTime !== null && (
                    <p className="text-sm text-orange-600">
                      Start marked at {formatTime(startTime)} • Duration so far: {formatTime(currentTime - startTime)}
                    </p>
                  )}
                </div>

                <div className="flex justify-center space-x-3">
                  <Button 
                    onClick={markStart}
                    variant="outline"
                    size="lg"
                  >
                    📍 Mark Start
                  </Button>
                  
                  <Button 
                    onClick={createSegment}
                    disabled={startTime === null}
                    size="lg"
                  >
                    ✂️ Create Segment
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <p>1. Play video to find start → Click "Mark Start"</p>
                  <p>2. Play to end point → Click "Create Segment"</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segments List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Segments ({segments.length})</CardTitle>
                <Button onClick={fetchSegments} variant="ghost" size="sm">
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {segments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✂️</div>
                  <p className="text-muted-foreground">No segments yet</p>
                  <p className="text-sm text-muted-foreground">Follow the steps above to create your first segment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {segments.map((segment) => (
                    <div key={segment.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Button
                          variant="link"
                          className="p-0 h-auto font-mono"
                          onClick={() => jumpTo(segment.startTime)}
                        >
                          {formatTime(segment.startTime)} → {formatTime(segment.endTime)}
                        </Button>
                        <Badge variant={segment.isUsable ? "default" : "destructive"}>
                          {segment.quality}/10
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {segment.description}
                      </p>

                      {/* Simple Rating */}
                      <div className="flex items-center space-x-1">
                        <span className="text-xs mr-2">Rate:</span>
                        {[1, 3, 5, 7, 10].map((rating) => (
                          <Button
                            key={rating}
                            onClick={() => updateRating(segment.id, rating)}
                            variant={rating <= segment.quality ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0 text-xs"
                          >
                            {rating}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
