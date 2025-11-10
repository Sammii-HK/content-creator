'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Upload, Search, Heart, Sparkles } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: 'model' | 'product' | 'environment';
  imageUrl: string;
  tags: string[];
  category: string;
  style: string;
  isFavorite?: boolean;
}

export default function AssetBanks() {
  const [assets, setAssets] = useState<Record<string, Asset[]>>({
    models: [],
    products: [],
    environments: []
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    // Update cost estimation when selection changes
    const baseCost = 0.12; // Standard cost
    const assetMultiplier = selectedAssets.length * 0.02; // Small increase per asset
    setEstimatedCost(baseCost + assetMultiplier);
  }, [selectedAssets]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      // Simulate fetching assets - replace with real API calls
      setAssets({
        models: [],
        products: [],
        environments: []
      });
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const generateWithSelection = async () => {
    if (selectedAssets.length === 0) return;

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetIds: selectedAssets,
          prompt: 'Professional product photography with selected assets',
          quality: 'standard'
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✨ Generated image! Cost: $${data.cost}`);
      }
    } catch (error) {
      alert('❌ Generation failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Clean Header */}
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
                <h1 className="text-2xl font-semibold text-gray-900">Asset Banks</h1>
                <p className="text-gray-500 text-sm">Manage your creative assets for AI generation</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {selectedAssets.length > 0 && (
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                    {selectedAssets.length} selected
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Est. ${estimatedCost.toFixed(2)}
                  </Badge>
                  <Button onClick={generateWithSelection} size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              )}
              
              <Button className="bg-gray-900 hover:bg-gray-800">
                <Plus className="h-4 w-4 mr-2" />
                Upload Asset
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="pl-10 bg-white/60 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Modern Tabs */}
        <Tabs defaultValue="models" className="space-y-8">
          <TabsList className="bg-white/60 border border-gray-200 p-1">
            <TabsTrigger value="models" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="text-lg">👤</div>
                <span>Models</span>
                <Badge variant="secondary" className="ml-2">{assets.models.length}</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="text-lg">📦</div>
                <span>Products</span>
                <Badge variant="secondary" className="ml-2">{assets.products.length}</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger value="environments" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="text-lg">🏠</div>
                <span>Environments</span>
                <Badge variant="secondary" className="ml-2">{assets.environments.length}</Badge>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-6">
            {assets.models.length === 0 ? (
              <Card className="bg-white/60 border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-6xl mb-4 opacity-20">👤</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No models uploaded</h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    Upload model photos to create professional lifestyle and portrait content
                  </p>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Model
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {assets.models.map((asset) => (
                  <Card 
                    key={asset.id}
                    className={`group cursor-pointer transition-all duration-200 bg-white/60 hover:bg-white hover:shadow-lg border-gray-200 ${
                      selectedAssets.includes(asset.id) ? 'ring-2 ring-blue-500 bg-white' : ''
                    }`}
                    onClick={() => toggleAssetSelection(asset.id)}
                  >
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {asset.isFavorite && (
                        <div className="absolute top-2 left-2">
                          <Heart className="h-4 w-4 text-red-500 fill-current" />
                        </div>
                      )}
                      {selectedAssets.includes(asset.id) && (
                        <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                          <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                            ✓
                          </div>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm text-gray-900 truncate">{asset.name}</h4>
                      <div className="flex items-center space-x-1 mt-1">
                        <Badge variant="outline" className="text-xs bg-gray-50">{asset.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            {assets.products.length === 0 ? (
              <Card className="bg-white/60 border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-6xl mb-4 opacity-20">📦</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No products uploaded</h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    Upload product images to create professional product photography and marketing content
                  </p>
                  <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Product
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {/* Product grid would go here */}
              </div>
            )}
          </TabsContent>

          {/* Environments Tab */}
          <TabsContent value="environments" className="space-y-6">
            {assets.environments.length === 0 ? (
              <Card className="bg-white/60 border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-6xl mb-4 opacity-20">🏠</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No environments uploaded</h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    Upload background images and environments for lifestyle and artistic product photography
                  </p>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Environment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {/* Environment grid would go here */}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Scene Templates */}
        <Card className="mt-12 bg-white/60 border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">✨ Popular Scene Templates</CardTitle>
            <p className="text-gray-500">Pre-built combinations with accurate cost estimates</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">🖼️</div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">Popular</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Product + Wall Art</h3>
                <p className="text-gray-600 text-sm mb-4">Product with artistic gallery wall background</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-white/80">$0.10-0.25</Badge>
                  <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700">
                    Use Template
                  </Button>
                </div>
              </div>

              <div className="group p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">👤</div>
                  <Badge className="bg-green-100 text-green-700 border-green-200">Trending</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Lifestyle Product</h3>
                <p className="text-gray-600 text-sm mb-4">Model using product in natural environment</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-white/80">$0.15-0.40</Badge>
                  <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700">
                    Use Template
                  </Button>
                </div>
              </div>

              <div className="group p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">🏠</div>
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">Premium</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Environment Setup</h3>
                <p className="text-gray-600 text-sm mb-4">Products in curated lifestyle settings</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-white/80">$0.08-0.20</Badge>
                  <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700">
                    Use Template
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/create-images">
            <Card className="group cursor-pointer bg-white/60 border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-200">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-3 rounded-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Create Images</h3>
                  <p className="text-gray-500 text-sm">Generate AI content with your assets</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/integrations">
            <Card className="group cursor-pointer bg-white/60 border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-200">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-gradient-to-br from-green-500 to-blue-500 p-3 rounded-xl">
                  <div className="text-white text-xl">🔗</div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Integrations</h3>
                  <p className="text-gray-500 text-sm">Manage your AI providers</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/ai-usage">
            <Card className="group cursor-pointer bg-white/60 border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-200">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
                  <div className="text-white text-xl">📊</div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Usage & Costs</h3>
                  <p className="text-gray-500 text-sm">Monitor AI spending</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}