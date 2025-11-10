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

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleanedUp, setCleanedUp] = useState(false);

  useEffect(() => {
    cleanupAndFetch();
  }, []);

  const cleanupAndFetch = async () => {
    try {
      // First cleanup placeholder videos
      if (!cleanedUp) {
        await fetch('/api/broll/cleanup', { method: 'POST' });
        setCleanedUp(true);
      }

      // Then fetch real videos
      const response = await fetch('/api/broll');
      if (response.ok) {
        const data = await response.json();
        // Only show videos with real R2 URLs
        const realVideos = (data.broll || []).filter((v: Video) => 
          v.fileUrl.includes('r2.dev') || v.fileUrl.includes('r2.cloudflarestorage.com')
        );
        setVideos(realVideos);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading your content studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">🎬 AI Content Studio</h1>
              <p className="text-muted-foreground">Create authentic content with AI + your videos</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/dashboard/upload">
                <Button>📤 Upload Videos</Button>
              </Link>
              <Link href="/dashboard/voice-profile">
                <Button variant="outline">🧠 Digital Me</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Main Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Video Content Creation */}
          <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                  <div className="text-2xl">🎬</div>
                </div>
                <div>
                  <CardTitle>Video Content</CardTitle>
                  <p className="text-muted-foreground text-sm">Upload, segment, and create video content</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/upload" className="block">
                <Button variant="outline" className="w-full justify-start">
                  📤 Upload Videos
                </Button>
              </Link>
              <Link href="/dashboard/content" className="block">
                <Button variant="outline" className="w-full justify-start">
                  ✂️ Create Segments
                </Button>
              </Link>
              <Link href="/dashboard/ai-video-studio" className="block">
                <Button className="w-full justify-start">
                  🤖 AI Video Generation
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* AI Image Studio */}
          <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-500">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                  <div className="text-2xl">🎨</div>
                </div>
                <div>
                  <CardTitle>AI Image Studio</CardTitle>
                  <p className="text-muted-foreground text-sm">Create product shots and model photography</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/create-images" className="block">
                <Button className="w-full justify-start">
                  ✨ Create Images
                </Button>
              </Link>
              <Link href="/dashboard/asset-banks" className="block">
                <Button variant="outline" className="w-full justify-start">
                  📁 Asset Banks
                </Button>
              </Link>
              <div className="text-xs text-muted-foreground">
                <p>• Product + Wall Art</p>
                <p>• Model Photography</p>
                <p>• Cost: $0.05-0.35 per image</p>
              </div>
            </CardContent>
          </Card>

          {/* Digital Personas */}
          <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                  <div className="text-2xl">🧠</div>
                </div>
                <div>
                  <CardTitle>Digital Personas</CardTitle>
                  <p className="text-muted-foreground text-sm">AI voices for different content niches</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/persona-wizard" className="block">
                <Button className="w-full justify-start">
                  🧙‍♂️ Create Persona
                </Button>
              </Link>
              <Link href="/dashboard/personas" className="block">
                <Button variant="outline" className="w-full justify-start">
                  🧠 Manage Personas
                </Button>
              </Link>
              <Link href="/dashboard/succulent" className="block">
                <Button variant="outline" className="w-full justify-start">
                  🌱 Succulent Integration
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* External APIs Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🔗 External APIs</CardTitle>
            <p className="text-muted-foreground">Use these APIs from other apps (like Etsy tools)</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">📦 Product Shot API</h4>
                <p className="text-sm text-muted-foreground">Generate professional product photos</p>
                <Badge variant="outline" className="text-xs">
                  POST /api/external/generate-product-shot
                </Badge>
                <div className="text-xs text-muted-foreground">
                  Perfect for Etsy listings, product catalogs
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">🖼️ Wall Art + Product API</h4>
                <p className="text-sm text-muted-foreground">Products with artistic wall backgrounds</p>
                <Badge variant="outline" className="text-xs">
                  POST /api/external/generate-wall-art-product
                </Badge>
                <div className="text-xs text-muted-foreground">
                  Lifestyle product photography with gallery walls
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Library Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Video Library</CardTitle>
              <div className="flex space-x-2">
                <Badge variant="secondary">{videos.length} videos</Badge>
                <Badge variant="outline">
                  {Math.floor(videos.reduce((acc, v) => acc + v.duration, 0) / 60)}m total
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {videos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎬</div>
                <CardTitle className="mb-2">No videos uploaded yet</CardTitle>
                <p className="text-muted-foreground mb-6">
                  Upload your first video to start creating AI-powered content
                </p>
                <Link href="/dashboard/upload">
                  <Button size="lg">Upload Your First Video</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {videos.slice(0, 5).map((video) => (
                  <div key={video.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                        <div className="text-sm">▶️</div>
                      </div>
                      <div>
                        <p className="font-medium">{video.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDuration(video.duration)} • {video.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/dashboard/video-editor/${video.id}`}>
                        <Button size="sm" variant="outline">Segment</Button>
                      </Link>
                      <a href={video.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm">Watch</Button>
                      </a>
                    </div>
                  </div>
                ))}
                
                {videos.length > 5 && (
                  <div className="text-center pt-4">
                    <Link href="/dashboard/content">
                      <Button variant="ghost">View All {videos.length} Videos →</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        {videos.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>🚀 Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="text-2xl mb-2">✂️</div>
                  <h4 className="font-medium mb-1">1. Create Segments</h4>
                  <p className="text-sm text-muted-foreground">Break videos into quality-rated clips</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl mb-2">🧠</div>
                  <h4 className="font-medium mb-1">2. Train Digital Me</h4>
                  <p className="text-sm text-muted-foreground">Teach AI your authentic voice</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl mb-2">🎬</div>
                  <h4 className="font-medium mb-1">3. Generate Content</h4>
                  <p className="text-sm text-muted-foreground">AI creates content in your voice</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}