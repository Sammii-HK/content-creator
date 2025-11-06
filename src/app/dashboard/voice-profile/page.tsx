'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VoiceProfile {
  id: string;
  summary: string;
  preferredTones: string[];
  topThemes: string[];
  lexicalTraits: any;
  updatedAt: string;
}

export default function VoiceProfilePage() {
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sampleContent, setSampleContent] = useState('');
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/digital-me/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!sampleContent.trim()) return;

    setCreating(true);
    
    // Split sample content into individual samples
    const samples = sampleContent.split('\n\n').filter(s => s.trim()).map(content => ({
      theme: 'general',
      tone: 'authentic',
      hook: content.split(' ').slice(0, 8).join(' '),
      body: content,
      caption: content,
      tags: [],
      engagement: 1.0
    }));

    try {
      const response = await fetch('/api/digital-me/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples })
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setSampleContent('');
      } else {
        const error = await response.json();
        alert(`Failed to create profile: ${error.error}`);
      }
    } catch (error) {
      alert('Network error creating profile');
    } finally {
      setCreating(false);
    }
  };

  const generateContent = async () => {
    const prompt = 'Create an engaging social media post about productivity tips';
    
    setGenerating(true);
    try {
      const response = await fetch('/api/digital-me/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          platform: 'instagram',
          targetDuration: 30
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(data.content);
      } else {
        const error = await response.json();
        alert(`Failed to generate content: ${error.error}`);
      }
    } catch (error) {
      alert('Network error generating content');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost">← Dashboard</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">🤖 Digital Me</h1>
            <p className="text-muted-foreground">AI that learns your voice and creates authentic content</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading voice profile...</p>
          </div>
        ) : !profile ? (
          /* Setup Voice Profile */
          <Card>
            <CardHeader>
              <CardTitle>Create Your Voice Profile</CardTitle>
              <p className="text-muted-foreground">
                Paste some of your existing social media posts or content to teach AI your voice
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  value={sampleContent}
                  onChange={(e) => setSampleContent(e.target.value)}
                  placeholder="Paste your content here... 

Example:
Just finished my morning routine and I'm feeling so productive! ☀️ There's something magical about starting the day with intention.

Here's what changed everything for me:
1. Wake up without checking phone
2. 10 minutes of journaling
3. Cold shower (yes, really!)

What's your secret to productive mornings? 👇

---

Another post here..."
                  className="w-full h-64 p-3 border rounded-lg resize-none"
                />
                
                <div className="flex items-center space-x-3">
                  <Button 
                    onClick={createProfile}
                    disabled={creating || !sampleContent.trim()}
                    className="flex-1"
                  >
                    {creating ? 'Analyzing Your Voice...' : '🧠 Create Voice Profile'}
                  </Button>
                </div>
                
                <p className="text-muted-foreground text-sm">
                  💡 Tip: Include 3-5 different posts to help AI understand your style better
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Voice Profile Dashboard */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Voice Profile</CardTitle>
                <p className="text-muted-foreground">
                  Last updated: {new Date(profile.updatedAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Voice Summary</h4>
                    <p className="text-muted-foreground">{profile.summary}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Preferred Tones</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.preferredTones.map(tone => (
                        <Badge key={tone} variant="secondary">{tone}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Top Themes</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.topThemes.map(theme => (
                        <Badge key={theme} variant="outline">{theme}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Content Generation */}
            <Card>
              <CardHeader>
                <CardTitle>Test Your Digital Voice</CardTitle>
                <p className="text-muted-foreground">
                  Generate content in your authentic voice
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={generateContent}
                    disabled={generating}
                    className="w-full"
                  >
                    {generating ? 'Generating...' : '✨ Generate Sample Content'}
                  </Button>
                  
                  {generatedContent && (
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-medium mb-2">Generated Content</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Hook:</strong> {generatedContent.hook}</p>
                        <div>
                          <strong>Script:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {generatedContent.script.map((line: string, i: number) => (
                              <li key={i}>{line}</li>
                            ))}
                          </ul>
                        </div>
                        <p><strong>Caption:</strong> {generatedContent.caption}</p>
                        <div>
                          <strong>Hashtags:</strong> 
                          {generatedContent.hashtags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="ml-1">#{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
