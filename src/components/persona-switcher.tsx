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
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-6 py-3">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="w-32 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (personas.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            <span className="text-gray-500">No personas created</span>
          </div>
          <Link href="/dashboard/persona-wizard">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Persona
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <Select value={activePersona || ''} onValueChange={switchPersona}>
                <SelectTrigger className="w-48 border-gray-200 bg-white/60">
                  <SelectValue placeholder="Select persona" />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((persona) => (
                    <SelectItem key={persona.id} value={persona.id}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{persona.name}</span>
                        <Badge variant="outline" className="text-xs">{persona.niche}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {currentPersona && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {currentPersona.niche}
              </Badge>
              {currentPersona.succulentAccountGroupId && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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
            <Button size="sm" variant="outline" className="border-gray-300">
              <Plus className="h-4 w-4 mr-2" />
              New Persona
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
