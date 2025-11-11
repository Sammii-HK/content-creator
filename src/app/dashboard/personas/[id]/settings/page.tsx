'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PersonaSettings {
  id: string;
  name: string;
  description?: string;
  niche: string;
  summary: string;
  preferredTones: string[];
  topThemes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function PersonaSettings({ params }: PageProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<PersonaSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    niche: '',
    preferredTones: '',
    topThemes: '',
  });

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/digital-me/personas/${params.id}/settings`);
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
        setFormData({
          name: data.settings.name,
          description: data.settings.description || '',
          niche: data.settings.niche,
          preferredTones: data.settings.preferredTones.join(', '),
          topThemes: data.settings.topThemes.join(', '),
        });
      } else {
        alert('Failed to load persona settings');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      alert('Failed to load persona settings');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/digital-me/personas/${params.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          niche: formData.niche,
          preferredTones: formData.preferredTones
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          topThemes: formData.topThemes
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
        alert('Settings saved successfully!');
      } else {
        alert(`Failed to save settings: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const deletePersona = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/digital-me/personas/${params.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('Persona deleted successfully');
        router.push('/dashboard/personas/management');
      } else {
        alert(`Failed to delete persona: ${data.error}`);
        if (data.stats) {
          console.log('Content stats:', data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to delete persona:', error);
      alert('Failed to delete persona');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async () => {
    if (!settings) return;

    try {
      const response = await fetch(`/api/digital-me/personas/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !settings.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSettings({ ...settings, isActive: !settings.isActive });
        alert(`Persona ${settings.isActive ? 'deactivated' : 'activated'} successfully`);
      } else {
        alert(`Failed to update persona: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to toggle active status:', error);
      alert('Failed to update persona');
    }
  };

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading persona settings...</div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">Persona not found</div>
            <Button className="mt-4" onClick={() => router.push('/dashboard/personas/management')}>
              Back to Personas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Persona Settings</h1>
          <p className="text-muted-foreground">Configure {settings.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/personas/management')}>
            Back to Management
          </Button>
          <Button variant={settings.isActive ? 'destructive' : 'default'} onClick={toggleActive}>
            {settings.isActive ? 'Deactivate' : 'Activate'} Persona
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Persona Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Tech Reviewer, Fitness Coach"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What this persona is about..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="niche">Content Niche</Label>
                <Input
                  id="niche"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  placeholder="e.g., technology, fitness, business"
                />
              </div>

              <div>
                <Label htmlFor="preferredTones">Preferred Tones (comma-separated)</Label>
                <Input
                  id="preferredTones"
                  value={formData.preferredTones}
                  onChange={(e) => setFormData({ ...formData, preferredTones: e.target.value })}
                  placeholder="e.g., inspiring, educational, authentic"
                />
              </div>

              <div>
                <Label htmlFor="topThemes">Top Themes (comma-separated)</Label>
                <Input
                  id="topThemes"
                  value={formData.topThemes}
                  onChange={(e) => setFormData({ ...formData, topThemes: e.target.value })}
                  placeholder="e.g., productivity, innovation, tutorials"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveSettings} disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button variant="outline" onClick={loadSettings}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Persona Info & Danger Zone */}
        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Active Status</span>
                  <Badge variant={settings.isActive ? 'default' : 'secondary'}>
                    {settings.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  <div>Created: {new Date(settings.createdAt).toLocaleDateString()}</div>
                  <div>Updated: {new Date(settings.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Traits */}
          <Card>
            <CardHeader>
              <CardTitle>Current Traits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium text-sm mb-2">Summary</div>
                <div className="text-sm text-muted-foreground">{settings.summary}</div>
              </div>

              <div>
                <div className="font-medium text-sm mb-2">Preferred Tones</div>
                <div className="flex flex-wrap gap-1">
                  {settings.preferredTones.map((tone) => (
                    <Badge key={tone} variant="secondary" className="text-xs">
                      {tone}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-medium text-sm mb-2">Top Themes</div>
                <div className="flex flex-wrap gap-1">
                  {settings.topThemes.map((theme) => (
                    <Badge key={theme} variant="outline" className="text-xs">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Deleting a persona will remove all its training examples and cannot be undone.
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full">
                      Delete Persona
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Persona</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete &quot;{settings.name}&quot;? This action
                        cannot be undone. All training examples and associated data will be
                        permanently removed.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline">Cancel</Button>
                      <Button variant="destructive" onClick={deletePersona} disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete Permanently'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
