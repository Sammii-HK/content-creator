'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Video {
  id: string;
  name: string;
  segmentCount?: number;
}

export default function AIVideoStudio() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeTab, setActiveTab] = useState('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Product demo specific
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [keyFeatures, setKeyFeatures] = useState<string[]>(['']);

  // Hybrid video specific
  const [selectedVideo, setSelectedVideo] = useState('');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/broll');
      if (response.ok) {
        const data = await response.json();
        
        // Get videos with segment counts
        const videosWithSegments = await Promise.all(
          (data.broll || []).map(async (video: any) => {
            try {
              const segResponse = await fetch(`/api/broll/${video.id}/segments`);
              const segData = await segResponse.json();
              return {
                ...video,
                segmentCount: segData.segments?.length || 0
              };
            } catch {
              return { ...video, segmentCount: 0 };
            }
          })
        );
        
        setVideos(videosWithSegments);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    }
  };

  const generateAIVideo = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    setResult(null);

    try {
      const requestData: any = {
        prompt,
        duration,
        style: activeTab
      };

      // Add style-specific data
      if (activeTab === 'product-demo') {
        requestData.productName = productName;
        requestData.productDescription = productDescription;
        requestData.keyFeatures = keyFeatures.filter(f => f.trim());
      } else if (activeTab === 'hybrid') {
        requestData.videoId = selectedVideo;
      }

      const response = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setGenerating(false);
    }
  };

  const addFeature = () => {
    setKeyFeatures([...keyFeatures, '']);
  };

  const updateFeature = (index: number, value: string) => {
    const updated = [...keyFeatures];
    updated[index] = value;
    setKeyFeatures(updated);
  };

  const tabs = [
    { id: 'text-to-video', name: '🎬 Text to Video', desc: 'Generate videos from descriptions' },
    { id: 'avatar', name: '👤 AI Avatar', desc: 'Create talking avatar videos' },
    { id: 'product-demo', name: '📦 Product Demo', desc: 'Showcase products with AI' },
    { id: 'hybrid', name: '🔀 Hybrid', desc: 'Real footage + AI elements' }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost">← Dashboard</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">🤖 AI Video Studio</h1>
            <p className="text-muted-foreground">Generate videos with AI • Use your likeness • Create product demos</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generation Form */}
          <Card>
            <CardHeader>
              <CardTitle>{tabs.find(t => t.id === activeTab)?.name}</CardTitle>
              <p className="text-muted-foreground">
                {tabs.find(t => t.id === activeTab)?.desc}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Common Fields */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {activeTab === 'product-demo' ? 'Product Concept' : 'Video Description'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={getPlaceholder(activeTab)}
                  className="w-full h-24 p-3 border rounded-lg resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Duration (seconds)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value={15}>15s (TikTok/Instagram)</option>
                  <option value={30}>30s (Instagram Reel)</option>
                  <option value={60}>60s (YouTube Short)</option>
                </select>
              </div>

              {/* Style-Specific Fields */}
              {activeTab === 'product-demo' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Product Name</label>
                    <input
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g., Wireless Earbuds Pro"
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Product Description</label>
                    <textarea
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      placeholder="Describe your product..."
                      className="w-full h-16 p-2 border rounded-lg resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Key Features</label>
                    {keyFeatures.map((feature, index) => (
                      <input
                        key={index}
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder={`Feature ${index + 1}`}
                        className="w-full p-2 border rounded-lg mb-2"
                      />
                    ))}
                    <Button onClick={addFeature} variant="outline" size="sm">
                      + Add Feature
                    </Button>
                  </div>
                </>
              )}

              {activeTab === 'hybrid' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Base Video (with segments)</label>
                  <select
                    value={selectedVideo}
                    onChange={(e) => setSelectedVideo(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select video with segments...</option>
                    {videos
                      .filter(v => v.segmentCount && v.segmentCount > 0)
                      .map((video) => (
                        <option key={video.id} value={video.id}>
                          {video.name} ({video.segmentCount} segments)
                        </option>
                      ))
                    }
                  </select>
                  
                  {videos.filter(v => v.segmentCount && v.segmentCount > 0).length === 0 && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 mb-2">
                        📹 No videos with segments found
                      </p>
                      <Link href="/dashboard/content" className="text-sm text-blue-600 hover:underline">
                        Go create segments first →
                      </Link>
                    </div>
                  )}
                  
                  {selectedVideo && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">
                        ✅ Video selected with {videos.find(v => v.id === selectedVideo)?.segmentCount} segments
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Button 
                onClick={generateAIVideo}
                disabled={generating || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {generating ? '🤖 Generating...' : `✨ Generate ${tabs.find(t => t.id === activeTab)?.name.split(' ')[1]} Video`}
              </Button>

              {/* Cost & Requirements */}
              <div className="bg-muted rounded-lg p-3">
                <div className="text-center mb-2">
                  <Badge variant="secondary">
                    Cost: {getCostEstimate(activeTab, duration)}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {getRequirements(activeTab)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Video Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎭</div>
                  <p className="text-muted-foreground">
                    Select a video type and generate your AI video plan
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Badge variant="default">{result.metadata?.style}</Badge>
                    <Badge variant="outline">{result.metadata?.duration}s</Badge>
                    {result.requirements?.estimatedCost && (
                      <Badge variant="secondary">{result.requirements.estimatedCost}</Badge>
                    )}
                  </div>

                  {/* Video Generation Details */}
                  {result.videoGeneration && (
                    <div className="space-y-3">
                      {result.videoGeneration.scenes && (
                        <div>
                          <h4 className="font-medium mb-2">📋 Scenes</h4>
                          {result.videoGeneration.scenes.map((scene: any, i: number) => (
                            <div key={i} className="text-sm p-2 bg-muted rounded mb-2">
                              <strong>{scene.duration}s:</strong> {scene.description}
                            </div>
                          ))}
                        </div>
                      )}

                      {result.videoGeneration.script && (
                        <div>
                          <h4 className="font-medium mb-2">🎤 Script</h4>
                          <div className="text-sm p-3 bg-muted rounded">
                            {result.videoGeneration.script}
                          </div>
                        </div>
                      )}

                      {result.videoGeneration.plan && (
                        <div>
                          <h4 className="font-medium mb-2">📝 Production Plan</h4>
                          <div className="text-sm p-3 bg-muted rounded whitespace-pre-line">
                            {result.videoGeneration.plan}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Next Steps */}
                  {result.nextSteps && (
                    <div>
                      <h4 className="font-medium mb-2">🚀 Next Steps</h4>
                      <ul className="text-sm space-y-1">
                        {result.nextSteps.map((step: string, i: number) => (
                          <li key={i} className="flex items-center space-x-2">
                            <span className="w-4 h-4 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Button className="w-full" disabled={!result.metadata?.readyForProduction}>
                      {result.metadata?.readyForProduction ? '🎥 Create Video Now' : '⚙️ Set up APIs First'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Video Options Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Card className={`cursor-pointer transition-all ${activeTab === 'text-to-video' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setActiveTab('text-to-video')}>
            <CardContent className="text-center py-6">
              <div className="text-3xl mb-3">🎬</div>
              <h4 className="font-medium mb-1">Text to Video</h4>
              <p className="text-xs text-muted-foreground mb-2">AI generates full videos from descriptions</p>
              <Badge variant="outline" className="text-xs">$0.50-2.00 per video</Badge>
              <p className="text-xs text-muted-foreground mt-1">Runway ML, Pika Labs</p>
            </CardContent>
          </Card>
          
          <Card className={`cursor-pointer transition-all ${activeTab === 'avatar' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setActiveTab('avatar')}>
            <CardContent className="text-center py-6">
              <div className="text-3xl mb-3">👤</div>
              <h4 className="font-medium mb-1">AI Avatar</h4>
              <p className="text-xs text-muted-foreground mb-2">Videos of YOU talking (upload your photo)</p>
              <Badge variant="outline" className="text-xs">$0.20-1.00 per video</Badge>
              <p className="text-xs text-muted-foreground mt-1">HeyGen, Synthesia</p>
            </CardContent>
          </Card>
          
          <Card className={`cursor-pointer transition-all ${activeTab === 'product-demo' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setActiveTab('product-demo')}>
            <CardContent className="text-center py-6">
              <div className="text-3xl mb-3">📦</div>
              <h4 className="font-medium mb-1">Product Demo</h4>
              <p className="text-xs text-muted-foreground mb-2">Products on virtual desks (like banana!)</p>
              <Badge variant="outline" className="text-xs">$0.10-0.50 per video</Badge>
              <p className="text-xs text-muted-foreground mt-1">AI + 3D placement</p>
            </CardContent>
          </Card>
          
          <Card className={`cursor-pointer transition-all ${activeTab === 'hybrid' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setActiveTab('hybrid')}>
            <CardContent className="text-center py-6">
              <div className="text-3xl mb-3">🔀</div>
              <h4 className="font-medium mb-1">Hybrid</h4>
              <p className="text-xs text-muted-foreground mb-2">Your real footage + AI elements</p>
              <Badge variant="outline" className="text-xs">$0.05-0.20 per video</Badge>
              <p className="text-xs text-muted-foreground mt-1">Cheapest option!</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Examples */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>💡 What You Can Create</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2">🎬 With Your Videos:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Take your morning routine footage + add AI voiceover</li>
                  <li>• Use your talking clips + add AI text overlays</li>
                  <li>• Combine multiple segments with AI transitions</li>
                  <li>• Add AI-generated backgrounds to your clips</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">🤖 Pure AI Generation:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Create avatar videos using your photo</li>
                  <li>• Generate product demos with virtual environments</li>
                  <li>• Make talking head videos without filming</li>
                  <li>• Create animated explainer videos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getPlaceholder(style: string): string {
  switch (style) {
    case 'text-to-video':
      return 'Describe the video you want to create...\n\nExample:\nCreate a motivational video about morning routines. Show someone waking up energetically, making coffee, journaling, and starting their day with purpose. Use warm, inspiring visuals with uplifting music.';
    case 'avatar':
      return 'Write what you want your AI avatar to say...\n\nExample:\nHi everyone! Today I want to share my top 3 productivity tips that completely changed my workflow. These simple changes helped me get 2x more done in half the time.';
    case 'product-demo':
      return 'Describe how you want to showcase your product...\n\nExample:\nShow the wireless earbuds on a clean desk setup. Demonstrate the noise cancellation feature, show the charging case, and highlight the premium build quality.';
    case 'hybrid':
      return 'Describe what AI elements to add to your real footage...\n\nExample:\nTake my existing morning routine footage and add motivational text overlays, smooth transitions, and an inspiring voiceover about productivity habits.';
    default:
      return 'Describe your video concept...';
  }
}

function getCostEstimate(style: string, duration: number): string {
  switch (style) {
    case 'text-to-video': return `$0.50-2.00`;
    case 'avatar': return `$0.20-1.00`;
    case 'product-demo': return `$0.10-0.50`;
    case 'hybrid': return `$0.05-0.20`;
    default: return '$0.10-0.50';
  }
}

function getRequirements(style: string): string {
  switch (style) {
    case 'text-to-video': 
      return 'Requires: Runway ML or Pika Labs API • Generates completely new video content';
    case 'avatar': 
      return 'Requires: HeyGen or Synthesia API • Upload your photo to create AI version of you';
    case 'product-demo': 
      return 'Requires: Product images • AI creates virtual environments and placement';
    case 'hybrid': 
      return 'Uses YOUR existing video segments + AI voiceover/text • Cheapest option!';
    default: 
      return 'AI-powered video generation';
  }
}
