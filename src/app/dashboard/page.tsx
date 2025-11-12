'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, Sidebar, MainContent, MobileMenuButton } from '@/components/ui/sidebar';
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
  Brain,
  TrendingUp,
  Clock,
  Users,
  Zap
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
    <SidebarProvider>
      <div className="flex min-h-screen bg-background lg:flex-row">
        <Sidebar />
        
        <MainContent className="flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
              <MobileMenuButton />
              
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    Dashboard
                  </h1>
                  <p className="text-sm text-foreground-muted">
                    Welcome back to your content studio
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link href="/dashboard/create-images">
                    <Button size="sm">
                      <Sparkles className="h-4 w-4" />
                      <span className="hidden sm:inline">Create Images</span>
                    </Button>
                  </Link>
                  <Link href="/dashboard/upload">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                      <span className="hidden sm:inline">Upload</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </header>

          {/* Persona Switcher */}
          <PersonaSwitcher />

          {/* Main Content */}
          <div className="flex-1 space-y-8 p-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground-muted">Total Videos</p>
                      <p className="text-2xl font-semibold text-foreground">{videos.length}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-success">
                    <TrendingUp className="mr-1 h-4 w-4" />
                    <span>+12% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground-muted">Total Duration</p>
                      <p className="text-2xl font-semibold text-foreground">
                        {Math.floor(videos.reduce((acc, v) => acc + v.duration, 0) / 60)}m
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                      <Clock className="h-6 w-6 text-success" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-success">
                    <TrendingUp className="mr-1 h-4 w-4" />
                    <span>+8% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground-muted">AI Generated</p>
                      <p className="text-2xl font-semibold text-foreground">24</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                      <Sparkles className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-success">
                    <TrendingUp className="mr-1 h-4 w-4" />
                    <span>+32% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground-muted">Engagement</p>
                      <p className="text-2xl font-semibold text-foreground">94%</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                      <Users className="h-6 w-6 text-success" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-success">
                    <TrendingUp className="mr-1 h-4 w-4" />
                    <span>+5% from last month</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/dashboard/upload" className="block">
                <Card className="group h-full cursor-pointer transition-all duration-200 hover:shadow-elevated hover:scale-[1.02] active:scale-[0.98]">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="mb-1 text-lg font-semibold text-foreground">Upload Videos</h3>
                        <p className="text-sm text-foreground-muted">Add to your library</p>
                      </div>
                      <Button variant="ghost" size="sm" className="w-fit -ml-2 group-hover:text-primary">
                        Get started
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard/content" className="block">
                <Card className="group h-full cursor-pointer transition-all duration-200 hover:shadow-elevated hover:scale-[1.02] active:scale-[0.98]">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground transition-colors">
                        <Scissors className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="mb-1 text-lg font-semibold text-foreground">Create Segments</h3>
                        <p className="text-sm text-foreground-muted">Break videos into clips</p>
                      </div>
                      <Button variant="ghost" size="sm" className="w-fit -ml-2 group-hover:text-success">
                        Start editing
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard/create-images" className="block">
                <Card className="group h-full cursor-pointer transition-all duration-200 hover:shadow-elevated hover:scale-[1.02] active:scale-[0.98]">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning group-hover:bg-warning group-hover:text-warning-foreground transition-colors">
                        <Palette className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="mb-1 text-lg font-semibold text-foreground">AI Images</h3>
                        <p className="text-sm text-foreground-muted">Generate professional photos</p>
                      </div>
                      <Button variant="ghost" size="sm" className="w-fit -ml-2 group-hover:text-warning">
                        Create images
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard/ai-usage" className="block">
                <Card className="group h-full cursor-pointer transition-all duration-200 hover:shadow-elevated hover:scale-[1.02] active:scale-[0.98]">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="mb-1 text-lg font-semibold text-foreground">AI Usage</h3>
                        <p className="text-sm text-foreground-muted">Monitor costs & credits</p>
                      </div>
                      <Button variant="ghost" size="sm" className="w-fit -ml-2 group-hover:text-primary">
                        View usage
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Recent Activity & Content */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Recent Videos */}
              {loading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                      <p className="text-foreground-muted">Loading your content...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : videos.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-20">
                    <div className="mb-6 text-6xl opacity-30">🎬</div>
                    <h2 className="mb-3 text-2xl font-semibold text-foreground">Welcome to Your Studio</h2>
                    <p className="mb-8 max-w-md text-center text-foreground-muted">
                      Upload your first video to start creating AI-powered content with unlimited storage
                    </p>
                    <Link href="/dashboard/upload">
                      <Button size="lg">
                        <Upload className="h-5 w-5" />
                        Upload Your First Video
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Videos</CardTitle>
                      <Link href="/dashboard/content">
                        <Button variant="ghost" size="sm">
                          View All
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {videos.slice(0, 5).map((video) => (
                        <div key={video.id} className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-background-secondary">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-border bg-background shadow-soft">
                              <Video className="h-4 w-4 text-foreground-muted" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{video.name}</p>
                              <p className="text-sm text-foreground-muted">
                                {formatDuration(video.duration)} • {video.category}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/video-editor/${video.id}`}>
                              <Button size="sm" variant="outline">
                                <Scissors className="mr-2 h-3 w-3" />
                                Edit
                              </Button>
                            </Link>
                            <a href={video.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm">
                                <Play className="mr-2 h-3 w-3" />
                                Watch
                              </Button>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Personas Section */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Personas</CardTitle>
                  <p className="text-sm text-foreground-muted">Manage your AI-powered content voices</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Link href="/dashboard/persona-wizard" className="block">
                      <Card className="group h-full cursor-pointer transition-all duration-200 hover:shadow-elevated hover:scale-[1.01] active:scale-[0.99]">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">Create New Persona</h3>
                              <p className="text-sm text-foreground-muted">Build AI that matches your voice</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-foreground-muted transition-transform group-hover:translate-x-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                    
                    <Link href="/dashboard/personas/management" className="block">
                      <Card className="group h-full cursor-pointer transition-all duration-200 hover:shadow-elevated hover:scale-[1.01] active:scale-[0.99]">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
                              <Brain className="h-6 w-6 text-success" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">Manage Personas</h3>
                              <p className="text-sm text-foreground-muted">Train and configure AI voices</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-foreground-muted transition-transform group-hover:translate-x-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </MainContent>
      </div>
    </SidebarProvider>
  );
}