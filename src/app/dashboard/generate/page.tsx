'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import VideoGenerator from '@/components/VideoGenerator';
import { ArrowLeftIcon, SparklesIcon, PlayIcon } from '@heroicons/react/24/outline';

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

export default function GenerateVideo() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [brollVideos, setBrollVideos] = useState<BrollVideo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedBroll, setSelectedBroll] = useState<BrollVideo | null>(null);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    theme: 'productivity tips for creators',
    tone: 'energetic' as 'energetic' | 'calm' | 'mysterious' | 'educational' | 'funny' | 'inspiring',
    duration: 10
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, brollRes] = await Promise.all([
        fetch('/api/templates'),
        fetch('/api/broll')
      ]);

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);
        if (templatesData.templates?.length > 0) {
          setSelectedTemplate(templatesData.templates[0]);
        }
      }

      if (brollRes.ok) {
        const brollData = await brollRes.json();
        setBrollVideos(brollData.broll || []);
        if (brollData.broll?.length > 0) {
          setSelectedBroll(brollData.broll[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch('/api/generate/text-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: formData.theme,
          tone: formData.tone,
          duration: formData.duration,
          templateId: selectedTemplate.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedContent(result.results[0]?.content);
      } else {
        alert('Content generation failed');
      }
    } catch (error) {
      console.error('Content generation failed:', error);
      alert('Content generation failed');
    }
  };

  const handleVideoComplete = async (videoBlob: Blob) => {
    // Upload the generated video
    try {
      const formData = new FormData();
      formData.append('video', videoBlob, `generated-${Date.now()}.webm`);
      
      // You could save this to your database or storage here
      console.log('Video generated successfully:', videoBlob);
      
    } catch (error) {
      console.error('Failed to save generated video:', error);
    }
  };

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
              href="/dashboard" 
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors mr-6"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 rounded-lg p-2">
                <SparklesIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Generate Video</h1>
                <p className="text-gray-600">AI content + client-side video generation</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Content Generation */}
          <div className="space-y-6">
            {/* Content Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Generate Content</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <input
                    type="text"
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., morning productivity routine"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tone
                    </label>
                    <select
                      value={formData.tone}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="energetic">Energetic</option>
                      <option value="calm">Calm</option>
                      <option value="educational">Educational</option>
                      <option value="funny">Funny</option>
                      <option value="inspiring">Inspiring</option>
                      <option value="mysterious">Mysterious</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="30"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  onClick={generateContent}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Generate AI Content
                </button>
              </div>
            </div>

            {/* Generated Content */}
            {generatedContent && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Generated Content</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Hook:</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">{generatedContent.hook}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Content:</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">{generatedContent.content}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Hashtags:</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">
                      {generatedContent.hashtags?.map((tag: string) => `#${tag}`).join(' ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Template & B-roll Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Select Assets</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template
                  </label>
                  <select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => setSelectedTemplate(templates.find(t => t.id === e.target.value) || null)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.performance ? `${Math.round(template.performance)}%` : 'New'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    B-roll Video
                  </label>
                  <select
                    value={selectedBroll?.id || ''}
                    onChange={(e) => setSelectedBroll(brollVideos.find(b => b.id === e.target.value) || null)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {brollVideos.map(broll => (
                      <option key={broll.id} value={broll.id}>
                        {broll.name} ({broll.duration}s • {broll.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Video Generation */}
          <div>
            {selectedTemplate && selectedBroll && generatedContent ? (
              <VideoGenerator
                videoUrl={selectedBroll.fileUrl}
                template={selectedTemplate.json}
                content={{
                  hook: generatedContent.hook,
                  content: generatedContent.content,
                  question: generatedContent.hook,
                  answer: generatedContent.content,
                  title: generatedContent.hook,
                  items: generatedContent.content
                }}
                onComplete={handleVideoComplete}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <PlayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate</h3>
                <p className="text-gray-600 mb-4">
                  Complete steps 1-3 to start video generation
                </p>
                <div className="text-sm text-gray-500">
                  <p>✅ Template: {selectedTemplate?.name || 'Not selected'}</p>
                  <p>✅ B-roll: {selectedBroll?.name || 'Not selected'}</p>
                  <p>✅ Content: {generatedContent ? 'Generated' : 'Not generated'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
