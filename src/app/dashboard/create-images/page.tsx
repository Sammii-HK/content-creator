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

interface Asset {
  id: string;
  name: string;
  type: 'model' | 'product' | 'environment';
  imageUrl: string;
  tags: string[];
  category: string;
  style: string;
}

interface GeneratedImage {
  id: string;
  imageUrl: string;
  prompt: string;
  assets: string[];
  provider: string;
  cost: number;
  createdAt: string;
}

export default function CreateImages() {
  const [models, setModels] = useState<Asset[]>([]);
  const [products, setProducts] = useState<Asset[]>([]);
  const [environments, setEnvironments] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<{
    model?: string;
    product?: string;
    environment?: string;
  }>({});
  
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('lifestyle');
  const [quality, setQuality] = useState('standard');
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => {
    fetchAssets();
    fetchGeneratedImages();
  }, []);

  const fetchAssets = async () => {
    try {
      const [modelsRes, productsRes, environmentsRes] = await Promise.all([
        fetch('/api/assets/models'),
        fetch('/api/assets/products'),
        fetch('/api/assets/environments')
      ]);

      if (modelsRes.ok) {
        const data = await modelsRes.json();
        setModels(data.assets || []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.assets || []);
      }
      if (environmentsRes.ok) {
        const data = await environmentsRes.json();
        setEnvironments(data.assets || []);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  const fetchGeneratedImages = async () => {
    try {
      const response = await fetch('/api/generated-images');
      if (response.ok) {
        const data = await response.json();
        setGeneratedImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to fetch generated images:', error);
    }
  };

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
        alert(`Failed: ${error.error}`);
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setGenerating(false);
    }
  };

  const selectAsset = (type: 'model' | 'product' | 'environment', assetId: string) => {
    setSelectedAssets(prev => ({
      ...prev,
      [type]: prev[type] === assetId ? undefined : assetId
    }));
  };

  const getSelectedAsset = (type: 'model' | 'product' | 'environment') => {
    const assetId = selectedAssets[type];
    if (!assetId) return null;
    
    const assetList = type === 'model' ? models : type === 'product' ? products : environments;
    return assetList.find(a => a.id === assetId);
  };

  const estimatedCost = () => {
    const baseCost = quality === 'budget' ? 0.05 : quality === 'standard' ? 0.12 : 0.25;
    const assetCount = Object.values(selectedAssets).filter(Boolean).length;
    const multiplier = 1 + (assetCount * 0.1); // Small increase per asset
    return (baseCost * multiplier).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost">← Dashboard</Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">🎨 AI Image Studio</h1>
                <p className="text-muted-foreground">Create professional images with models, products, and environments</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link href="/dashboard/asset-banks">
                <Button variant="outline">📁 Manage Assets</Button>
              </Link>
              <Badge variant="secondary">
                Cost: ${estimatedCost()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ✨ Create Images
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'gallery'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🖼️ Generated Gallery ({generatedImages.length})
          </button>
        </div>

        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Asset Selection */}
            <div className="lg:col-span-3 space-y-6">
              {/* Models */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">👤 Select Model</CardTitle>
                  <p className="text-muted-foreground text-sm">Choose a person for your image</p>
                </CardHeader>
                <CardContent>
                  {models.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No models uploaded</p>
                      <Link href="/dashboard/asset-banks">
                        <Button variant="outline" size="sm">Upload Models</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {models.map((model) => (
                        <div
                          key={model.id}
                          className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            selectedAssets.model === model.id ? 'border-primary' : 'border-transparent'
                          }`}
                          onClick={() => selectAsset('model', model.id)}
                        >
                          <img
                            src={model.imageUrl}
                            alt={model.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📦 Select Product</CardTitle>
                  <p className="text-muted-foreground text-sm">Choose what to showcase</p>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No products uploaded</p>
                      <Link href="/dashboard/asset-banks">
                        <Button variant="outline" size="sm">Upload Products</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            selectedAssets.product === product.id ? 'border-primary' : 'border-transparent'
                          }`}
                          onClick={() => selectAsset('product', product.id)}
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Environments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🏠 Select Environment</CardTitle>
                  <p className="text-muted-foreground text-sm">Choose background setting</p>
                </CardHeader>
                <CardContent>
                  {environments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No environments uploaded</p>
                      <Link href="/dashboard/asset-banks">
                        <Button variant="outline" size="sm">Upload Environments</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {environments.map((env) => (
                        <div
                          key={env.id}
                          className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            selectedAssets.environment === env.id ? 'border-primary' : 'border-transparent'
                          }`}
                          onClick={() => selectAsset('environment', env.id)}
                        >
                          <img
                            src={env.imageUrl}
                            alt={env.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Generation Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>🤖 Generate Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selected Assets Preview */}
                  <div className="space-y-3">
                    {Object.entries(selectedAssets).map(([type, assetId]) => {
                      if (!assetId) return null;
                      const asset = getSelectedAsset(type as any);
                      if (!asset) return null;
                      
                      return (
                        <div key={type} className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded overflow-hidden">
                            <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{asset.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{type}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <Label htmlFor="prompt">Custom Prompt</Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the image you want to create..."
                      className="h-20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Style</Label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger>
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
                      <Label>Quality</Label>
                      <Select value={quality} onValueChange={setQuality}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="budget">Budget ($0.05)</SelectItem>
                          <SelectItem value="standard">Standard ($0.12)</SelectItem>
                          <SelectItem value="premium">Premium ($0.25)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Estimated Cost</p>
                    <p className="text-lg font-bold text-primary">${estimatedCost()}</p>
                    <p className="text-xs text-muted-foreground">
                      {Object.values(selectedAssets).filter(Boolean).length} assets selected
                    </p>
                  </div>

                  <Button 
                    onClick={generateImage}
                    disabled={generating || !prompt.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {generating ? '🤖 Generating...' : '✨ Generate Image'}
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">⚡ Quick Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-xs"
                      onClick={() => setPrompt('Professional product photography with model using product naturally')}
                    >
                      📸 Lifestyle Product Shot
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-xs"
                      onClick={() => setPrompt('Clean product showcase with artistic wall art background')}
                    >
                      🖼️ Product + Wall Art
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-xs"
                      onClick={() => setPrompt('Model portrait for avatar and profile content')}
                    >
                      👤 Model Portrait
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div>
            {generatedImages.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <div className="text-6xl mb-4">🎨</div>
                  <CardTitle className="mb-2">No images generated yet</CardTitle>
                  <p className="text-muted-foreground mb-6">Create your first AI image to see it here</p>
                  <Button onClick={() => setActiveTab('create')}>
                    Start Creating
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {generatedImages.map((image) => (
                  <Card key={image.id} className="overflow-hidden">
                    <div className="aspect-square bg-muted">
                      <img
                        src={image.imageUrl}
                        alt="Generated image"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm mb-2 line-clamp-2">{image.prompt}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {image.provider}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          ${image.cost}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-1">
                        <Button variant="outline" size="sm" className="w-full">
                          📱 Use for Social Media
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          💾 Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
