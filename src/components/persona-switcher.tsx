'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Plus, Settings } from 'lucide-react';
import Link from 'next/link';

interface Persona {
  id: string;
  name: string;
  niche: string;
  description: string;
  succulentAccountGroupId?: string;
  isActive: boolean;
}

export default function PersonaSwitcher() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      const response = await fetch('/api/digital-me/personas');
      if (response.ok) {
        const data = await response.json();
        setPersonas(data.personas || []);
        
        // Set active persona (first one or from localStorage)
        const savedPersona = localStorage.getItem('activePersona');
        if (savedPersona && data.personas.find((p: Persona) => p.id === savedPersona)) {
          setActivePersona(savedPersona);
        } else if (data.personas.length > 0) {
          setActivePersona(data.personas[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchPersona = (personaId: string) => {
    setActivePersona(personaId);
    localStorage.setItem('activePersona', personaId);
  };

  const currentPersona = personas.find(p => p.id === activePersona);

  if (loading) {
    return (
      <div className="border-b border-border bg-background-secondary/50 backdrop-blur-xl px-6 py-4">
        <div className="flex animate-pulse items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-background-tertiary"></div>
          <div className="h-4 w-32 rounded bg-background-tertiary"></div>
        </div>
      </div>
    );
  }

  if (personas.length === 0) {
    return (
      <div className="border-b border-border bg-background-secondary/50 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background-tertiary">
              <User className="h-4 w-4 text-foreground-muted" />
            </div>
            <span className="text-foreground-muted">No personas created</span>
          </div>
          <Link href="/dashboard/persona-wizard">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Persona
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border bg-background-secondary/50 backdrop-blur-xl px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-success shadow-soft">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <Select value={activePersona || ''} onValueChange={switchPersona}>
                <SelectTrigger className="w-56 border-border bg-background/80 shadow-soft">
                  <SelectValue placeholder="Select persona" />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((persona) => (
                    <SelectItem key={persona.id} value={persona.id}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{persona.name}</span>
                        <Badge variant="secondary" className="text-xs">{persona.niche}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {currentPersona && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {currentPersona.niche}
              </Badge>
              {currentPersona.succulentAccountGroupId && (
                <Badge variant="success" className="bg-success/10 text-success">
                  🌱 Connected
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {currentPersona && (
            <Link href={`/dashboard/personas/${currentPersona.id}/settings`}>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link href="/dashboard/persona-wizard">
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Persona
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
