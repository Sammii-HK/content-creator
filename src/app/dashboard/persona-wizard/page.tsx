'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PersonaData {
  name: string;
  niche: string;
  expertise: string;
  audience: string;
  contentStyle: string;
  businessGoals: string;
  brandVoice: string;
  platforms: string[];
  successfulContent: string;
  challenges: string;
}

export default function PersonaWizard() {
  const [step, setStep] = useState(1);
  const [personaData, setPersonaData] = useState<PersonaData>({
    name: '',
    niche: '',
    expertise: '',
    audience: '',
    contentStyle: '',
    businessGoals: '',
    brandVoice: '',
    platforms: [],
    successfulContent: '',
    challenges: ''
  });
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [creating, setCreating] = useState(false);

  const totalSteps = 5;

  const updatePersonaData = (field: keyof PersonaData, value: string | string[]) => {
    setPersonaData(prev => ({ ...prev, [field]: value }));
  };

  const generateChatGPTPrompt = () => {
    const prompt = `# Digital Persona Creation for ${personaData.name}

I'm creating an AI-powered content creation system and need help developing a detailed digital persona. Please help me create a comprehensive persona profile based on this information:

## About Me & My Business
**Expertise:** ${personaData.expertise}
**Target Audience:** ${personaData.audience}
**Business Goals:** ${personaData.businessGoals}
**Content Niche:** ${personaData.niche}

## Content & Communication Style
**Content Style:** ${personaData.contentStyle}
**Brand Voice:** ${personaData.brandVoice}
**Platforms:** ${personaData.platforms.join(', ')}

## Performance Insights
**Most Successful Content:** ${personaData.successfulContent}
**Current Challenges:** ${personaData.challenges}

## What I Need From You

Please create a detailed digital persona profile that includes:

1. **Voice Characteristics**: How should this persona write and communicate?
2. **Content Themes**: What topics should this persona focus on?
3. **Tone Variations**: Different tones for different content types
4. **Audience Connection**: How to authentically connect with the target audience
5. **Platform Adaptation**: How to adapt the voice for each platform
6. **Content Hooks**: Types of opening lines that work for this persona
7. **Call-to-Actions**: Authentic CTAs that fit this persona's style
8. **Hashtag Strategy**: Relevant hashtags and tagging approach
9. **Content Calendar Ideas**: Weekly content themes and posting patterns
10. **Engagement Strategy**: How this persona should interact with followers

Please provide specific examples and actionable guidance I can use to train my AI system to create authentic content in this persona's voice.

Make the response detailed and practical - I'll use this to train an AI system that generates content automatically.`;

    setGeneratedPrompt(prompt);
  };

  const createPersona = async () => {
    setCreating(true);
    try {
      // Here you would normally create the persona
      // For now, just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Persona created! Use the ChatGPT prompt to get detailed persona insights.');
    } catch (error) {
      alert('Failed to create persona');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    alert('ChatGPT prompt copied to clipboard!');
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard/personas">
            <Button variant="ghost">← Back to Personas</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">🧙‍♂️ AI Persona Wizard</h1>
            <p className="text-muted-foreground">Create detailed digital personas with AI guidance</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
            <div className="flex-1 bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && '🎯 Basic Information'}
              {step === 2 && '👥 Audience & Content'}
              {step === 3 && '🎨 Style & Voice'}
              {step === 4 && '📊 Performance & Goals'}
              {step === 5 && '🤖 Generate ChatGPT Prompt'}
            </CardTitle>
            <p className="text-muted-foreground">
              {step === 1 && 'Tell us about this persona and their expertise'}
              {step === 2 && 'Who do they create content for and what platforms?'}
              {step === 3 && 'How do they communicate and what\'s their style?'}
              {step === 4 && 'What works well and what are the challenges?'}
              {step === 5 && 'Review and generate your ChatGPT persona prompt'}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Persona Name</Label>
                  <Input
                    id="name"
                    value={personaData.name}
                    onChange={(e) => updatePersonaData('name', e.target.value)}
                    placeholder="e.g., Succulent Expert, Tech Reviewer, Fitness Coach"
                  />
                </div>
                <div>
                  <Label htmlFor="niche">Content Niche</Label>
                  <Select value={personaData.niche} onValueChange={(value) => updatePersonaData('niche', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content niche" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plants">Plants & Gardening</SelectItem>
                      <SelectItem value="tech">Technology & Reviews</SelectItem>
                      <SelectItem value="fitness">Fitness & Health</SelectItem>
                      <SelectItem value="business">Business & Entrepreneurship</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle & Personal</SelectItem>
                      <SelectItem value="education">Education & Learning</SelectItem>
                      <SelectItem value="finance">Finance & Investing</SelectItem>
                      <SelectItem value="creative">Creative & Arts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expertise">Your Expertise</Label>
                  <Textarea
                    id="expertise"
                    value={personaData.expertise}
                    onChange={(e) => updatePersonaData('expertise', e.target.value)}
                    placeholder="What are you an expert in? What unique knowledge or experience do you bring?"
                    className="h-24"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Audience & Platforms */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Textarea
                    id="audience"
                    value={personaData.audience}
                    onChange={(e) => updatePersonaData('audience', e.target.value)}
                    placeholder="Who do you create content for? Demographics, interests, pain points, goals..."
                    className="h-24"
                  />
                </div>
                <div>
                  <Label>Primary Platforms</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Instagram', 'TikTok', 'YouTube', 'Twitter', 'LinkedIn', 'Facebook'].map((platform) => (
                      <div key={platform} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={platform}
                          checked={personaData.platforms.includes(platform)}
                          onChange={(e) => {
                            const platforms = e.target.checked 
                              ? [...personaData.platforms, platform]
                              : personaData.platforms.filter(p => p !== platform);
                            updatePersonaData('platforms', platforms);
                          }}
                        />
                        <Label htmlFor={platform} className="text-sm">{platform}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="contentStyle">Content Style</Label>
                  <Textarea
                    id="contentStyle"
                    value={personaData.contentStyle}
                    onChange={(e) => updatePersonaData('contentStyle', e.target.value)}
                    placeholder="How do you create content? Educational, entertaining, inspirational? What formats work best?"
                    className="h-24"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Voice & Style */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="brandVoice">Brand Voice & Personality</Label>
                  <Textarea
                    id="brandVoice"
                    value={personaData.brandVoice}
                    onChange={(e) => updatePersonaData('brandVoice', e.target.value)}
                    placeholder="How do you communicate? Friendly, professional, casual, inspiring? What's your personality like in content?"
                    className="h-32"
                  />
                </div>
                <div>
                  <Label htmlFor="businessGoals">Business Goals</Label>
                  <Textarea
                    id="businessGoals"
                    value={personaData.businessGoals}
                    onChange={(e) => updatePersonaData('businessGoals', e.target.value)}
                    placeholder="What are you trying to achieve? Brand awareness, product sales, community building, education?"
                    className="h-24"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Performance & Challenges */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="successfulContent">Most Successful Content</Label>
                  <Textarea
                    id="successfulContent"
                    value={personaData.successfulContent}
                    onChange={(e) => updatePersonaData('successfulContent', e.target.value)}
                    placeholder="Describe your best-performing posts. What worked? What got the most engagement?"
                    className="h-32"
                  />
                </div>
                <div>
                  <Label htmlFor="challenges">Current Challenges</Label>
                  <Textarea
                    id="challenges"
                    value={personaData.challenges}
                    onChange={(e) => updatePersonaData('challenges', e.target.value)}
                    placeholder="What struggles do you have with content creation? What would you like to improve?"
                    className="h-24"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Generated Prompt */}
            {step === 5 && (
              <div className="space-y-4">
                {!generatedPrompt && (
                  <div className="text-center py-8">
                    <Button onClick={generateChatGPTPrompt} size="lg">
                      🤖 Generate ChatGPT Prompt
                    </Button>
                    <p className="text-muted-foreground text-sm mt-2">
                      Create a comprehensive prompt with all your context
                    </p>
                  </div>
                )}

                {generatedPrompt && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Your ChatGPT Persona Prompt</Label>
                        <Button onClick={copyToClipboard} variant="outline" size="sm">
                          📋 Copy to Clipboard
                        </Button>
                      </div>
                      <Textarea
                        value={generatedPrompt}
                        readOnly
                        className="h-96 font-mono text-sm"
                      />
                    </div>
                    
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-medium mb-2">🚀 How to Use This Prompt:</h4>
                      <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                        <li>Copy the prompt above</li>
                        <li>Paste it into ChatGPT (GPT-4 recommended)</li>
                        <li>Get detailed persona insights and guidelines</li>
                        <li>Come back and paste ChatGPT's response to train your AI persona</li>
                        <li>Your AI will learn to create content in this authentic voice</li>
                      </ol>
                    </div>

                    <div className="flex space-x-3">
                      <Button onClick={createPersona} disabled={creating} className="flex-1">
                        {creating ? 'Creating Persona...' : '✨ Create AI Persona'}
                      </Button>
                      <Button onClick={() => setGeneratedPrompt('')} variant="outline">
                        🔄 Regenerate Prompt
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t">
              <Button 
                onClick={prevStep} 
                variant="outline" 
                disabled={step === 1}
              >
                ← Previous
              </Button>
              
              {step < totalSteps ? (
                <Button 
                  onClick={nextStep}
                  disabled={
                    (step === 1 && (!personaData.name || !personaData.niche || !personaData.expertise)) ||
                    (step === 2 && (!personaData.audience || !personaData.contentStyle || personaData.platforms.length === 0)) ||
                    (step === 3 && (!personaData.brandVoice || !personaData.businessGoals)) ||
                    (step === 4 && (!personaData.successfulContent || !personaData.challenges))
                  }
                >
                  Next →
                </Button>
              ) : (
                <Badge variant="secondary">Ready to Generate</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        {step > 1 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">📋 Persona Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Name:</strong> {personaData.name || 'Not set'}</p>
                  <p><strong>Niche:</strong> {personaData.niche || 'Not set'}</p>
                  <p><strong>Platforms:</strong> {personaData.platforms.join(', ') || 'None selected'}</p>
                </div>
                <div>
                  <p><strong>Audience:</strong> {personaData.audience ? `${personaData.audience.slice(0, 50)}...` : 'Not set'}</p>
                  <p><strong>Style:</strong> {personaData.contentStyle ? `${personaData.contentStyle.slice(0, 50)}...` : 'Not set'}</p>
                  <p><strong>Voice:</strong> {personaData.brandVoice ? `${personaData.brandVoice.slice(0, 50)}...` : 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">💡 Tips for Better Personas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">🎯 Be Specific</h4>
                <p className="text-muted-foreground">The more specific you are, the better your AI persona will be</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">📈 Include Performance Data</h4>
                <p className="text-muted-foreground">Mention what content performs well and why</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">🗣️ Define Your Voice</h4>
                <p className="text-muted-foreground">Describe how you communicate and connect with your audience</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
