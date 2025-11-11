'use client';

import { useState } from 'react';
import Link from 'next/link';
import FileUpload from '@/components/ui/FileUpload';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SidebarProvider, Sidebar, MainContent, MobileMenuButton } from '@/components/ui/sidebar';
import PersonaSwitcher from '@/components/persona-switcher';

export default function UploadPage() {
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
          name: metadata.name || file.name.replace(/\.[^/.]+$/, ""),
          description: metadata.description || `Video: ${file.name}`,
          fileUrl: uploadResult.url,
          duration: estimatedDuration,
          category: metadata.category || 'personal',
          tags: metadata.tags || []
        })
      });

      if (!dbResponse.ok) {
        throw new Error('Database save failed');
      }

      const result = await dbResponse.json();
      setRecentUploads(prev => [result.broll, ...prev].slice(0, 5));
      setUploadProgress(100);
      
      return result;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        
        <MainContent>
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-4 px-6">
              <MobileMenuButton />
              
              <div className="flex flex-1 items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">📤 Upload Content</h1>
                    <p className="text-sm text-foreground-muted">Add videos to your AI content library</p>
                  </div>
                </div>
                
                {recentUploads.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{recentUploads.length} recent uploads</Badge>
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

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <div className="text-2xl">🎬</div>
                  </div>
                  <div>
                    <CardTitle>Upload Video</CardTitle>
                    <p className="text-muted-foreground">Drag & drop or click to select • Unlimited size with R2</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FileUpload onUpload={handleUpload} maxSize={500} />
                
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

            {/* Recent Uploads */}
            {recentUploads.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>✅ Recent Uploads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentUploads.map((upload, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                        <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                          <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{upload.name}</p>
                          <p className="text-sm text-muted-foreground">{upload.duration}s • {upload.category}</p>
                        </div>
                        <Link href={`/dashboard/video-editor/${upload.id}`}>
                          <Button size="sm" variant="outline">
                            ✂️ Segment
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>🚀 What's Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/content" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    📁 View All Videos
                  </Button>
                </Link>
                <Link href="/dashboard/create-images" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    🎨 Create AI Images
                  </Button>
                </Link>
                <Link href="/dashboard/persona-wizard" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    🧙‍♂️ Create AI Persona
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Upload Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Upload Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Alert>
                  <AlertDescription>
                    <strong>📱 iPhone Videos:</strong> All formats supported automatically
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <p><strong>✅ Best Practices:</strong></p>
                  <ul className="space-y-1 text-muted-foreground ml-4">
                    <li>• Upload high-quality source videos</li>
                    <li>• Use descriptive names for easy finding</li>
                    <li>• Add relevant categories and tags</li>
                    <li>• Create segments after uploading</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p><strong>🎯 After Upload:</strong></p>
                  <ul className="space-y-1 text-muted-foreground ml-4">
                    <li>• Create quality-rated segments</li>
                    <li>• Train AI personas with your content</li>
                    <li>• Generate new content using AI</li>
                    <li>• Post to social media via Succulent</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* R2 Storage Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">☁️ R2 Storage</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Size Limit:</span>
                    <Badge variant="outline">Unlimited</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Storage Cost:</span>
                    <Badge variant="outline">~$0.015/GB/month</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Upload Speed:</span>
                    <Badge variant="outline">Direct to R2</Badge>
                  </div>
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