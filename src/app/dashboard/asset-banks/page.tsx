'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  mood: string;
}

export default function AssetBanks() {
  const [activeBank, setActiveBank] = useState<'models' | 'products' | 'environments'>('models');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');

  useEffect(() => {
    fetchAssets();
  }, [activeBank]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/assets/${activeBank}`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadAsset = async () => {
    if (!uploadFile || !uploadName) return;

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', uploadName);
    formData.append('type', activeBank.slice(0, -1)); // Remove 's' from end
    formData.append('category', uploadCategory);

    try {
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setAssets([data.asset, ...assets]);
        setShowUpload(false);
        setUploadFile(null);
        setUploadName('');
        setUploadCategory('');
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const generateWithAssets = async () => {
    if (selectedAssets.length === 0) return;

    try {
      const response = await fetch('/api/ai/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetIds: selectedAssets,
          prompt: 'Create professional product photography',
          quality: 'standard'
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Generated scene with ${selectedAssets.length} assets! Cost: ${data.cost}`);
      }
    } catch (error) {
      alert('Generation failed');
    }
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const bankTabs = [
    { id: 'models' as const, name: '👤 Models', desc: 'People for lifestyle content' },
    { id: 'products' as const, name: '📦 Products', desc: 'Items to showcase' },
    { id: 'environments' as const, name: '🏠 Environments', desc: 'Backgrounds & settings' }
  ];

  const filteredAssets = assets.filter(asset => 
    !searchQuery || 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost">← Dashboard</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">🎨 Asset Banks</h1>
              <p className="text-muted-foreground">Manage models, products, and environments for AI generation</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button onClick={() => setShowUpload(true)}>
              📤 Upload Asset
            </Button>
            {selectedAssets.length > 0 && (
              <Button onClick={generateWithAssets}>
                🤖 Generate Scene ({selectedAssets.length} assets)
              </Button>
            )}
          </div>
        </div>

        {/* Bank Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
          {bankTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveBank(tab.id)}
              className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                activeBank === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div>{tab.name}</div>
              <div className="text-xs opacity-75">{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeBank}...`}
              className="w-full"
            />
          </div>
          <Badge variant="outline">
            {filteredAssets.length} {activeBank}
          </Badge>
          {selectedAssets.length > 0 && (
            <Badge variant="default">
              {selectedAssets.length} selected
            </Badge>
          )}
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>📤 Upload {activeBank.slice(0, -1)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="upload-file">Select Image</Label>
                <input
                  id="upload-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="upload-name">Asset Name</Label>
                  <Input
                    id="upload-name"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder={`Name for this ${activeBank.slice(0, -1)}`}
                  />
                </div>
                <div>
                  <Label htmlFor="upload-category">Category</Label>
                  <Input
                    id="upload-category"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    placeholder="e.g., portrait, casual, modern"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <Button 
                  onClick={uploadAsset}
                  disabled={!uploadFile || !uploadName}
                  className="flex-1"
                >
                  🤖 Upload & AI Analyze
                </Button>
                <Button onClick={() => setShowUpload(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assets Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading {activeBank}...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="text-6xl mb-4">
                {activeBank === 'models' && '👤'}
                {activeBank === 'products' && '📦'}
                {activeBank === 'environments' && '🏠'}
              </div>
              <CardTitle className="mb-2">No {activeBank} uploaded yet</CardTitle>
              <p className="text-muted-foreground mb-6">
                Upload your first {activeBank.slice(0, -1)} to start creating AI content
              </p>
              <Button onClick={() => setShowUpload(true)}>
                Upload {activeBank.slice(0, -1)}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredAssets.map((asset) => (
              <Card 
                key={asset.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedAssets.includes(asset.id) ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => toggleAssetSelection(asset.id)}
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedAssets.includes(asset.id) && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        ✓
                      </div>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-3">
                  <h4 className="font-medium text-sm truncate">{asset.name}</h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {asset.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {asset.style}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Scene Templates */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🎬 Popular Scene Templates</CardTitle>
            <p className="text-muted-foreground">
              Pre-built combinations for common content types
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🖼️</div>
                <h4 className="font-medium">Product + Wall Art</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Product with artwork background
                </p>
                <Badge variant="outline">$0.10-0.25</Badge>
              </div>
              
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">👤</div>
                <h4 className="font-medium">Lifestyle Product</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Model using product naturally
                </p>
                <Badge variant="outline">$0.15-0.40</Badge>
              </div>
              
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🏠</div>
                <h4 className="font-medium">Environment Setup</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Products in lifestyle settings
                </p>
                <Badge variant="outline">$0.08-0.20</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
