'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import VideoGenerator from '@/components/VideoGenerator';
import { ArrowLeft, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Template {
  id: string;
  name: string;
  json: any;
  performance?: number;
}

interface BrollVideo {
  id: string;
  name: string;
  fileUrl: string;
  category?: string;
  duration: number;
}

// Hardcoded content for testing templates
const getTestContent = (): Record<string, string> => {
  const scriptLines = [
    'First important point about this topic',
    'Second key insight that matters',
    'Third valuable piece of information',
    'Fourth compelling detail to share',
    'Fifth and final takeaway message',
  ];

  return {
    hook: 'This will change everything you know...',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.',
    script: scriptLines.join(' '),
    question: "What if I told you there's a better way?",
    answer:
      'The answer is simpler than you think. It all comes down to understanding the fundamentals and applying them consistently.',
    title: 'Amazing Discovery',
    items: scriptLines.map((line) => `• ${line}`).join('\n'),
    item1: scriptLines[0] || '',
    item2: scriptLines[1] || '',
    item3: scriptLines[2] || '',
    item4: scriptLines[3] || '',
    item5: scriptLines[4] || '',
    caption:
      'Check out this amazing content! Follow for more tips and insights. #content #tips #viral',
    callToAction: 'Try it now!',
    hashtags: '#test #template #content #viral #tips',
  };
};

export default function TestTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [brollVideos, setBrollVideos] = useState<BrollVideo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<BrollVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      // Get active persona from localStorage
      const personaId =
        typeof window !== 'undefined' ? localStorage.getItem('activePersona') : null;

      // Fetch templates
      const templatesUrl = personaId ? `/api/templates?personaId=${personaId}` : '/api/templates';
      const templatesRes = await fetch(templatesUrl, { credentials: 'include' });

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        const fetchedTemplates = templatesData.templates || [];
        setTemplates(fetchedTemplates);

        // Auto-select first template if available
        if (fetchedTemplates.length > 0 && !selectedTemplate) {
          setSelectedTemplate(fetchedTemplates[0]);
        }
      }

      // Fetch B-roll videos
      const brollUrl = personaId ? `/api/broll?personaId=${personaId}` : '/api/broll';
      const brollRes = await fetch(brollUrl, { credentials: 'include' });

      if (brollRes.ok) {
        const brollData = await brollRes.json();
        const realVideos = (brollData.broll || []).filter(
          (v: BrollVideo) =>
            v.fileUrl &&
            !v.fileUrl.includes('/placeholder/') &&
            !v.fileUrl.includes('example.com') &&
            !v.fileUrl.includes('test.mp4')
        );
        setBrollVideos(realVideos);

        // Auto-select first video if available
        if (realVideos.length > 0 && !selectedVideo) {
          setSelectedVideo(realVideos[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testContent = getTestContent();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              href="/dashboard/templates/new"
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors mr-6"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Templates</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 rounded-lg p-2">
                <Play className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Test Templates</h1>
                <p className="text-gray-600">
                  Preview templates with hardcoded content - no AI costs
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls (2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle>1. Select Template</CardTitle>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No templates available</p>
                    <Link href="/dashboard/templates/new">
                      <Button>Create Your First Template</Button>
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => {
                      const template = templates.find((t) => t.id === e.target.value);
                      setSelectedTemplate(template || null);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a template...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.json?.duration || 10}s)
                      </option>
                    ))}
                  </select>
                )}
              </CardContent>
            </Card>

            {/* Video Selection */}
            <Card>
              <CardHeader>
                <CardTitle>2. Select Video</CardTitle>
              </CardHeader>
              <CardContent>
                {brollVideos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No videos available</p>
                    <Link href="/dashboard/upload">
                      <Button>Upload Your First Video</Button>
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedVideo?.id || ''}
                    onChange={(e) => {
                      const video = brollVideos.find((v) => v.id === e.target.value);
                      setSelectedVideo(video || null);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a video...</option>
                    {brollVideos.map((video) => (
                      <option key={video.id} value={video.id}>
                        {video.name} ({video.duration}s)
                      </option>
                    ))}
                  </select>
                )}
              </CardContent>
            </Card>

            {/* Test Content Info */}
            <Card>
              <CardHeader>
                <CardTitle>Test Content (Hardcoded)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <p className="font-semibold text-gray-900">Available variables:</p>
                  <div className="grid grid-cols-2 gap-2 text-gray-600">
                    {Object.entries(testContent).map(([key, value]) => (
                      <div key={key} className="flex items-start">
                        <span className="font-mono text-xs text-indigo-600 mr-2">{`{{${key}}}`}</span>
                        <span className="text-xs truncate" title={value}>
                          {typeof value === 'string'
                            ? value.substring(0, 30) + (value.length > 30 ? '...' : '')
                            : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview (1/3 width on large screens) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {selectedTemplate && selectedVideo ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <VideoGenerator
                      videoUrl={selectedVideo.fileUrl}
                      template={selectedTemplate.json}
                      content={testContent}
                      // No onComplete - preview only
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-16">
                    <Play className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Ready to Test</h3>
                    <p className="text-xs text-gray-600 mb-3">Select template and video</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p className={selectedTemplate ? 'text-green-600' : ''}>
                        {selectedTemplate ? '✅' : '⏳'} Template:{' '}
                        {selectedTemplate?.name || 'Not selected'}
                      </p>
                      <p className={selectedVideo ? 'text-green-600' : ''}>
                        {selectedVideo ? '✅' : '⏳'} Video: {selectedVideo?.name || 'Not selected'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
