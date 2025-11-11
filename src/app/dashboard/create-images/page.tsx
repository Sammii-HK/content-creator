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

            {/* Smart Prompt System */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>🧠 Smart Prompts for Consistent Results</CardTitle>
                <p className="text-gray-600 text-sm">Professional prompts designed for gorgeous, consistent product imagery</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Consistency Prompts */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">🔄 Consistency & Variations</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto p-4 text-left bg-blue-50 border-blue-200 hover:bg-blue-100"
                      onClick={() => setPrompt('Professional t-shirt photography, model in natural relaxed pose facing slightly towards camera, same exact pose and angle as reference, soft natural lighting from large window, clean modern background, only change the t-shirt design/pattern while maintaining identical composition, pose, lighting, and camera angle')}
                    >
                      <div>
                        <div className="font-medium text-blue-900">👕 Same Model, New T-Shirt Design</div>
                        <div className="text-xs text-blue-700 mt-1">Perfect for showing different designs on same model/pose</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-auto p-4 text-left bg-green-50 border-green-200 hover:bg-green-100"
                      onClick={() => setPrompt('Recreate exact same scene composition and lighting setup, same model in identical pose and expression, same camera angle and distance, same background and environment. Only change: the specific product being showcased. Maintain perfect consistency for brand catalog continuity')}
                    >
                      <div>
                        <div className="font-medium text-green-900">🔄 Same Scene, Different Product</div>
                        <div className="text-xs text-green-700 mt-1">Maintain everything identical except the product</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-auto p-4 text-left bg-purple-50 border-purple-200 hover:bg-purple-100"
                      onClick={() => setPrompt('Professional product photography series, maintain consistent brand aesthetic: same lighting style (soft natural window light), same composition approach (product centered, model in natural pose), same color palette (neutral tones), same mood (clean, modern, aspirational). Create cohesive brand imagery with visual consistency across all product shots')}
                    >
                      <div>
                        <div className="font-medium text-purple-900">🎨 Brand Consistency Series</div>
                        <div className="text-xs text-purple-700 mt-1">Cohesive aesthetic across all product images</div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Etsy-Optimized Prompts */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">🛍️ Etsy Marketplace Optimized</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto p-4 text-left bg-orange-50 border-orange-200 hover:bg-orange-100"
                      onClick={() => setPrompt('Professional Etsy hero image, product photography optimized for marketplace thumbnail, clean composition that stands out in search results, perfect lighting to show product quality and details, appeals to target customer demographic, professional but approachable, high-converting marketplace image')}
                    >
                      <div>
                        <div className="font-medium text-orange-900">🏆 Etsy Hero Shot</div>
                        <div className="text-xs text-orange-700 mt-1">Main listing image that converts</div>
                        <Badge variant="outline" className="mt-2 bg-orange-100 text-orange-800">$0.08-0.15</Badge>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-auto p-4 text-left bg-pink-50 border-pink-200 hover:bg-pink-100"
                      onClick={() => setPrompt('Etsy lifestyle product photography, shows product being used naturally in beautiful home setting, authentic and relatable, appeals to Etsy customer aesthetic preferences, handmade/artisanal feel, warm and inviting atmosphere, tells a story about the product and lifestyle')}
                    >
                      <div>
                        <div className="font-medium text-pink-900">🏠 Etsy Lifestyle Shot</div>
                        <div className="text-xs text-pink-700 mt-1">Product in beautiful home context</div>
                        <Badge variant="outline" className="mt-2 bg-pink-100 text-pink-800">$0.12-0.25</Badge>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Advanced Scenarios */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">🎯 Advanced Scenarios</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto p-4 text-left bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                      onClick={() => setPrompt('Professional product photography with gallery wall background, modern art collection on wall, sophisticated interior design, product elegantly placed on clean surface in foreground, museum-quality lighting, high-end aesthetic, luxury brand feel, perfect for artistic and creative products')}
                    >
                      <div>
                        <div className="font-medium text-indigo-900">🖼️ Gallery Wall + Product</div>
                        <div className="text-xs text-indigo-700 mt-1">Sophisticated artistic background with curated wall art</div>
                        <Badge variant="outline" className="mt-2 bg-indigo-100 text-indigo-800">$0.15-0.30</Badge>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-auto p-4 text-left bg-teal-50 border-teal-200 hover:bg-teal-100"
                      onClick={() => setPrompt('Seasonal product photography, product beautifully integrated into current season aesthetic, appropriate seasonal colors and mood, lifestyle setting that reflects the time of year, creates emotional connection with seasonal shopping mindset, timely and relevant')}
                    >
                      <div>
                        <div className="font-medium text-teal-900">🍂 Seasonal Context</div>
                        <div className="text-xs text-teal-700 mt-1">Product in seasonal lifestyle setting</div>
                        <Badge variant="outline" className="mt-2 bg-teal-100 text-teal-800">$0.12-0.22</Badge>
                      </div>
                    </Button>
                  </div>
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