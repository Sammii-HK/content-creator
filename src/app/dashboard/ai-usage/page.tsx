'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProviderStatus {
  provider: string;
  isConnected: boolean;
  creditsRemaining?: number;
  monthlyUsage: number;
  monthlySpend: number;
  avgCostPerRequest: number;
  successRate: number;
  avgResponseTime: number;
  needsAttention: boolean;
  alertMessage?: string;
}

interface UsageRecord {
  id: string;
  provider: string;
  requestType: string;
  cost: number;
  success: boolean;
  quality: string;
  createdAt: string;
}

export default function AIUsagePage() {
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [recentUsage, setRecentUsage] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [totalSpend, setTotalSpend] = useState(0);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const [statusRes, usageRes] = await Promise.all([
        fetch('/api/ai/usage/status'),
        fetch('/api/ai/usage/recent')
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setProviderStatuses(statusData.providers || []);
        setTotalSpend(statusData.totalMonthlySpend || 0);
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setRecentUsage(usageData.usage || []);
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAllIntegrations = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/test-ai-integrations', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Tested ${data.summary.totalProviders} providers. ${data.summary.successful} working, ${data.summary.failed} failed. Cost: $${data.summary.totalTestCost}`);
        await fetchUsageData(); // Refresh data
      }
    } catch (error) {
      alert('❌ Test failed');
    } finally {
      setTesting(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'replicate': return '🎨';
      case 'nano-banana': return '🍌';
      case 'stability-ai': return '🔬';
      case 'dalle-3': return '🤖';
      case 'runway-ml': return '🎬';
      default: return '⚡';
    }
  };

  const getStatusColor = (status: ProviderStatus) => {
    if (!status.isConnected) return 'destructive';
    if (status.needsAttention) return 'secondary';
    return 'default';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading AI usage data...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold">📊 AI Usage & Costs</h1>
              <p className="text-muted-foreground">Monitor your AI API usage, costs, and credits</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button onClick={testAllIntegrations} disabled={testing} variant="outline">
              {testing ? 'Testing...' : '🧪 Test All APIs'}
            </Button>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Monthly: ${totalSpend.toFixed(2)}
            </Badge>
          </div>
        </div>

        {/* Alerts */}
        {providerStatuses.some(p => p.needsAttention) && (
          <Alert className="mb-6">
            <AlertDescription>
              <strong>⚠️ Attention Needed:</strong> {' '}
              {providerStatuses
                .filter(p => p.needsAttention)
                .map(p => `${p.provider}: ${p.alertMessage}`)
                .join(' • ')}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">📊 Overview</TabsTrigger>
            <TabsTrigger value="providers">🤖 Providers</TabsTrigger>
            <TabsTrigger value="recent">📝 Recent Usage</TabsTrigger>
            <TabsTrigger value="optimization">💡 Optimization</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
                  <p className="text-muted-foreground text-sm">Monthly Spend</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {providerStatuses.filter(p => p.isConnected).length}
                  </div>
                  <p className="text-muted-foreground text-sm">Connected APIs</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {providerStatuses.reduce((sum, p) => sum + p.monthlyUsage, 0)}
                  </div>
                  <p className="text-muted-foreground text-sm">Total Requests</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {Math.round(
                      providerStatuses.reduce((sum, p) => sum + p.successRate, 0) / 
                      providerStatuses.filter(p => p.isConnected).length || 0
                    )}%
                  </div>
                  <p className="text-muted-foreground text-sm">Avg Success Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Provider Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providerStatuses.map((status) => (
                <Card key={status.provider} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getProviderIcon(status.provider)}</span>
                        <CardTitle className="capitalize">{status.provider}</CardTitle>
                      </div>
                      <Badge variant={getStatusColor(status)}>
                        {status.isConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {status.creditsRemaining !== undefined && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Credits</span>
                          <span>${status.creditsRemaining.toFixed(2)}</span>
                        </div>
                        <Progress 
                          value={Math.min(100, (status.creditsRemaining / 10) * 100)} 
                          className="h-2"
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Monthly Usage</p>
                        <p className="font-medium">{status.monthlyUsage} requests</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monthly Cost</p>
                        <p className="font-medium">${status.monthlySpend.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-medium">{status.successRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Response</p>
                        <p className="font-medium">{status.avgResponseTime.toFixed(1)}s</p>
                      </div>
                    </div>

                    {status.needsAttention && status.alertMessage && (
                      <Alert>
                        <AlertDescription className="text-xs">
                          {status.alertMessage}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Providers Detail */}
          <TabsContent value="providers">
            <div className="space-y-6">
              {providerStatuses.map((status) => (
                <Card key={status.provider}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <span>{getProviderIcon(status.provider)}</span>
                        <span className="capitalize">{status.provider}</span>
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Badge variant={getStatusColor(status)}>
                          {status.isConnected ? 'Connected' : 'Setup Required'}
                        </Badge>
                        {status.isConnected && (
                          <Badge variant="outline">
                            ${status.avgCostPerRequest.toFixed(3)} per request
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium">Monthly Usage</p>
                        <p className="text-2xl font-bold">{status.monthlyUsage}</p>
                        <p className="text-xs text-muted-foreground">requests</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Cost</p>
                        <p className="text-2xl font-bold">${status.monthlySpend.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">this month</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Success Rate</p>
                        <p className="text-2xl font-bold">{status.successRate.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">reliability</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Response Time</p>
                        <p className="text-2xl font-bold">{status.avgResponseTime.toFixed(1)}s</p>
                        <p className="text-xs text-muted-foreground">average</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Recent Usage */}
          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recent AI Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {recentUsage.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No recent usage data</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentUsage.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getProviderIcon(record.provider)}</span>
                          <div>
                            <p className="font-medium capitalize">{record.provider}</p>
                            <p className="text-sm text-muted-foreground">{record.requestType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <Badge variant={record.success ? "default" : "destructive"}>
                              {record.success ? '✅' : '❌'}
                            </Badge>
                            <Badge variant="outline">${record.cost.toFixed(3)}</Badge>
                            <Badge variant="secondary">{record.quality}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(record.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Optimization Tips */}
          <TabsContent value="optimization">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>💰 Cost Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl mb-2">🍌</div>
                        <h4 className="font-medium">Nano Banana</h4>
                        <p className="text-xs text-muted-foreground">Best for product placement</p>
                        <Badge variant="outline" className="mt-2">~$0.08</Badge>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl mb-2">🎨</div>
                        <h4 className="font-medium">Replicate</h4>
                        <p className="text-xs text-muted-foreground">Best quality/price ratio</p>
                        <Badge variant="outline" className="mt-2">~$0.05</Badge>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl mb-2">🔬</div>
                        <h4 className="font-medium">Stability AI</h4>
                        <p className="text-xs text-muted-foreground">Cheapest for volume</p>
                        <Badge variant="outline" className="mt-2">~$0.02</Badge>
                      </div>
                    </div>

                    <Alert>
                      <AlertDescription>
                        <strong>💡 Smart Routing:</strong> Your platform automatically selects the best AI provider based on quality needs and cost. 
                        For product shots, it prefers Nano Banana. For artistic content, it uses Replicate. For volume work, it uses Stability AI.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🎯 How Your AIs Are Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">🖼️ Image Generation</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• <strong>Product Photos:</strong> Nano Banana (product placement specialist)</li>
                        <li>• <strong>Artistic Content:</strong> Replicate (Midjourney-quality)</li>
                        <li>• <strong>Volume Generation:</strong> Stability AI (cheapest)</li>
                        <li>• <strong>Precise Prompts:</strong> DALL-E 3 (best prompt following)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">⚡ Smart Features</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• <strong>Auto Provider Selection:</strong> Best quality for budget</li>
                        <li>• <strong>Fallback System:</strong> If one fails, try another</li>
                        <li>• <strong>Batch Optimization:</strong> Volume discounts</li>
                        <li>• <strong>Quality Tiers:</strong> Budget/Standard/Premium</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
