'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Scissors, 
  Sparkles, 
  Brain, 
  Palette, 
  Video, 
  Users, 
  BarChart3,
  Zap,
  ArrowRight
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Content Studio
              </h1>
              <p className="text-gray-600 text-lg mt-2">Create authentic content with AI + your videos</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/create-images">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Images
                </Button>
              </Link>
              <Link href="/dashboard/upload">
                <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Videos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Main Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Video Content */}
          <Card className="group bg-white/70 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Video Content</CardTitle>
                  <p className="text-gray-500">Upload, segment, and create</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/upload">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <Upload className="h-4 w-4 mr-3" />
                  Upload Videos
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <Link href="/dashboard/content">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <Scissors className="h-4 w-4 mr-3" />
                  Create Segments
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <Link href="/dashboard/ai-video-studio">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <Sparkles className="h-4 w-4 mr-3" />
                  AI Video Generation
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* AI Image Studio */}
          <Card className="group bg-white/70 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">AI Image Studio</CardTitle>
                  <p className="text-gray-500">Create professional images</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/create-images">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <Sparkles className="h-4 w-4 mr-3" />
                  Create Images
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <Link href="/dashboard/asset-banks">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <Upload className="h-4 w-4 mr-3" />
                  Asset Banks
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <div className="pt-2 text-xs text-gray-500 space-y-1">
                <p>• Product + Wall Art</p>
                <p>• Model Photography</p>
                <p>• Cost: $0.05-0.35 per image</p>
              </div>
            </CardContent>
          </Card>

          {/* Digital Personas */}
          <Card className="group bg-white/70 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl shadow-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Digital Personas</CardTitle>
                  <p className="text-gray-500">AI voices for different niches</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/persona-wizard">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <Zap className="h-4 w-4 mr-3" />
                  Create Persona
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <Link href="/dashboard/personas">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <Users className="h-4 w-4 mr-3" />
                  Manage Personas
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              <Link href="/dashboard/succulent">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <div className="text-sm mr-3">🌱</div>
                  Succulent Integration
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Stats & Library Overview */}
        <Tabs defaultValue="library" className="space-y-8">
          <TabsList className="bg-white/60 border border-gray-200 p-1 shadow-sm">
            <TabsTrigger value="library" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              📁 Your Library
            </TabsTrigger>
            <TabsTrigger value="apis" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              🔗 External APIs
            </TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              📊 AI Usage
            </TabsTrigger>
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library">
            {loading ? (
              <Card className="bg-white/60 border-gray-200">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading your content library...</p>
                  </div>
                </CardContent>
              </Card>
            ) : videos.length === 0 ? (
              <Card className="bg-white/60 border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <div className="text-8xl mb-6 opacity-20">🎬</div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">Start Creating Content</h2>
                  <p className="text-gray-500 text-center max-w-md mb-8">
                    Upload your first video to begin creating AI-powered content with unlimited storage
                  </p>
                  <Link href="/dashboard/upload">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                      <Upload className="h-5 w-5 mr-2" />
                      Upload Your First Video
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <Card className="bg-white/60 border-gray-200">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{videos.length}</div>
                      <p className="text-gray-500 text-sm">Total Videos</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/60 border-gray-200">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {Math.floor(videos.reduce((acc, v) => acc + v.duration, 0) / 60)}m
                      </div>
                      <p className="text-gray-500 text-sm">Total Duration</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/60 border-gray-200">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-1">
                        {new Set(videos.map(v => v.category)).size}
                      </div>
                      <p className="text-gray-500 text-sm">Categories</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/60 border-gray-200">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-1">0</div>
                      <p className="text-gray-500 text-sm">AI Generated</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Videos */}
                <Card className="bg-white/60 border-gray-200">
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
                        <div key={video.id} className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Video className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{video.name}</p>
                              <p className="text-sm text-gray-500">
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
                                Watch
                              </Button>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* External APIs Tab */}
          <TabsContent value="apis">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-white/60 border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">🔗 External APIs</CardTitle>
                  <p className="text-gray-500">Use from other apps like Etsy tools</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <h4 className="font-medium text-blue-900 mb-1">Product Shot API</h4>
                      <p className="text-blue-700 text-sm mb-2">Generate professional product photos</p>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 font-mono text-xs">
                        POST /api/external/generate-product-shot
                      </Badge>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                      <h4 className="font-medium text-purple-900 mb-1">Wall Art + Product API</h4>
                      <p className="text-purple-700 text-sm mb-2">Products with artistic backgrounds</p>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 font-mono text-xs">
                        POST /api/external/generate-wall-art-product
                      </Badge>
                    </div>
                  </div>
                  
                  <Link href="/dashboard/integrations">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      View All APIs
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-white/60 border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">💰 Cost Estimates</CardTitle>
                  <p className="text-gray-500">Transparent pricing for all AI tools</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-green-900 font-medium">Product Photos</span>
                      <Badge className="bg-green-100 text-green-800">$0.05-0.25</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-900 font-medium">Model Shots</span>
                      <Badge className="bg-blue-100 text-blue-800">$0.08-0.30</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-purple-900 font-medium">Video Generation</span>
                      <Badge className="bg-purple-100 text-purple-800">$1.20-2.00</Badge>
                    </div>
                  </div>
                  
                  <Link href="/dashboard/ai-usage">
                    <Button variant="outline" className="w-full mt-4 border-gray-300">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Usage & Costs
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage">
            <Card className="bg-white/60 border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">📊 AI Usage Overview</CardTitle>
                <p className="text-gray-500">Monitor your AI spending and performance</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-6">Start generating content to see usage statistics</p>
                  <Link href="/dashboard/ai-usage">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      View Detailed Usage
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Next Steps */}
        {videos.length > 0 && (
          <Card className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">🚀 Recommended Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6">
                  <div className="bg-blue-100 p-4 rounded-2xl inline-block mb-4">
                    <Scissors className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">1. Create Segments</h3>
                  <p className="text-gray-600 text-sm">Break your videos into quality-rated clips for AI content generation</p>
                </div>
                <div className="text-center p-6">
                  <div className="bg-purple-100 p-4 rounded-2xl inline-block mb-4">
                    <Brain className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">2. Train AI Personas</h3>
                  <p className="text-gray-600 text-sm">Teach AI your authentic voice for different content niches</p>
                </div>
                <div className="text-center p-6">
                  <div className="bg-green-100 p-4 rounded-2xl inline-block mb-4">
                    <Sparkles className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">3. Generate Content</h3>
                  <p className="text-gray-600 text-sm">AI creates authentic content using your voice and video segments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}