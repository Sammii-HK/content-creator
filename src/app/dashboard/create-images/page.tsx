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
import { promptTemplates, replaceProductPlaceholder } from '@/lib/prompt-templates';
import PersonaSwitcher from '@/components/persona-switcher';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Wand2, 
  DollarSign, 
  ArrowRight,
  Upload,
  RefreshCw,
  Heart,
  Download
} from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: 'model' | 'product' | 'environment';
  imageUrl: string;
  tags: string[];
  category: string;
  isFavorite?: boolean;
}

export default function CreateImages() {
  const [baseAssets, setBaseAssets] = useState<{
    model?: Asset;
    product?: Asset;
    environment?: Asset;
  }>({});
  const [newProductFile, setNewProductFile] = useState<File | null>(null);
  const [newProductPreview, setNewProductPreview] = useState<string>('');
  
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [style, setStyle] = useState('lifestyle');
  const [quality, setQuality] = useState('standard');
  const [generating, setGenerating] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0.12);
  
  const [allAssets, setAllAssets] = useState<Record<string, Asset[]>>({
    models: [],
    products: [],
    environments: []
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    // Update cost estimation
    const baseCost = quality === 'budget' ? 0.05 : quality === 'standard' ? 0.12 : 0.25;
    const assetCount = Object.values(baseAssets).filter(Boolean).length;
    const newProductBonus = newProductFile ? 0.03 : 0;
    setEstimatedCost(baseCost + (assetCount * 0.02) + newProductBonus);
  }, [baseAssets, quality, newProductFile]);

  const fetchAssets = async () => {
    try {
      // Fetch favorite assets for quick selection
      const response = await fetch('/api/assets/favorites');
      if (response.ok) {
        const data = await response.json();
        setAllAssets({
          models: data.favoriteAssets?.models || [],
          products: data.favoriteAssets?.products || [],
          environments: data.favoriteAssets?.environments || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  const handleNewProductUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProductFile(file);
      const previewUrl = URL.createObjectURL(file);
      setNewProductPreview(previewUrl);
    }
  };

  const selectBaseAsset = (type: 'model' | 'product' | 'environment', asset: Asset) => {
    setBaseAssets(prev => ({ ...prev, [type]: asset }));
  };

  const useTemplate = (templateId: string) => {
    const template = promptTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setPrompt(template.prompt);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    try {
      // Prepare the final prompt with product replacement
      let finalPrompt = prompt;
      if (newProductFile && baseAssets.product) {
        finalPrompt = replaceProductPlaceholder(prompt, 'uploaded product');
      }

      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          style,
          quality,
          baseAssets,
          newProductFile: newProductFile ? await fileToBase64(newProductFile) : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Image generated! Cost: $${data.cost}`);
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Persona Switcher */}
      <PersonaSwitcher />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  ← Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Image Studio</h1>
                <p className="text-gray-600">Create professional images with AI</p>
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
                className="bg-blue-600 hover:bg-blue-700 shadow-lg"
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Creation Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Asset Selection */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>🎯 Asset Replacement System</CardTitle>
                <p className="text-gray-600 text-sm">Select base assets, then upload new product to replace</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Base Model Selection */}
                <div>
                  <Label className="text-base font-medium">👤 Base Model (Optional)</Label>
                  <p className="text-gray-500 text-sm mb-3">Choose a model from your favorites</p>
                  {allAssets.models.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <p className="text-gray-500 mb-2">No favorite models</p>
                      <Link href="/dashboard/asset-banks">
                        <Button variant="outline" size="sm">Upload Models</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {allAssets.models.map((model) => (
                        <div
                          key={model.id}
                          className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            baseAssets.model?.id === model.id ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => selectBaseAsset('model', model)}
                        >
                          <img src={model.imageUrl} alt={model.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Base Product Selection */}
                <div>
                  <Label className="text-base font-medium">📦 Base Product (Optional)</Label>
                  <p className="text-gray-500 text-sm mb-3">Choose a product composition to replace with your new product</p>
                  {allAssets.products.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <p className="text-gray-500 mb-2">No favorite products</p>
                      <Link href="/dashboard/asset-banks">
                        <Button variant="outline" size="sm">Upload Products</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {allAssets.products.map((product) => (
                        <div
                          key={product.id}
                          className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            baseAssets.product?.id === product.id ? 'border-green-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => selectBaseAsset('product', product)}
                        >
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* New Product Upload */}
                <div>
                  <Label className="text-base font-medium">🆕 New Product to Replace</Label>
                  <p className="text-gray-500 text-sm mb-3">Upload your product image to replace the base product</p>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleNewProductUpload}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                      />
                    </div>
                    {newProductPreview && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                        <img src={newProductPreview} alt="New product" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Prompt Templates */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>✨ Professional Prompt Templates</CardTitle>
                <p className="text-gray-600 text-sm">Detailed prompts optimized for different use cases</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {promptTemplates.slice(0, 6).map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTemplate === template.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => useTemplate(template.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <Badge variant="outline" className="text-xs">{template.estimatedCost}</Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.bestFor.slice(0, 2).map((use) => (
                          <Badge key={use} variant="secondary" className="text-xs">
                            {use}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Prompt */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>✍️ Custom Prompt</CardTitle>
                <p className="text-gray-600 text-sm">Describe your image or customize the selected template</p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to create in detail..."
                  className="h-32 bg-white border-gray-300 resize-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>⚙️ Generation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="bg-white border-gray-300">
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
                  <Label>Quality & Cost</Label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget ($0.05)</SelectItem>
                      <SelectItem value="standard">Standard ($0.12)</SelectItem>
                      <SelectItem value="premium">Premium ($0.25)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-900">
                  <DollarSign className="h-5 w-5" />
                  <span>Cost Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-800">Base Generation</span>
                  <Badge className="bg-green-200 text-green-900">
                    ${quality === 'budget' ? '0.05' : quality === 'standard' ? '0.12' : '0.25'}
                  </Badge>
                </div>
                {Object.keys(baseAssets).length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-800">Asset Processing</span>
                    <Badge className="bg-green-200 text-green-900">
                      +$0.02 per asset
                    </Badge>
                  </div>
                )}
                {newProductFile && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-800">Product Replacement</span>
                    <Badge className="bg-green-200 text-green-900">+$0.03</Badge>
                  </div>
                )}
                <div className="border-t border-green-200 pt-3 flex justify-between items-center">
                  <span className="font-semibold text-green-900">Total</span>
                  <Badge className="bg-green-300 text-green-900 text-lg px-3 py-1">
                    ${estimatedCost.toFixed(2)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">🚀 Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/asset-banks">
                  <Button variant="outline" className="w-full justify-start border-gray-300">
                    <Upload className="h-4 w-4 mr-2" />
                    Manage Assets
                  </Button>
                </Link>
                <Link href="/dashboard/ai-usage">
                  <Button variant="outline" className="w-full justify-start border-gray-300">
                    <DollarSign className="h-4 w-4 mr-2" />
                    View Costs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}