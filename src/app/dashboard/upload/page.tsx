'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  Upload,
  Video,
  Tag,
  Sparkles,
  Lightbulb,
  Cloud,
  Zap,
  Scissors,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SidebarProvider, Sidebar, MainContent, MobileMenuButton } from '@/components/ui/sidebar';
import PersonaSwitcher from '@/components/persona-switcher';

export default function UploadPage() {
  const [recentUploads, setRecentUploads] = useState<
    Array<{
      id: string;
      name: string;
      duration: number;
      category: string;
    }>
  >([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, 'uploading' | 'success' | 'error'>
  >({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [completedCount, setCompletedCount] = useState(0);
  const [totalUploading, setTotalUploading] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastProcessedFiles = useRef<Set<string>>(new Set());
  const [videoMetadata, setVideoMetadata] = useState<
    Record<
      string,
      {
        name: string;
        description: string;
        category: string;
        tags: string[];
      }
    >
  >({});

  const removeFile = useCallback((fileName: string) => {
    setSelectedFiles((prev) => {
      const filtered = prev.filter((f) => f.name !== fileName);
      // Also clean up metadata for removed files
      setVideoMetadata((prevMeta) => {
        const next = { ...prevMeta };
        Object.keys(next).forEach((key) => {
          if (key.startsWith(fileName)) {
            delete next[key];
          }
        });
        return next;
      });
      return filtered;
    });
  }, []);

  const handleUpload = useCallback(
    async (file: File, fileName: string, retryCount = 0) => {
      const fileId = `${file.name}-${file.size}-${file.lastModified}`;
      const maxRetries = 3;
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s

      // Skip if already uploading
      if (uploadingFiles.has(fileId) && retryCount === 0) {
        console.log(`Skipping ${fileName} - already uploading`);
        return;
      }

      setUploadingFiles((prev) => new Set(prev).add(fileId));
      console.log(
        `Starting upload for ${fileName} (${(file.size / 1024 / 1024).toFixed(2)} MB)${retryCount > 0 ? ` - Retry ${retryCount}/${maxRetries}` : ''}`
      );

      try {
        // Get active persona from localStorage
        const activePersonaId =
          typeof window !== 'undefined' ? localStorage.getItem('activePersona') : null;

        if (!activePersonaId) {
          throw new Error(
            'Please select a persona before uploading videos. Use the persona switcher at the top of the page.'
          );
        }

        const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
        const metadata = videoMetadata[fileKey] || {
          name: file.name.replace(/\.[^/.]+$/, ''),
          description: '',
          category: 'general',
          tags: [],
        };

        console.log(`Uploading ${fileName} to R2...`);
        const { ClientR2Uploader } = await import('@/lib/r2-storage');
        const uploader = new ClientR2Uploader();

        const uploadResult = await uploader.uploadFile(file);
        console.log(`R2 upload successful for ${fileName}:`, uploadResult.url);

        // Save to database
        const fileSizeMB = file.size / (1024 * 1024);
        const estimatedDuration = Math.max(5, Math.min(300, Math.round(fileSizeMB * 8)));

        console.log(`Saving ${fileName} to database...`);
        const dbResponse = await fetch('/api/broll/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for auth
          body: JSON.stringify({
            name: metadata.name || file.name.replace(/\.[^/.]+$/, ''),
            description: metadata.description || `Video: ${file.name}`,
            fileUrl: uploadResult.url,
            duration: estimatedDuration,
            category: metadata.category || 'general',
            tags: metadata.tags || [],
            personaId: activePersonaId,
          }),
        });

        if (!dbResponse.ok) {
          const errorText = await dbResponse.text();
          console.error(`Database save failed for ${fileName}:`, dbResponse.status, errorText);
          throw new Error(`Database save failed: ${dbResponse.status} ${errorText}`);
        }

        const result = await dbResponse.json();
        console.log(`Successfully uploaded ${fileName}`);
        setRecentUploads((prev) => [result.broll, ...prev].slice(0, 5));

        // Remove file from selection after successful upload (for auto-upload)
        removeFile(file.name);

        return result;
      } catch (error) {
        console.error(`Upload failed for ${fileName}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Check if it's a network error or timeout (common when device locks)
        const isNetworkError =
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('aborted') ||
          !navigator.onLine;

        // Retry on network errors if we haven't exceeded max retries
        if (isNetworkError && retryCount < maxRetries) {
          console.log(`Network error detected, retrying ${fileName} in ${retryDelay}ms...`);

          // Remove from uploading set temporarily
          setUploadingFiles((prev) => {
            const next = new Set(prev);
            next.delete(fileId);
            return next;
          });

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, retryDelay));

          // Retry the upload
          return handleUpload(file, fileName, retryCount + 1);
        }

        console.error('Full error details:', {
          fileName,
          fileSize: file.size,
          error: errorMessage,
          retryCount,
          isNetworkError,
          stack: error instanceof Error ? error.stack : undefined,
        });

        throw new Error(
          `${fileName}: ${errorMessage}${isNetworkError ? ' (Network interrupted - try again when device is unlocked)' : ''}`
        );
      } finally {
        // Only remove from uploading set if not retrying
        if (retryCount === 0 || retryCount >= maxRetries) {
          setUploadingFiles((prev) => {
            const next = new Set(prev);
            next.delete(fileId);
            return next;
          });
        }
      }
    },
    [videoMetadata, uploadingFiles, removeFile]
  );

  const handleFileSelect = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0) {
        return;
      }

      const videoFiles = files.filter((file) => {
        // Accept video files or files without a type (iOS sometimes doesn't set type)
        if (file.type && file.type.startsWith('image/')) {
          return false;
        }
        return true;
      });

      if (videoFiles.length === 0) {
        return;
      }

      // Add new files to selection and auto-upload them
      const newFilesToUpload: File[] = [];

      setSelectedFiles((prev) => {
        const newFiles = [...prev];

        videoFiles.forEach((file) => {
          const exists = newFiles.find(
            (f) =>
              f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
          );

          if (!exists) {
            newFiles.push(file);
            newFilesToUpload.push(file);
            const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
            setVideoMetadata((prevMeta) => ({
              ...prevMeta,
              [fileKey]: {
                name: file.name.replace(/\.[^/.]+$/, ''),
                description: '',
                category: 'general',
                tags: [],
              },
            }));
          }
        });

        return newFiles;
      });

      // Auto-upload new files in parallel
      if (newFilesToUpload.length > 0) {
        console.log(`Auto-uploading ${newFilesToUpload.length} video(s) in parallel...`);

        const total = newFilesToUpload.length;
        setTotalUploading(total);
        setCompletedCount(0);
        setUploadProgress(0);

        // Initialize upload status for all files
        const initialStatus: Record<string, 'uploading' | 'success' | 'error'> = {};
        newFilesToUpload.forEach((file) => {
          const fileId = `${file.name}-${file.size}-${file.lastModified}`;
          initialStatus[fileId] = 'uploading';
        });
        setUploadStatus((prev) => ({ ...prev, ...initialStatus }));

        // Add files to uploadingFiles Set immediately for UI feedback
        newFilesToUpload.forEach((file) => {
          const fileId = `${file.name}-${file.size}-${file.lastModified}`;
          setUploadingFiles((prev) => new Set(prev).add(fileId));
        });

        // Upload all files in parallel using Promise.allSettled
        const uploadPromises = newFilesToUpload.map(async (file) => {
          const fileId = `${file.name}-${file.size}-${file.lastModified}`;
          try {
            await handleUpload(file, file.name);
            setUploadStatus((prev) => ({ ...prev, [fileId]: 'success' }));
            setCompletedCount((prev) => {
              const newCount = prev + 1;
              setUploadProgress(Math.round((newCount / total) * 100));
              return newCount;
            });
            return { success: true, fileId, fileName: file.name };
          } catch (error) {
            console.error(`Auto-upload failed for ${file.name}:`, error);
            setUploadStatus((prev) => ({ ...prev, [fileId]: 'error' }));
            setCompletedCount((prev) => {
              const newCount = prev + 1;
              setUploadProgress(Math.round((newCount / total) * 100));
              return newCount;
            });
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setUploadErrors((prev) => ({ ...prev, [fileId]: errorMessage }));
            return { success: false, fileId, fileName: file.name, error };
          }
        });

        // Wait for all uploads to complete
        Promise.allSettled(uploadPromises).then((results) => {
          const successful = results.filter(
            (r) => r.status === 'fulfilled' && r.value.success
          ).length;
          const failed = total - successful;

          if (failed > 0) {
            console.warn(`${failed} upload(s) failed out of ${total}`);
          }

          // Reset after a delay
          setTimeout(() => {
            setTotalUploading(0);
            setCompletedCount(0);
            setUploadProgress(0);
          }, 2000);
        });
      }
    },
    [handleUpload]
  );

  const retryUpload = useCallback(
    async (file: File) => {
      const fileId = `${file.name}-${file.size}-${file.lastModified}`;

      // Reset error status and mark as uploading immediately
      setUploadStatus((prev) => ({ ...prev, [fileId]: 'uploading' }));
      setUploadErrors((prev) => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
      setUploadingFiles((prev) => new Set(prev).add(fileId));

      // Update total uploading count
      setTotalUploading((prev) => prev + 1);

      try {
        await handleUpload(file, file.name);
        setUploadStatus((prev) => ({ ...prev, [fileId]: 'success' }));
        setCompletedCount((prev) => prev + 1);
      } catch (error) {
        console.error(`Retry upload failed for ${file.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setUploadStatus((prev) => ({ ...prev, [fileId]: 'error' }));
        setUploadErrors((prev) => ({ ...prev, [fileId]: errorMessage }));
      } finally {
        setTotalUploading((prev) => Math.max(0, prev - 1));
      }
    },
    [handleUpload]
  );

  // Handle page visibility changes (device lock/unlock)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible - checking for failed uploads to retry...');
        // When page becomes visible again, check for any failed uploads and retry them
        const failedFiles = selectedFiles.filter((file) => {
          const fileId = `${file.name}-${file.size}-${file.lastModified}`;
          return (
            uploadStatus[fileId] === 'error' &&
            uploadErrors[fileId]?.includes('Network interrupted')
          );
        });

        if (failedFiles.length > 0) {
          console.log(
            `Found ${failedFiles.length} upload(s) that failed due to network interruption, retrying...`
          );
          failedFiles.forEach((file) => {
            const fileId = `${file.name}-${file.size}-${file.lastModified}`;
            // Clear error status and retry
            setUploadStatus((prev) => ({ ...prev, [fileId]: 'uploading' }));
            setUploadErrors((prev) => {
              const next = { ...prev };
              delete next[fileId];
              return next;
            });
            handleUpload(file, file.name).catch(console.error);
          });
        }
      } else {
        console.log('Page became hidden - uploads will continue in background');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedFiles, uploadStatus, uploadErrors, handleUpload]);

  // Check for files periodically when input might have been used (iOS Photos picker workaround)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (
        fileInputRef.current &&
        fileInputRef.current.files &&
        fileInputRef.current.files.length > 0
      ) {
        const files = Array.from(fileInputRef.current.files);
        // Create a signature for these files to avoid reprocessing
        const fileSignature = files.map((f) => `${f.name}-${f.size}-${f.lastModified}`).join('|');

        // Only process if we haven't seen these exact files before
        if (!lastProcessedFiles.current.has(fileSignature) && files.length > 0) {
          lastProcessedFiles.current.add(fileSignature);
          handleFileSelect(files).catch(console.error);
          // Clear after processing
          setTimeout(() => {
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
              lastProcessedFiles.current.delete(fileSignature);
            }
          }, 1000);
        }
      }
    }, 300);

    return () => clearInterval(checkInterval);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files);
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
                    <p className="text-sm text-foreground-muted">
                      Add videos to your AI content library
                    </p>
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
              {/* Desktop: Side-by-side layout */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left: Compact Upload Box */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Upload Video
                      </CardTitle>
                      <CardDescription>Drag & drop or click to select</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Compact drag-drop area */}
                      <div className="relative">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={(e) => {
                            const input = e.target as HTMLInputElement;
                            if (!input || !input.files) {
                              return;
                            }

                            const fileList = input.files;
                            const files = Array.from(fileList);

                            // Handle iOS Photos picker selection
                            if (files.length > 0) {
                              handleFileSelect(files);
                            }

                            // Reset after processing to allow selecting more files
                            setTimeout(() => {
                              if (input) {
                                input.value = '';
                              }
                            }, 200);
                          }}
                          className="hidden"
                          id="file-upload-input"
                        />
                        <label
                          htmlFor="file-upload-input"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg transition-all cursor-pointer group ${
                            isDragOver
                              ? 'border-primary bg-primary/5 scale-[1.02]'
                              : 'border-border bg-background-secondary/50 hover:border-primary hover:bg-background-secondary'
                          }`}
                        >
                          <Upload className="h-12 w-12 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
                          <p className="text-sm font-medium text-foreground mb-1">
                            Drop videos here or click to browse
                          </p>
                          <p className="text-xs text-muted-foreground text-center px-4">
                            Tap to select videos • Videos upload automatically • Tap again to add
                            more
                          </p>
                        </label>

                        {selectedFiles.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-foreground">
                                {selectedFiles.length} video{selectedFiles.length !== 1 ? 's' : ''}{' '}
                                {uploadingFiles.size > 0 ? 'uploading' : 'selected'}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedFiles([]);
                                  setVideoMetadata({});
                                }}
                                disabled={uploadingFiles.size > 0}
                              >
                                Clear All
                              </Button>
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-2">
                              {selectedFiles.map((file, index) => {
                                const fileId = `${file.name}-${file.size}-${file.lastModified}`;
                                const isUploading = uploadingFiles.has(fileId);
                                // Show uploading state if in uploadingFiles Set OR if status is explicitly 'uploading'
                                const status =
                                  uploadStatus[fileId] || (isUploading ? 'uploading' : undefined);
                                const showUploading = isUploading || status === 'uploading';

                                return (
                                  <div
                                    key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                                    className={`p-3 rounded-lg border transition-colors ${
                                      status === 'success'
                                        ? 'bg-success/10 border-success/30'
                                        : status === 'error'
                                          ? 'bg-destructive/10 border-destructive/30'
                                          : showUploading
                                            ? 'bg-primary/10 border-primary/30'
                                            : 'bg-background-secondary border-border'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {status === 'success' ? (
                                        <CheckCircle className="h-5 w-5 text-success" />
                                      ) : status === 'error' ? (
                                        <X className="h-5 w-5 text-destructive" />
                                      ) : showUploading ? (
                                        <div className="relative h-5 w-5">
                                          <Video className="h-5 w-5 text-primary animate-pulse" />
                                          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                        </div>
                                      ) : (
                                        <Video className="h-5 w-5 text-muted-foreground" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                                          {status === 'success' && ' • Uploaded'}
                                          {status === 'error' && ' • Failed'}
                                          {showUploading && ' • Uploading...'}
                                        </p>
                                        {status === 'error' && uploadErrors[fileId] && (
                                          <p
                                            className="text-xs text-destructive mt-1 truncate"
                                            title={uploadErrors[fileId]}
                                          >
                                            {uploadErrors[fileId]}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {status === 'error' && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => retryUpload(file)}
                                            className="text-primary hover:text-primary"
                                            disabled={isUploading}
                                          >
                                            <Upload className="h-3 w-3 mr-1" />
                                            Retry
                                          </Button>
                                        )}
                                        {!showUploading && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeFile(file.name)}
                                            className="text-destructive hover:text-destructive"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Upload Progress - Show when uploading */}
                            {totalUploading > 0 && (
                              <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">
                                    Uploading {completedCount} of {totalUploading} video
                                    {totalUploading !== 1 ? 's' : ''}...
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {uploadProgress}%
                                  </span>
                                </div>
                                <Progress value={uploadProgress} className="h-2" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Info Cards */}
                <div className="space-y-6"></div>
              </div>

              {/* Recent Uploads - Full Width Below */}
              {recentUploads.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      Recent Uploads
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recentUploads.map((upload, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-background-secondary"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                            <CheckCircle className="h-5 w-5 text-success" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">{upload.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {upload.duration}s • {upload.category}
                            </p>
                          </div>
                          <Link href={`/dashboard/video-editor/${upload.id}`}>
                            <Button size="sm" variant="outline">
                              <Scissors className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sidebar - Right Column */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          <p className="text-xs text-muted-foreground">
                            Upload the best quality you have for maximum flexibility
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Tag className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Descriptive names</p>
                          <p className="text-xs text-muted-foreground">
                            Use clear, searchable names to find videos easily
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning/10">
                          <Sparkles className="h-4 w-4 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Add categories</p>
                          <p className="text-xs text-muted-foreground">
                            Organize with categories and tags for better AI training
                          </p>
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
                      <Badge
                        variant="outline"
                        className="bg-success/10 text-success border-success/20"
                      >
                        Unlimited
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background-secondary/50 p-3">
                      <span className="text-sm text-muted-foreground">Storage Cost</span>
                      <Badge variant="outline">~$0.015/GB</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background-secondary/50 p-3">
                      <span className="text-sm text-muted-foreground">Upload Speed</span>
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        Direct to R2
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </MainContent>
      </div>
    </SidebarProvider>
  );
}
