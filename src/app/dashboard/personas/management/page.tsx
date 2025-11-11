'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Persona {
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
  hasBlueprint: boolean;
  guidanceCount: number;
  exampleCount: number;
  stats: {
    videos: number;
    templates: number;
    broll: number;
    assets: number;
    generatedImages: number;
    scheduledContent: number;
    aiUsage: number;
  };
}

interface PersonaExample {
  id: string;
  theme: string;
  tone: string;
  hook: string;
  body: string;
  caption?: string;
  tags: string[];
  engagement?: number;
  createdAt: string;
}

export default function PersonaManagement() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [examples, setExamples] = useState<PersonaExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [examplesLoading, setExamplesLoading] = useState(false);
  const [newExample, setNewExample] = useState({
    theme: '',
    tone: '',
    hook: '',
    body: '',
    caption: '',
    tags: '',
    engagement: ''
  });

  // Load all personas
  const loadPersonas = async () => {
    try {
      const response = await fetch('/api/digital-me/personas');
      const data = await response.json();
      if (data.success) {
        setPersonas(data.personas);
      }
    } catch (error) {
      console.error('Failed to load personas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load examples for a persona
  const loadPersonaExamples = async (personaId: string) => {
    setExamplesLoading(true);
    try {
      const response = await fetch(`/api/digital-me/personas/${personaId}/examples`);
      const data = await response.json();
      if (data.success) {
        setExamples(data.examples);
      }
    } catch (error) {
      console.error('Failed to load examples:', error);
    } finally {
      setExamplesLoading(false);
    }
  };

  // Add new example
  const addExample = async () => {
    if (!selectedPersona) return;

    try {
      const response = await fetch(`/api/digital-me/personas/${selectedPersona.id}/examples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: newExample.theme,
          tone: newExample.tone,
          hook: newExample.hook,
          body: newExample.body,
          caption: newExample.caption || undefined,
          tags: newExample.tags.split(',').map(t => t.trim()).filter(Boolean),
          engagement: newExample.engagement ? parseFloat(newExample.engagement) : undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        // Reset form
        setNewExample({
          theme: '',
          tone: '',
          hook: '',
          body: '',
          caption: '',
          tags: '',
          engagement: ''
        });
        
        // Reload examples
        await loadPersonaExamples(selectedPersona.id);
        
        // Reload personas to get updated stats
        await loadPersonas();
        
        alert('Example added successfully!');
      } else {
        alert(`Failed to add example: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to add example:', error);
      alert('Failed to add example');
    }
  };

  useEffect(() => {
    loadPersonas();
  }, []);

  useEffect(() => {
    if (selectedPersona) {
      loadPersonaExamples(selectedPersona.id);
    }
  }, [selectedPersona]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading personas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Persona Management</h1>
          <p className="text-muted-foreground">Manage your AI personas and training examples</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/persona-wizard">Create New Persona</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personas List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold">Your Personas</h2>
          {personas.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">No personas found</p>
                <Button asChild>
                  <Link href="/dashboard/persona-wizard">Create Your First Persona</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            personas.map((persona) => (
              <Card
                key={persona.id}
                className={`cursor-pointer transition-all ${
                  selectedPersona?.id === persona.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedPersona(persona)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{persona.name}</CardTitle>
                    <Badge variant={persona.isActive ? 'default' : 'secondary'}>
                      {persona.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{persona.niche}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Examples: {persona.exampleCount}</div>
                    <div>Videos: {persona.stats.videos}</div>
                    <div>Templates: {persona.stats.templates}</div>
                    <div>Assets: {persona.stats.assets}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {persona.preferredTones.slice(0, 3).map((tone) => (
                      <Badge key={tone} variant="outline" className="text-xs">
                        {tone}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Persona Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPersona ? (
            <>
              {/* Persona Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedPersona.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/personas/${selectedPersona.id}/settings`}>
                          Settings
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/persona-wizard?persona=${selectedPersona.id}`}>
                          Edit Blueprint
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Summary</h3>
                    <p className="text-sm text-muted-foreground">{selectedPersona.summary}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-2">Top Themes</h3>
                      <div className="flex flex-wrap gap-1">
                        {selectedPersona.topThemes.map((theme) => (
                          <Badge key={theme} variant="outline">{theme}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Preferred Tones</h3>
                      <div className="flex flex-wrap gap-1">
                        {selectedPersona.preferredTones.map((tone) => (
                          <Badge key={tone} variant="secondary">{tone}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Content Stats</h3>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{selectedPersona.stats.videos}</div>
                        <div className="text-muted-foreground">Videos</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{selectedPersona.stats.templates}</div>
                        <div className="text-muted-foreground">Templates</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{selectedPersona.stats.assets}</div>
                        <div className="text-muted-foreground">Assets</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{selectedPersona.exampleCount}</div>
                        <div className="text-muted-foreground">Examples</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Training Examples */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Training Examples ({examples.length})</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">Add Example</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add Training Example</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="theme">Theme</Label>
                              <Input
                                id="theme"
                                value={newExample.theme}
                                onChange={(e) => setNewExample({...newExample, theme: e.target.value})}
                                placeholder="e.g., productivity tips"
                              />
                            </div>
                            <div>
                              <Label htmlFor="tone">Tone</Label>
                              <Input
                                id="tone"
                                value={newExample.tone}
                                onChange={(e) => setNewExample({...newExample, tone: e.target.value})}
                                placeholder="e.g., inspiring, educational"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="hook">Hook</Label>
                            <Input
                              id="hook"
                              value={newExample.hook}
                              onChange={(e) => setNewExample({...newExample, hook: e.target.value})}
                              placeholder="Attention-grabbing opening line"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="body">Body Content</Label>
                            <Textarea
                              id="body"
                              value={newExample.body}
                              onChange={(e) => setNewExample({...newExample, body: e.target.value})}
                              placeholder="Main content body..."
                              rows={4}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="caption">Caption (Optional)</Label>
                            <Textarea
                              id="caption"
                              value={newExample.caption}
                              onChange={(e) => setNewExample({...newExample, caption: e.target.value})}
                              placeholder="Social media caption..."
                              rows={2}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="tags">Tags (comma-separated)</Label>
                              <Input
                                id="tags"
                                value={newExample.tags}
                                onChange={(e) => setNewExample({...newExample, tags: e.target.value})}
                                placeholder="productivity, tips, workflow"
                              />
                            </div>
                            <div>
                              <Label htmlFor="engagement">Engagement Score (Optional)</Label>
                              <Input
                                id="engagement"
                                type="number"
                                step="0.1"
                                value={newExample.engagement}
                                onChange={(e) => setNewExample({...newExample, engagement: e.target.value})}
                                placeholder="85.5"
                              />
                            </div>
                          </div>
                          
                          <Button onClick={addExample} className="w-full">
                            Add Example
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {examplesLoading ? (
                    <div className="text-center py-4">Loading examples...</div>
                  ) : examples.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No training examples yet. Add some to improve your persona&apos;s voice!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {examples.map((example) => (
                        <div key={example.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <Badge variant="outline">{example.theme}</Badge>
                              <Badge variant="secondary">{example.tone}</Badge>
                              {example.engagement && (
                                <Badge variant="default">{example.engagement}% engagement</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(example.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div>
                            <div className="font-medium text-sm">Hook:</div>
                            <div className="text-sm">{example.hook}</div>
                          </div>
                          
                          <div>
                            <div className="font-medium text-sm">Body:</div>
                            <div className="text-sm text-muted-foreground">
                              {example.body.length > 200 
                                ? `${example.body.substring(0, 200)}...` 
                                : example.body
                              }
                            </div>
                          </div>
                          
                          {example.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {example.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground">
                  Select a persona from the left to view details and manage training examples
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
