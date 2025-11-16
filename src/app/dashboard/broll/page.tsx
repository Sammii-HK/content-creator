'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Play, Download, Plus } from 'lucide-react';

interface BrollVideo {
  id: string;
  name: string;
  fileUrl: string;
  duration: number;
  category?: string;
  createdAt: string;
}

export default function BrollLibrary() {
  const [videos, setVideos] = useState<BrollVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      // Get active persona from localStorage
      const activePersonaId =
        typeof window !== 'undefined' ? localStorage.getItem('activePersona') : null;

      // Fetch B-roll videos - include all videos if no persona selected, or filter by persona
      const url = activePersonaId ? `/api/broll?personaId=${activePersonaId}` : '/api/broll';

      const response = await fetch(url, {
        credentials: 'include', // Include cookies for auth
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched B-roll videos:', data.broll?.length || 0, 'total');
        // Filter out placeholder videos
        const realVideos = (data.broll || []).filter(
          (v: BrollVideo) =>
            v.fileUrl &&
            !v.fileUrl.includes('/placeholder/') &&
            !v.fileUrl.includes('example.com') &&
            !v.fileUrl.includes('test.mp4')
        );
        console.log('Filtered real B-roll videos:', realVideos.length);
        setVideos(realVideos);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch B-roll videos:', response.status, errorData);
      }
    } catch (error) {
      console.error('Failed to fetch B-roll videos:', error);
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
          <p className="text-gray-400 mt-4">Loading your B-roll library...</p>
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
                <h1 className="text-2xl font-bold">B-roll Library</h1>
                <p className="text-muted-foreground">
                  Your uploaded source videos for content creation
                </p>
              </div>
            </div>
            <Link href="/dashboard/upload">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload New Video
              </Button>
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
              <CardTitle className="text-xl mb-2">No B-roll videos uploaded yet</CardTitle>
              <p className="text-muted-foreground mb-6">
                Upload your first video to start creating content
              </p>
              <Link href="/dashboard/upload">
                <Button size="lg">Upload Your First Video</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {videos.map((video) => {
                  const thumbnail = thumbnailUrls[video.id];
                  return (
                    <div
                      key={video.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
                    >
                      {/* Thumbnail - 50x50px */}
                      <div className="relative flex-shrink-0 w-[50px] h-[50px] rounded overflow-hidden bg-muted border border-border">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={video.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback if thumbnail fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Video className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        {/* Hidden video element for thumbnail generation */}
                        <video
                          ref={(el) => {
                            if (el && !videoRefs.current[video.id]) {
                              videoRefs.current[video.id] = el;

                              // Set up event listeners only once
                              const handleLoadedMetadata = () => {
                                if (el && video.duration > 0) {
                                  try {
                                    el.currentTime = Math.min(video.duration * 0.25, 5);
                                  } catch (error) {
                                    // Video might not support seeking, skip thumbnail
                                    console.warn(`Cannot seek video ${video.name} for thumbnail`);
                                  }
                                }
                              };

                              const handleSeeked = () => {
                                if (el && el.videoWidth > 0 && el.videoHeight > 0) {
                                  setThumbnailUrls((prev) => {
                                    if (prev[video.id]) return prev; // Already have thumbnail

                                    try {
                                      const canvas = document.createElement('canvas');
                                      canvas.width = 50;
                                      canvas.height = 50;
                                      const ctx = canvas.getContext('2d');
                                      if (ctx && el.videoWidth > 0) {
                                        ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
                                        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
                                        return { ...prev, [video.id]: thumbnailUrl };
                                      }
                                    } catch (error) {
                                      // CORS or other error - silently fail
                                      console.warn(
                                        `Thumbnail generation failed for ${video.name}:`,
                                        error
                                      );
                                    }
                                    return prev;
                                  });
                                }
                              };

                              const handleError = (e: Event) => {
                                // CORS or loading error - this is expected for some video sources
                                console.warn(
                                  `Video thumbnail unavailable for ${video.name} (CORS or loading issue)`
                                );
                              };

                              el.addEventListener('loadedmetadata', handleLoadedMetadata, {
                                once: true,
                              });
                              el.addEventListener('seeked', handleSeeked, { once: true });
                              el.addEventListener('error', handleError, { once: true });

                              // Try to load - if CORS blocks it, that's okay
                              el.crossOrigin = 'anonymous';
                              el.preload = 'metadata';
                            }
                          }}
                          src={video.fileUrl}
                          className="hidden"
                          crossOrigin="anonymous"
                          preload="metadata"
                          onError={() => {
                            // Silently handle errors - thumbnails are optional
                          }}
                        />
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate">{video.name}</h3>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {formatDuration(video.duration)}
                              </Badge>
                              {video.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {video.category}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(video.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={video.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Watch
                              </a>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(video.fileUrl, '_blank');
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button size="sm" asChild>
                              <Link href={`/dashboard/generate?videoId=${video.id}`}>
                                <Play className="h-4 w-4 mr-1" />
                                Generate
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
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
                    {new Set(videos.map((v) => v.category).filter(Boolean)).size}
                  </div>
                  <div className="text-muted-foreground text-sm">Categories</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {
                      videos.filter((v) => {
                        const daysSinceUpload =
                          (Date.now() - new Date(v.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                        return daysSinceUpload <= 7;
                      }).length
                    }
                  </div>
                  <div className="text-muted-foreground text-sm">Uploaded This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
