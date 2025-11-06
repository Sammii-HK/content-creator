'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Video {
  id: string;
  name: string;
  fileUrl: string;
  duration: number;
  category: string;
  createdAt: string;
}

export default function VideoLibrary() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/broll');
      if (response.ok) {
        const data = await response.json();
        setVideos(data.broll || []);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading your video library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Header */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost">← Dashboard</Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Video Library</h1>
                <p className="text-muted-foreground">Manage and segment your content</p>
              </div>
            </div>
            <Link href="/dashboard/upload">
              <Button>Upload New Video</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {videos.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="text-6xl mb-4">🎬</div>
              <CardTitle className="text-xl mb-2">No videos uploaded yet</CardTitle>
              <p className="text-muted-foreground mb-6">Upload your first video to start creating content</p>
              <Link href="/dashboard/upload">
                <Button size="lg">Upload Your First Video</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Video Thumbnail */}
                <div className="aspect-video bg-muted relative group">
                  <video
                    src={video.fileUrl}
                    className="w-full h-full object-cover"
                    muted
                    preload="none"
                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23374151'/%3E%3C/svg%3E"
                    onMouseEnter={(e) => {
                      const video = e.target as HTMLVideoElement;
                      if (video.readyState === 0) {
                        video.load();
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-white text-2xl">▶️</div>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="truncate">{video.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">⏱️ {formatDuration(video.duration)}</Badge>
                    <Badge variant="secondary">{video.category}</Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    📅 {new Date(video.createdAt).toLocaleDateString()}
                  </p>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <a
                      href={video.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full">
                        🎬 Watch Full Video
                      </Button>
                    </a>
                    
                    <Link href={`/dashboard/video-editor/${video.id}`} className="w-full block">
                      <Button className="w-full">
                        ✂️ Create Segments
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {videos.length > 0 && (
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>Library Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{videos.length}</div>
                  <div className="text-muted-foreground text-sm">Total Videos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.floor(videos.reduce((acc, v) => acc + v.duration, 0) / 60)}m
                  </div>
                  <div className="text-muted-foreground text-sm">Total Duration</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(videos.map(v => v.category)).size}
                  </div>
                  <div className="text-muted-foreground text-sm">Categories</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">0</div>
                  <div className="text-muted-foreground text-sm">Segments Created</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}