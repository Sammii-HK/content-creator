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

interface Persona {
  id: string;
  name: string;
  description: string;
  niche: string;
  summary: string;
  preferredTones: string[];
  topThemes: string[];
  isActive: boolean;
  exampleCount?: number;
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [niche, setNiche] = useState('');
  const [sampleContent, setSampleContent] = useState('');

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      const response = await fetch('/api/digital-me/personas');
      if (response.ok) {
        const data = await response.json();
        setPersonas(data.personas || []);
      }
    } catch (error) {
      console.error('Failed to fetch personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPersona = async () => {
    if (!name.trim() || !niche.trim() || !sampleContent.trim()) return;

    setCreating(true);

    // Parse sample content into examples
    const samples = sampleContent.split('\n\n').filter(s => s.trim()).map(content => ({
      theme: niche,
      tone: 'authentic',
      hook: content.split(' ').slice(0, 8).join(' '),
      body: content,
      caption: content,
      tags: [niche],
      engagement: 1.0
    }));

    try {
      const response = await fetch('/api/digital-me/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          niche,
          samples
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPersonas([...personas, data.persona]);
        setShowForm(false);
        setName('');
        setDescription('');
        setNiche('');
        setSampleContent('');
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setCreating(false);
    }
  };

  const generateContent = async (personaId: string, prompt: string) => {
    try {
      const response = await fetch('/api/digital-me/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId,
          prompt,
          platform: 'instagram'
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Generated content: ${data.content.hook}\n\n${data.content.script.join(' ')}`);
      }
    } catch (error) {
      alert('Failed to generate content');
    }
  };

  const niches = [
    'plants', 'succulents', 'gardening', 'tech', 'fitness', 'business', 
    'cooking', 'travel', 'lifestyle', 'education', 'finance', 'health'
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost">← Dashboard</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">🧠 Digital Personas</h1>
              <p className="text-muted-foreground">Create different AI voices for different content niches</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)}>
            + Create New Persona
          </Button>
        </div>

        {/* Create Persona Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Digital Persona</CardTitle>
              <p className="text-muted-foreground">
                Train AI to write in different voices for different content types
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="persona-name">Persona Name</Label>
                  <Input
                    id="persona-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Succulent Expert, Tech Reviewer"
                  />
                </div>
                <div>
                  <Label htmlFor="niche">Content Niche</Label>
                  <Select value={niche} onValueChange={setNiche}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select niche" />
                    </SelectTrigger>
                    <SelectContent>
                      {niches.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What kind of content does this persona create?"
                />
              </div>

              <div>
                <Label htmlFor="sample-content">Sample Content</Label>
                <Textarea
                  id="sample-content"
                  value={sampleContent}
                  onChange={(e) => setSampleContent(e.target.value)}
                  placeholder={`Paste sample content for this persona...

Example for Succulent Expert:
Just repotted my jade plant and I'm so excited! 🌱 The root system was incredible - you could see how healthy it's been growing.

Here's what I learned about repotting:
1. Wait for the soil to dry completely
2. Gently remove old soil from roots
3. Use well-draining cactus mix
4. Don't water for a week after repotting

Who else loves the satisfaction of a fresh pot? Drop your favorite succulent below! 👇

---

Another post here...`}
                  className="h-32"
                />
              </div>

              <div className="flex space-x-3">
                <Button 
                  onClick={createPersona}
                  disabled={creating || !name.trim() || !niche.trim() || !sampleContent.trim()}
                  className="flex-1"
                >
                  {creating ? 'Creating Persona...' : 'Create Digital Persona'}
                </Button>
                <Button 
                  onClick={() => setShowForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personas Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading personas...</p>
          </div>
        ) : personas.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="text-6xl mb-4">🧠</div>
              <CardTitle className="mb-2">No Digital Personas Yet</CardTitle>
              <p className="text-muted-foreground mb-6">
                Create different AI voices for different content niches
              </p>
              <Button onClick={() => setShowForm(true)}>
                Create Your First Persona
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas.map((persona) => (
              <Card key={persona.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{persona.name}</CardTitle>
                      <p className="text-muted-foreground text-sm">{persona.description}</p>
                    </div>
                    <Badge variant={persona.isActive ? "default" : "secondary"}>
                      {persona.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        📁 {persona.niche}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {persona.summary}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium mb-1">Preferred Tones:</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.preferredTones.slice(0, 3).map(tone => (
                          <Badge key={tone} variant="secondary" className="text-xs">
                            {tone}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium mb-1">Top Themes:</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.topThemes.slice(0, 3).map(theme => (
                          <Badge key={theme} variant="outline" className="text-xs">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t space-y-2">
                      <Button 
                        onClick={() => generateContent(persona.id, `Create ${persona.niche} content`)}
                        className="w-full"
                        size="sm"
                      >
                        🤖 Generate Content
                      </Button>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Train More
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Example Personas */}
        {personas.length === 0 && !showForm && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>💡 Example Personas You Could Create</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">🌱</div>
                  <h4 className="font-medium">Succulent Expert</h4>
                  <p className="text-xs text-muted-foreground">
                    Plant care tips, repotting guides, succulent identification
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">💻</div>
                  <h4 className="font-medium">Tech Reviewer</h4>
                  <p className="text-xs text-muted-foreground">
                    Product reviews, tech tutorials, gadget comparisons
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">💪</div>
                  <h4 className="font-medium">Fitness Coach</h4>
                  <p className="text-xs text-muted-foreground">
                    Workout tips, nutrition advice, motivation content
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
