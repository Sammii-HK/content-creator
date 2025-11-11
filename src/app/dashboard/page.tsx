'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PersonaSwitcher from '@/components/persona-switcher';
import { 
  Upload, 
  Scissors, 
  Sparkles, 
  Palette, 
  Video, 
  BarChart3,
  ArrowRight,
  Play,
  Download,
  Brain
} from 'lucide-react';

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Cleanup placeholder videos first
      await fetch('/api/broll/cleanup', { method: 'POST' });

      // Fetch real videos
      const response = await fetch('/api/broll');
      if (response.ok) {
        const data = await response.json();
        const realVideos = (data.broll || []).filter((v: Video) => 
          v.fileUrl.includes('r2.dev') || v.fileUrl.includes('r2.cloudflarestorage.com')
        );
        setVideos(realVideos);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Persona Switcher */}
      <PersonaSwitcher />

      {/* Main Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Content Studio
              </h1>
              <p className="text-gray-600">Create professional content with AI</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/dashboard/create-images">
                <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Images
                </Button>
              </Link>
              <Link href="/dashboard/upload">
                <Button variant="outline" className="border-gray-300 shadow-sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Videos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/dashboard/upload">
            <Card className="group cursor-pointer border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Upload className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Upload Videos</h3>
                </div>
                <p className="text-gray-600 text-sm mb-3">Add videos to your library</p>
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  Get started
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/content">
            <Card className="group cursor-pointer border-gray-200 hover:shadow-lg hover:border-green-300 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Scissors className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Create Segments</h3>
                </div>
                <p className="text-gray-600 text-sm mb-3">Break videos into clips</p>
                <div className="flex items-center text-green-600 text-sm font-medium">
                  Start editing
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/create-images">
            <Card className="group cursor-pointer border-gray-200 hover:shadow-lg hover:border-purple-300 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Palette className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">AI Images</h3>
                </div>
                <p className="text-gray-600 text-sm mb-3">Generate professional photos</p>
                <div className="flex items-center text-purple-600 text-sm font-medium">
                  Create images
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/ai-usage">
            <Card className="group cursor-pointer border-gray-200 hover:shadow-lg hover:border-orange-300 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">AI Usage</h3>
                </div>
                <p className="text-gray-600 text-sm mb-3">Monitor costs & credits</p>
                <div className="flex items-center text-orange-600 text-sm font-medium">
                  View usage
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Persona Management Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Personas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/dashboard/persona-wizard">
              <Card className="group cursor-pointer border-gray-200 hover:shadow-lg hover:border-pink-300 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Sparkles className="h-5 w-5 text-pink-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Create Persona</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">Build AI that matches your voice</p>
                  <div className="flex items-center text-pink-600 text-sm font-medium">
                    Start wizard
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/personas/management">
              <Card className="group cursor-pointer border-gray-200 hover:shadow-lg hover:border-indigo-300 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Brain className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Manage Personas</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">Train and configure AI voices</p>
                  <div className="flex items-center text-indigo-600 text-sm font-medium">
                    Open dashboard
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/personas">
              <Card className="group cursor-pointer border-gray-200 hover:shadow-lg hover:border-cyan-300 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-cyan-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Persona Analytics</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">View persona performance</p>
                  <div className="flex items-center text-cyan-600 text-sm font-medium">
                    View stats
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Video Library */}
        {loading ? (
          <Card className="border-gray-200">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your content...</p>
              </div>
            </CardContent>
          </Card>
        ) : videos.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="text-6xl mb-6 opacity-30">🎬</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Welcome to Your Studio</h2>
              <p className="text-gray-600 text-center max-w-md mb-8">
                Upload your first video to start creating AI-powered content with unlimited storage
              </p>
              <Link href="/dashboard/upload">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Your First Video
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Library Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{videos.length}</div>
                  <p className="text-gray-600 text-sm">Videos</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {Math.floor(videos.reduce((acc, v) => acc + v.duration, 0) / 60)}m
                  </div>
                  <p className="text-gray-600 text-sm">Total Duration</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {new Set(videos.map(v => v.category)).size}
                  </div>
                  <p className="text-gray-600 text-sm">Categories</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">0</div>
                  <p className="text-gray-600 text-sm">AI Generated</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Videos */}
            <Card className="border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-gray-900">Recent Videos</CardTitle>
                  <Link href="/dashboard/content">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                      View All
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {videos.slice(0, 5).map((video) => (
                    <div key={video.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
                          <Video className="h-4 w-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{video.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatDuration(video.duration)} • {video.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/dashboard/video-editor/${video.id}`}>
                          <Button size="sm" variant="outline" className="border-gray-300">
                            <Scissors className="h-3 w-3 mr-2" />
                            Segment
                          </Button>
                        </Link>
                        <a href={video.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Play className="h-3 w-3 mr-2" />
                            Watch
                          </Button>
                        </a>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/video/download', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  videoUrl: video.fileUrl, 
                                  filename: `${video.name}.mp4` 
                                })
                              });
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${video.name}.mp4`;
                              a.click();
                            } catch (error) {
                              alert('Download failed');
                            }
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* External APIs */}
        <Card className="mt-12 border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">🔗 External APIs</CardTitle>
            <p className="text-gray-600">Use these from other apps like Etsy tools</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">📦 Product Shot API</h3>
                <p className="text-blue-700 text-sm mb-3">Generate professional product photos</p>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 font-mono text-xs mb-3">
                  POST /api/external/generate-product-shot
                </Badge>
                <p className="text-blue-600 text-xs">Perfect for Etsy listings and product catalogs</p>
              </div>
              
              <div className="p-6 bg-purple-50 rounded-xl border border-purple-100">
                <h3 className="font-semibold text-purple-900 mb-2">🖼️ Wall Art + Product API</h3>
                <p className="text-purple-700 text-sm mb-3">Products with artistic backgrounds</p>
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 font-mono text-xs mb-3">
                  POST /api/external/generate-wall-art-product
                </Badge>
                <p className="text-purple-600 text-xs">Lifestyle product photography with gallery walls</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        {videos.length > 0 && (
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">🚀 Recommended Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Scissors className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">1. Create Segments</h3>
                  <p className="text-gray-600 text-sm">Break videos into quality-rated clips</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">2. Generate Content</h3>
                  <p className="text-gray-600 text-sm">AI creates authentic content using your voice</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <div className="text-green-600 text-2xl">🌱</div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">3. Post to Social</h3>
                  <p className="text-gray-600 text-sm">Distribute via Succulent to all platforms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}