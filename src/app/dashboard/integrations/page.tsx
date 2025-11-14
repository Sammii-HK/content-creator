'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function IntegrationsPage() {
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});

  const checkConnections = useCallback(async () => {
    const integrations = [
      'openai', 'r2', 'succulent', 'midjourney', 'nano-banana', 
      'runway', 'stability', 'heygen', 'elevenlabs', 'pika'
    ];

    const status: Record<string, boolean> = {};
    
    for (const integration of integrations) {
      try {
        const response = await fetch(`/api/integrations/check/${integration}`);
        status[integration] = response.ok;
      } catch {
        status[integration] = false;
      }
    }

    setConnectionStatus(status);
  }, []);

  useEffect(() => {
    checkConnections();
  }, [checkConnections]);

  const aiTools = [
    {
      id: 'midjourney',
      name: 'Midjourney',
      type: 'Image Generation',
      cost: '$0.08-0.20 per image',
      strength: 'Premium artistic quality',
      useCase: 'Hero shots, artistic content',
      status: connectionStatus.midjourney,
      setup: 'Get API key from Midjourney Discord bot'
    },
    {
      id: 'nano-banana',
      name: 'Nano Banana',
      type: 'Product Placement',
      cost: '$0.05-0.12 per image',
      strength: 'Cost-effective, realistic',
      useCase: 'Product photography, bulk generation',
      status: connectionStatus['nano-banana'],
      setup: 'Sign up at nanobanana.ai for API access'
    },
    {
      id: 'runway',
      name: 'Runway ML',
      type: 'Video Generation',
      cost: '$1.20 per 4s video',
      strength: 'High-quality video creation',
      useCase: 'Text-to-video, video editing',
      status: connectionStatus.runway,
      setup: 'Get API key from Runway ML dashboard'
    },
    {
      id: 'stability',
      name: 'Stable Diffusion',
      type: 'Image Generation',
      cost: '$0.02-0.05 per image',
      strength: 'Open-source, volume',
      useCase: 'Bulk image generation',
      status: connectionStatus.stability,
      setup: 'Get API key from Stability AI'
    },
    {
      id: 'heygen',
      name: 'HeyGen',
      type: 'AI Avatar Videos',
      cost: '$0.20-1.00 per video',
      strength: 'Realistic talking avatars',
      useCase: 'Avatar videos using your photo',
      status: connectionStatus.heygen,
      setup: 'Upload your photo to HeyGen, get API key'
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      type: 'Voice Generation',
      cost: '$0.10-0.30 per minute',
      strength: 'Realistic voice cloning',
      useCase: 'Voiceovers in your voice',
      status: connectionStatus.elevenlabs,
      setup: 'Clone your voice, get API key'
    }
  ];

  const coreIntegrations = [
    {
      id: 'openai',
      name: 'OpenAI GPT-4o-mini',
      type: 'Text Generation',
      cost: '$0.001 per request',
      status: connectionStatus.openai,
      required: true
    },
    {
      id: 'r2',
      name: 'Cloudflare R2',
      type: 'Video Storage',
      cost: '$0.015/GB/month',
      status: connectionStatus.r2,
      required: true
    },
    {
      id: 'succulent',
      name: 'Succulent',
      type: 'Social Media',
      cost: 'Platform dependent',
      status: connectionStatus.succulent,
      required: false
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost">← Dashboard</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">🔗 Integrations</h1>
            <p className="text-muted-foreground">Manage AI tools and external platform connections</p>
          </div>
        </div>

        <Tabs defaultValue="ai-tools" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai-tools">🤖 AI Tools</TabsTrigger>
            <TabsTrigger value="core">⚙️ Core Services</TabsTrigger>
            <TabsTrigger value="external">🔗 External APIs</TabsTrigger>
          </TabsList>

          {/* AI Tools */}
          <TabsContent value="ai-tools">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiTools.map((tool) => (
                <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                        <p className="text-muted-foreground text-sm">{tool.type}</p>
                      </div>
                      <Badge variant={tool.status ? "default" : "secondary"}>
                        {tool.status ? 'Connected' : 'Not Setup'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Cost: {tool.cost}</p>
                      <p className="text-sm text-muted-foreground">{tool.strength}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium mb-1">Best for:</p>
                      <p className="text-xs text-muted-foreground">{tool.useCase}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium mb-1">Setup:</p>
                      <p className="text-xs text-muted-foreground">{tool.setup}</p>
                    </div>

                    <Button 
                      variant={tool.status ? "outline" : "default"} 
                      size="sm" 
                      className="w-full"
                    >
                      {tool.status ? 'Reconfigure' : 'Setup Integration'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Core Services */}
          <TabsContent value="core">
            <div className="space-y-6">
              <Alert>
                <AlertDescription>
                  <strong>Required for platform operation:</strong> These integrations are essential for your platform to function.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {coreIntegrations.map((integration) => (
                  <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{integration.name}</CardTitle>
                        <Badge variant={integration.status ? "default" : "destructive"}>
                          {integration.status ? '✅ Connected' : '❌ Missing'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">{integration.type}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Cost:</strong> {integration.cost}</p>
                        <p className="text-sm">
                          <strong>Required:</strong> {integration.required ? 'Yes' : 'Optional'}
                        </p>
                        {!integration.status && integration.required && (
                          <Alert>
                            <AlertDescription className="text-xs">
                              This integration is required. Add environment variables to fix.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* External APIs */}
          <TabsContent value="external">
            <div className="space-y-6">
              <Alert>
                <AlertDescription>
                  <strong>Use these APIs from other apps:</strong> Perfect for Etsy tools, Shopify apps, and custom integrations.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>📦 Product Shot API</CardTitle>
                    <p className="text-muted-foreground text-sm">Generate professional product photos</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      POST /api/external/generate-product-shot
                    </Badge>
                    <div className="text-sm space-y-1">
                      <p><strong>Perfect for:</strong> Etsy listings, product catalogs</p>
                      <p><strong>Cost:</strong> $0.05-0.25 per image</p>
                      <p><strong>Features:</strong> Multiple styles, quality options</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      📋 Copy API Documentation
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>👤 Model Shot API</CardTitle>
                    <p className="text-muted-foreground text-sm">Professional model photography</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      POST /api/external/generate-model-shot
                    </Badge>
                    <div className="text-sm space-y-1">
                      <p><strong>Perfect for:</strong> Avatar content, profile photos</p>
                      <p><strong>Cost:</strong> $0.08-0.30 per image</p>
                      <p><strong>Features:</strong> Pose control, style options</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      📋 Copy API Documentation
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>🖼️ Wall Art + Product API</CardTitle>
                    <p className="text-muted-foreground text-sm">Products with artistic backgrounds</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      POST /api/external/generate-wall-art-product
                    </Badge>
                    <div className="text-sm space-y-1">
                      <p><strong>Perfect for:</strong> Lifestyle product shots</p>
                      <p><strong>Cost:</strong> $0.10-0.35 per image</p>
                      <p><strong>Features:</strong> Gallery walls, room styles</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      📋 Copy API Documentation
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>⚙️ Batch Generation</CardTitle>
                    <p className="text-muted-foreground text-sm">Generate multiple images at once</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      POST /api/external/batch-generate
                    </Badge>
                    <div className="text-sm space-y-1">
                      <p><strong>Perfect for:</strong> Product catalogs, variations</p>
                      <p><strong>Cost:</strong> Volume discounts available</p>
                      <p><strong>Features:</strong> Smart cost optimization</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      📋 Copy API Documentation
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Environment Variables Guide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🔧 Environment Variables for Production</CardTitle>
            <p className="text-muted-foreground">Add these to your Vercel project settings</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">✅ Required (Core Platform)</h4>
                <div className="space-y-2 text-sm font-mono">
                  <p>OPENAI_API_KEY</p>
                  <p>DATABASE_URL</p>
                  <p>CLOUDFLARE_R2_ACCOUNT_ID</p>
                  <p>CLOUDFLARE_R2_ACCESS_KEY_ID</p>
                  <p>CLOUDFLARE_R2_SECRET_ACCESS_KEY</p>
                  <p>CLOUDFLARE_R2_BUCKET_NAME</p>
                  <p>CLOUDFLARE_R2_PUBLIC_URL</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">🎨 Optional (AI Tools)</h4>
                <div className="space-y-2 text-sm font-mono">
                  <p>MIDJOURNEY_API_KEY</p>
                  <p>NANO_BANANA_API_KEY</p>
                  <p>RUNWAY_ML_API_KEY</p>
                  <p>STABILITY_AI_API_KEY</p>
                  <p>HEYGEN_API_KEY</p>
                  <p>ELEVENLABS_API_KEY</p>
                  <p>SUCCULENT_API_KEY</p>
                  <p>EXTERNAL_API_KEY</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Recommendations */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>💡 Recommended Setup Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl mb-2">1️⃣</div>
                <h4 className="font-medium">Core Platform</h4>
                <p className="text-xs text-muted-foreground">OpenAI + R2 + Database</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl mb-2">2️⃣</div>
                <h4 className="font-medium">Succulent</h4>
                <p className="text-xs text-muted-foreground">Social media posting</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl mb-2">3️⃣</div>
                <h4 className="font-medium">Image AI</h4>
                <p className="text-xs text-muted-foreground">Nano Banana or Midjourney</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl mb-2">4️⃣</div>
                <h4 className="font-medium">Advanced AI</h4>
                <p className="text-xs text-muted-foreground">Avatar, voice, video</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
