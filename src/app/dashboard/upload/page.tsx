'use client';

import { useState } from 'react';
import Link from 'next/link';
import FileUpload from '@/components/ui/FileUpload';
import { ArrowLeft, CheckCircle, Upload, Video, FileText, Tag, Sparkles, Lightbulb, Cloud, Zap, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SidebarProvider, Sidebar, MainContent, MobileMenuButton } from '@/components/ui/sidebar';
import PersonaSwitcher from '@/components/persona-switcher';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function UploadPage() {
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoMetadata, setVideoMetadata] = useState({
    name: '',
    description: '',
    category: 'general',
    tags: [] as string[]
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setVideoMetadata({
      name: file.name.replace(/\.[^/.]+$/, ""),
      description: '',
      category: 'general',
      tags: []
    });
  };

  const handleUpload = async (file: File, metadata: any) => {
    console.log('🚀 Starting R2 upload...');
    setUploading(true);
    setUploadProgress(10);
    
    try {
      const { ClientR2Uploader } = await import('@/lib/r2-storage');
      const uploader = new ClientR2Uploader();

      setUploadProgress(30);
      const uploadResult = await uploader.uploadFile(file);
      setUploadProgress(70);

      // Save to database
      const fileSizeMB = file.size / (1024 * 1024);
      const estimatedDuration = Math.max(5, Math.min(300, Math.round(fileSizeMB * 8)));
      
      const dbResponse = await fetch('/api/broll/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: videoMetadata.name || metadata.name || file.name.replace(/\.[^/.]+$/, ""),
          description: videoMetadata.description || metadata.description || `Video: ${file.name}`,
          fileUrl: uploadResult.url,
          duration: estimatedDuration,
          category: videoMetadata.category || metadata.category || 'general',
          tags: videoMetadata.tags.length > 0 ? videoMetadata.tags : (metadata.tags || [])
        })
      });

      if (!dbResponse.ok) {
        throw new Error('Database save failed');
      }

      const result = await dbResponse.json();
      setRecentUploads(prev => [result.broll, ...prev].slice(0, 5));
      setUploadProgress(100);
      
      // Reset after successful upload
      setSelectedFile(null);
      setVideoMetadata({ name: '', description: '', category: 'general', tags: [] });
      
      return result;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
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
                <div className="flex items-center gap-4">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">Upload Content</h1>
                    <p className="text-sm text-foreground-muted">Add videos to your AI content library</p>
                  </div>
                </div>
                
                {recentUploads.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{recentUploads.length} recent</Badge>
                    <Link href="/dashboard/content">
                      <Button size="sm">View Library</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Persona Switcher */}
          <PersonaSwitcher />

          <div className="flex-1 overflow-auto">
            <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Upload Section - Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Upload Video
                      </CardTitle>
                      <CardDescription>
                        Drag & drop or click to select • Unlimited size with R2
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FileUpload 
                        onUpload={handleUpload} 
                        onFileSelect={handleFileSelect}
                        maxSize={500} 
                      />
                      
                      {uploading && uploadProgress > 0 && (
                        <div className="mt-6 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Uploading...</span>
                            <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Video Details - Only show when file is selected */}
                  {selectedFile && !uploading && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Video Details
                        </CardTitle>
                        <CardDescription>
                          Add metadata to help organize your content
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Video Name</Label>
                          <Input
                            id="name"
                            value={videoMetadata.name}
                            onChange={(e) => setVideoMetadata({ ...videoMetadata, name: e.target.value })}
                            placeholder="Enter video name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={videoMetadata.description}
                            onChange={(e) => setVideoMetadata({ ...videoMetadata, description: e.target.value })}
                            placeholder="Describe your video..."
                            rows={3}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <select
                            id="category"
                            value={videoMetadata.category}
                            onChange={(e) => setVideoMetadata({ ...videoMetadata, category: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="general">General</option>
                            <option value="personal">Personal</option>
                            <option value="product">Product</option>
                            <option value="tutorial">Tutorial</option>
                            <option value="entertainment">Entertainment</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Video className="h-4 w-4" />
                          <span>{selectedFile.name}</span>
                          <span className="ml-auto">
                            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recent Uploads */}
                  {recentUploads.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-success" />
                          Recent Uploads
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {recentUploads.map((upload, index) => (
                            <div key={index} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-background-secondary">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                                <CheckCircle className="h-5 w-5 text-success" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{upload.name}</p>
                                <p className="text-sm text-muted-foreground">{upload.duration}s • {upload.category}</p>
                              </div>
                              <Link href={`/dashboard/video-editor/${upload.id}`}>
                                <Button size="sm" variant="outline">
                                  <Scissors className="h-4 w-4" />
                                  <span className="hidden sm:inline">Segment</span>
                                </Button>
                              </Link>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6">
                  {/* Best Practices - Modern & Airy */}
                  <Card className="border-primary/20 bg-gradient-to-br from-background to-background-secondary/50">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Lightbulb className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Best Practices</CardTitle>
                          <CardDescription>Tips for better content</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10">
                            <CheckCircle className="h-4 w-4 text-success" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">High-quality source</p>
                            <p className="text-xs text-muted-foreground">Upload the best quality you have for maximum flexibility</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Tag className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Descriptive names</p>
                            <p className="text-xs text-muted-foreground">Use clear, searchable names to find videos easily</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning/10">
                            <Sparkles className="h-4 w-4 text-warning" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Add categories</p>
                            <p className="text-xs text-muted-foreground">Organize with categories and tags for better AI training</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Link href="/dashboard/content" className="block">
                        <Button variant="outline" className="w-full justify-start">
                          <Video className="h-4 w-4" />
                          View All Videos
                        </Button>
                      </Link>
                      <Link href="/dashboard/create-images" className="block">
                        <Button variant="outline" className="w-full justify-start">
                          <Sparkles className="h-4 w-4" />
                          Create AI Images
                        </Button>
                      </Link>
                      <Link href="/dashboard/persona-wizard" className="block">
                        <Button variant="outline" className="w-full justify-start">
                          <Sparkles className="h-4 w-4" />
                          Create AI Persona
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* R2 Storage Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Cloud className="h-5 w-5" />
                        Storage Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border border-border bg-background-secondary/50 p-3">
                        <span className="text-sm text-muted-foreground">File Size Limit</span>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">Unlimited</Badge>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-background-secondary/50 p-3">
                        <span className="text-sm text-muted-foreground">Storage Cost</span>
                        <Badge variant="outline">~$0.015/GB</Badge>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-background-secondary/50 p-3">
                        <span className="text-sm text-muted-foreground">Upload Speed</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Direct to R2</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </MainContent>
      </div>
    </SidebarProvider>
  );
}