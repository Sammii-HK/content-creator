'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Settings, Save, ArrowLeft, ExternalLink, Sparkles, BarChart3 } from 'lucide-react';

interface Persona {
  id: string;
  name: string;
  niche: string;
  description: string;
  summary: string;
  preferredTones: string[];
  topThemes: string[];
  succulentAccountGroupId?: string;
  isActive: boolean;
}

export default function PersonaSettings() {
  const params = useParams();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [niche, setNiche] = useState('');
  const [succulentGroupId, setSucculentGroupId] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchPersona();
    }
  }, [params.id]);

  const fetchPersona = async () => {
    try {
      const response = await fetch(`/api/digital-me/personas/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        const p = data.persona;
        setPersona(p);
        setName(p.name);
        setDescription(p.description || '');
        setNiche(p.niche);
        setSucculentGroupId(p.succulentAccountGroupId || '');
      }
    } catch (error) {
      console.error('Failed to fetch persona:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/digital-me/personas/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          niche,
          succulentAccountGroupId: succulentGroupId || null
        })
      });

      if (response.ok) {
        alert('✅ Settings saved successfully!');
        fetchPersona(); // Refresh
      } else {
        const error = await response.json();
        alert(`❌ Failed to save: ${error.error}`);
      }
    } catch (error) {
      alert('❌ Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading persona settings...</p>
        </div>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Persona Not Found</h2>
            <p className="text-gray-600 mb-4">The persona you're looking for doesn't exist.</p>
            <Link href="/dashboard/personas">
              <Button>Back to Personas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/personas">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Personas
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{persona.name} Settings</h1>
              <p className="text-gray-600">Configure this persona and Succulent integration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Basic Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Persona Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="niche">Content Niche</Label>
                  <Input
                    id="niche"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="bg-white border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-white border-gray-300 h-24"
                    placeholder="What kind of content does this persona create?"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="text-lg">🌱</div>
                  <span>Succulent Integration</span>
                </CardTitle>
                <p className="text-gray-600 text-sm">Connect this persona to your social media accounts</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="succulent-group-id">Account Group ID</Label>
                  <Input
                    id="succulent-group-id"
                    value={succulentGroupId}
                    onChange={(e) => setSucculentGroupId(e.target.value)}
                    className="bg-white border-gray-300"
                    placeholder="e.g., group_abc123def456"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Get this from your Succulent dashboard → Account Groups
                  </p>
                </div>

                {succulentGroupId && (
                  <Alert>
                    <AlertDescription>
                      <strong>✅ Integration Active:</strong> This persona will post to account group "{succulentGroupId}" 
                      containing all your connected social media accounts.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">How Succulent Integration Works:</h4>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• Each persona = one Succulent account group</li>
                    <li>• Account groups contain multiple platforms (Instagram + TikTok + YouTube)</li>
                    <li>• When you generate content, it posts to all platforms in the group</li>
                    <li>• Content is automatically optimized for each platform</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={saveSettings}
                disabled={saving}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">📊 Persona Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Voice Examples</span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Generated Content</span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <Badge variant="secondary">-</Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Preferred Tones</h4>
                  <div className="flex flex-wrap gap-1">
                    {persona.preferredTones.map(tone => (
                      <Badge key={tone} variant="outline" className="text-xs">
                        {tone}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Top Themes</h4>
                  <div className="flex flex-wrap gap-1">
                    {persona.topThemes.map(theme => (
                      <Badge key={theme} variant="secondary" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">🔗 Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/create-images">
                  <Button variant="outline" className="w-full justify-start border-gray-300">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Content
                  </Button>
                </Link>
                <Link href="/dashboard/ai-usage">
                  <Button variant="outline" className="w-full justify-start border-gray-300">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Usage
                  </Button>
                </Link>
                <a 
                  href="https://app.succulent.com/account-groups" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full justify-start border-gray-300">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Succulent Dashboard
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
