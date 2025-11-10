'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Wand2, 
  DollarSign, 
  Clock, 
  Check,
  ArrowRight,
  Upload,
  Zap,
  BarChart3
} from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: 'model' | 'product' | 'environment';
  imageUrl: string;
  tags: string[];
  category: string;
}

interface GeneratedImage {
  id: string;
  imageUrl: string;
  prompt: string;
  provider: string;
  cost: number;
  createdAt: string;
}

export default function CreateImages() {
  const [selectedAssets, setSelectedAssets] = useState<{
    model?: string;
    product?: string;
    environment?: string;
  }>({});
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('lifestyle');
  const [quality, setQuality] = useState('standard');
  const [generating, setGenerating] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0.12);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  useEffect(() => {
    // Update cost estimation
    const baseCost = quality === 'budget' ? 0.05 : quality === 'standard' ? 0.12 : 0.25;
    const assetCount = Object.values(selectedAssets).filter(Boolean).length;
    const multiplier = 1 + (assetCount * 0.1);
    setEstimatedCost(baseCost * multiplier);
  }, [selectedAssets, quality]);

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          quality,
          assets: selectedAssets
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedImages([data.image, ...generatedImages]);
        setPrompt('');
      } else {
        const error = await response.json();
        alert(`❌ Failed: ${error.error}`);
      }
    } catch (error) {
      alert('❌ Network error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  ← Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Image Studio
                </h1>
                <p className="text-gray-500">Create professional images with AI</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Estimated Cost</p>
                <p className="text-2xl font-bold text-green-600">${estimatedCost.toFixed(2)}</p>
              </div>
              
              <Button 
                onClick={generateImage}
                disabled={generating || !prompt.trim()}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
              >
                {generating ? (
                  <>
                    <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="create" className="space-y-8">
          <TabsList className="bg-white/60 border border-gray-200 p-1 shadow-sm">
            <TabsTrigger value="create" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              ✨ Create
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              🖼️ Gallery ({generatedImages.length})
            </TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Creation Area */}
              <div className="lg:col-span-3 space-y-8">
                {/* Prompt Input */}
                <Card className="bg-white/70 backdrop-blur-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-gray-900">
                      <Wand2 className="h-5 w-5" />
                      <span>Describe Your Image</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the image you want to create...

Examples:
• Professional product photography of ceramic mug on wooden table
• Model wearing casual sweater in modern living room
• Artistic flat lay of skincare products with plants
• Lifestyle shot of laptop and coffee in cozy cafe"
                      className="h-32 bg-white/80 border-gray-200 focus:bg-white resize-none"
                    />
                  </CardContent>
                </Card>

                {/* Quick Templates */}
                <Card className="bg-white/70 backdrop-blur-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">⚡ Quick Templates</CardTitle>
                    <p className="text-gray-500 text-sm">One-click prompts for common scenarios</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 bg-white/60 border-gray-200 hover:bg-white hover:shadow-md text-left"
                        onClick={() => setPrompt('Professional product photography with model using product naturally in lifestyle setting')}
                      >
                        <div>
                          <div className="font-medium text-gray-900">📸 Lifestyle Product</div>
                          <div className="text-xs text-gray-500 mt-1">Model + Product + Environment</div>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 bg-white/60 border-gray-200 hover:bg-white hover:shadow-md text-left"
                        onClick={() => setPrompt('Clean product showcase with artistic wall art background, gallery aesthetic')}
                      >
                        <div>
                          <div className="font-medium text-gray-900">🖼️ Product + Wall Art</div>
                          <div className="text-xs text-gray-500 mt-1">Perfect for Etsy listings</div>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 bg-white/60 border-gray-200 hover:bg-white hover:shadow-md text-left"
                        onClick={() => setPrompt('Professional model portrait for avatar and profile content, clean background')}
                      >
                        <div>
                          <div className="font-medium text-gray-900">👤 Model Portrait</div>
                          <div className="text-xs text-gray-500 mt-1">Avatar & profile content</div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Asset Selection Preview */}
                <Card className="bg-white/70 backdrop-blur-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">🎨 Selected Assets</CardTitle>
                    <p className="text-gray-500 text-sm">Choose models, products, and environments</p>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(selectedAssets).length === 0 ? (
                      <div className="text-center py-8">
                        <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No assets selected</p>
                        <Link href="/dashboard/asset-banks">
                          <Button variant="outline" className="border-gray-300">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Assets
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Asset selection will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Generation Panel */}
              <div className="space-y-6">
                {/* Settings */}
                <Card className="bg-white/70 backdrop-blur-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">⚙️ Generation Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-gray-700">Style</Label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger className="bg-white/80 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lifestyle">Lifestyle</SelectItem>
                          <SelectItem value="clean">Clean/Minimal</SelectItem>
                          <SelectItem value="artistic">Artistic</SelectItem>
                          <SelectItem value="luxury">Luxury</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-700">Quality & Cost</Label>
                      <Select value={quality} onValueChange={setQuality}>
                        <SelectTrigger className="bg-white/80 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="budget">
                            <div className="flex items-center justify-between w-full">
                              <span>Budget</span>
                              <Badge variant="outline" className="ml-2">$0.05</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="standard">
                            <div className="flex items-center justify-between w-full">
                              <span>Standard</span>
                              <Badge variant="outline" className="ml-2">$0.12</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="premium">
                            <div className="flex items-center justify-between w-full">
                              <span>Premium</span>
                              <Badge variant="outline" className="ml-2">$0.25</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Breakdown */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-green-900">
                      <DollarSign className="h-5 w-5" />
                      <span>Cost Estimate</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-green-800">Base Cost ({quality})</span>
                        <Badge className="bg-green-100 text-green-800">
                          ${quality === 'budget' ? '0.05' : quality === 'standard' ? '0.12' : '0.25'}
                        </Badge>
                      </div>
                      {Object.keys(selectedAssets).length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-green-800">Asset Processing</span>
                          <Badge className="bg-green-100 text-green-800">
                            +$0.02 per asset
                          </Badge>
                        </div>
                      )}
                      <div className="border-t border-green-200 pt-3 flex justify-between items-center">
                        <span className="font-semibold text-green-900">Total Estimate</span>
                        <Badge className="bg-green-200 text-green-900 text-lg px-3 py-1">
                          ${estimatedCost.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Provider Info */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-blue-900">
                      <Zap className="h-5 w-5" />
                      <span>AI Provider</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-800">Auto-Selected</span>
                        <Badge className="bg-blue-100 text-blue-800">Best for quality + cost</Badge>
                      </div>
                      <div className="space-y-1 text-blue-700">
                        <p>• Nano Banana: Product placement</p>
                        <p>• Replicate: Artistic content</p>
                        <p>• Stability AI: Volume generation</p>
                        <p>• DALL-E 3: Precise prompts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            {generatedImages.length === 0 ? (
              <Card className="bg-white/60 border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <div className="text-8xl mb-6 opacity-20">🎨</div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">Your AI Gallery</h2>
                  <p className="text-gray-500 text-center max-w-md mb-8">
                    Generated images will appear here. Start creating to build your AI content library.
                  </p>
                  <Button 
                    onClick={() => {
                      const createTab = document.querySelector('[value="create"]') as HTMLElement;
                      createTab?.click();
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Your First Image
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {generatedImages.map((image) => (
                  <Card key={image.id} className="group bg-white/70 border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-200">
                    <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                      <img
                        src={image.imageUrl}
                        alt="Generated image"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{image.prompt}</p>
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="bg-gray-50 text-gray-700">
                          {image.provider}
                        </Badge>
                        <Badge className="bg-green-100 text-green-800">
                          ${image.cost.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full border-gray-300">
                          📱 Use for Social Media
                        </Button>
                        <Button variant="outline" size="sm" className="w-full border-gray-300">
                          💾 Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/asset-banks">
            <Card className="group cursor-pointer bg-white/60 border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-300">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-4 rounded-2xl shadow-lg">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Asset Banks</h3>
                  <p className="text-gray-500 text-sm">Upload models, products, environments</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 ml-auto" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/ai-usage">
            <Card className="group cursor-pointer bg-white/60 border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-300">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-gradient-to-br from-green-500 to-blue-500 p-4 rounded-2xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Usage & Costs</h3>
                  <p className="text-gray-500 text-sm">Monitor AI spending</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 ml-auto" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/integrations">
            <Card className="group cursor-pointer bg-white/60 border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-300">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Integrations</h3>
                  <p className="text-gray-500 text-sm">Manage AI providers</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 ml-auto" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}