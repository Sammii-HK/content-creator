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

interface SucculentAccount {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  followerCount: number;
  isActive: boolean;
  connectedPersona?: {
    id: string;
    name: string;
    niche: string;
  };
}

interface Persona {
  id: string;
  name: string;
  niche: string;
  description: string;
}

export default function SucculentDashboard() {
  const [accounts, setAccounts] = useState<SucculentAccount[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  // Post creation
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [contentPrompt, setContentPrompt] = useState('');
  const [usePersona, setUsePersona] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, personasRes] = await Promise.all([
        fetch('/api/succulent/accounts'),
        fetch('/api/digital-me/personas')
      ]);

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(accountsData.accounts || []);
      }

      if (personasRes.ok) {
        const personasData = await personasRes.json();
        setPersonas(personasData.personas || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const postContent = async () => {
    if (!contentPrompt.trim() || selectedAccounts.length === 0) return;

    setPosting(true);
    try {
      const response = await fetch('/api/succulent/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountIds: selectedAccounts,
          prompt: contentPrompt,
          usePersona
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Posted to ${data.summary.successful}/${data.summary.totalAccounts} accounts!`);
        setContentPrompt('');
        setSelectedAccounts([]);
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setPosting(false);
    }
  };

  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Connecting to Succulent...</p>
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
              <h1 className="text-3xl font-bold">🌱 Succulent Integration</h1>
              <p className="text-muted-foreground">Manage your social accounts and Digital Me personas</p>
            </div>
          </div>
          <Link href="/dashboard/personas">
            <Button>Manage Personas</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>📱 Your Social Accounts</CardTitle>
              <p className="text-muted-foreground">
                Connected via Succulent • {accounts.length} accounts
              </p>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📱</div>
                  <p className="text-muted-foreground mb-4">No Succulent accounts found</p>
                  <p className="text-sm text-muted-foreground">
                    Check your Succulent API connection
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div 
                      key={account.id} 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedAccounts.includes(account.id) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleAccountSelection(account.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {account.platform === 'instagram' && '📷'}
                            {account.platform === 'tiktok' && '🎵'}
                            {account.platform === 'youtube' && '📺'}
                            {account.platform === 'twitter' && '🐦'}
                            {account.platform === 'linkedin' && '💼'}
                          </div>
                          <div>
                            <p className="font-medium">{account.displayName}</p>
                            <p className="text-sm text-muted-foreground">
                              @{account.username} • {formatFollowers(account.followerCount)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {account.connectedPersona ? (
                            <Badge variant="default">
                              🧠 {account.connectedPersona.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No Persona</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Creation */}
          <Card>
            <CardHeader>
              <CardTitle>✨ Create & Post Content</CardTitle>
              <p className="text-muted-foreground">
                Generate content using Digital Me personas
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="content-prompt">Content Idea</Label>
                <Textarea
                  id="content-prompt"
                  value={contentPrompt}
                  onChange={(e) => setContentPrompt(e.target.value)}
                  placeholder="Describe what you want to post...

Examples:
• Share succulent care tips for beginners
• Create motivational morning routine content  
• Post about productivity hacks for entrepreneurs
• Share latest tech product review"
                  className="h-24"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="use-persona"
                  checked={usePersona}
                  onChange={(e) => setUsePersona(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="use-persona" className="text-sm">
                  Use Digital Me personas for authentic voice
                </Label>
              </div>

              {selectedAccounts.length > 0 && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">
                    Posting to {selectedAccounts.length} accounts:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedAccounts.map(id => {
                      const account = accounts.find(a => a.id === id);
                      return account ? (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {account.platform}: @{account.username}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <Button 
                onClick={postContent}
                disabled={posting || !contentPrompt.trim() || selectedAccounts.length === 0}
                className="w-full"
                size="lg"
              >
                {posting ? '🤖 Generating & Posting...' : `📤 Post to ${selectedAccounts.length || 0} Accounts`}
              </Button>

              {selectedAccounts.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Select accounts above to enable posting
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Persona Connections */}
        {personas.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>🔗 Persona Connections</CardTitle>
              <p className="text-muted-foreground">
                Connect your Digital Me personas to specific social accounts
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {personas.map((persona) => (
                  <div key={persona.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="text-xl">🧠</div>
                      <div>
                        <p className="font-medium">{persona.name}</p>
                        <p className="text-xs text-muted-foreground">{persona.niche}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {persona.description}
                    </p>

                    <div className="text-xs text-muted-foreground">
                      Connected to: {accounts.filter(a => a.connectedPersona?.id === persona.id).length} accounts
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Link href="/dashboard/personas">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="text-center py-6">
                <div className="text-3xl mb-2">🧠</div>
                <CardTitle className="text-lg">Manage Personas</CardTitle>
                <p className="text-muted-foreground text-sm">Create & train Digital Me voices</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="text-center py-6">
              <div className="text-3xl mb-2">📊</div>
              <CardTitle className="text-lg">Analytics Sync</CardTitle>
              <p className="text-muted-foreground text-sm">Pull performance data from Succulent</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="text-center py-6">
              <div className="text-3xl mb-2">🔄</div>
              <CardTitle className="text-lg">Auto-Posting</CardTitle>
              <p className="text-muted-foreground text-sm">Schedule AI-generated content</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
