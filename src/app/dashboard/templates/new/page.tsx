'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import VideoGenerator from '@/components/VideoGenerator';

interface TextStyle {
  fontSize: number;
  fontWeight: string;
  color: string;
  stroke?: string;
  strokeWidth?: number;
  maxWidth?: number;
  fadeIn?: number; // Duration in seconds for fade in
  fadeOut?: number; // Duration in seconds for fade out
  background?: boolean | string;
  backgroundColor?: string;
  boxBorderWidth?: number;
}

interface TextOverlay {
  content: string;
  position: { x: number; y: number };
  style: TextStyle;
}

interface VideoScene {
  start: number;
  end: number;
  text: TextOverlay;
  filters?: string[];
}

interface VideoTemplate {
  name?: string;
  duration: number;
  scenes: VideoScene[];
  textStyle?: Partial<TextStyle>;
}

interface BrollVideo {
  id: string;
  name: string;
  fileUrl: string;
  duration: number;
  category?: string;
}

export default function NewTemplate() {
  const [templateName, setTemplateName] = useState('');
  const [template, setTemplate] = useState<VideoTemplate>({
    name: '',
    duration: 10,
    textStyle: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeWidth: 2,
      maxWidth: 90,
      background: 'rgba(0,0,0,0.55)',
    },
    scenes: [
      {
        start: 0,
        end: 10,
        text: {
          content: '{{hook}}',
          position: { x: 50, y: 50 },
          style: {
            fontSize: 48,
            fontWeight: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeWidth: 2,
          },
        },
        filters: ['brightness(1.0)', 'contrast(1.0)'],
      },
    ],
  });

  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [availableVideos, setAvailableVideos] = useState<BrollVideo[]>([]);
  const [selectedPreviewVideo, setSelectedPreviewVideo] = useState<BrollVideo | null>(null);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [personas, setPersonas] = useState<Array<{ id: string; name: string; niche: string }>>([]);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [generatingFromText, setGeneratingFromText] = useState(false);
  const [showNaturalLanguage, setShowNaturalLanguage] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'json'>('text'); // Track input mode
  const [jsonCopied, setJsonCopied] = useState(false);

  // Load template from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTemplate = localStorage.getItem('draftTemplate');
      const savedTemplateName = localStorage.getItem('draftTemplateName');
      if (savedTemplate) {
        try {
          const parsedTemplate = JSON.parse(savedTemplate);
          setTemplate(parsedTemplate);
          if (savedTemplateName) {
            setTemplateName(savedTemplateName);
          }
          console.log('📦 Loaded draft template from localStorage');
        } catch (error) {
          console.warn('Failed to load draft template from localStorage:', error);
          localStorage.removeItem('draftTemplate');
          localStorage.removeItem('draftTemplateName');
        }
      }
    }
  }, []);

  // Auto-save template to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && template) {
      try {
        localStorage.setItem('draftTemplate', JSON.stringify(template));
        if (templateName) {
          localStorage.setItem('draftTemplateName', templateName);
        }
      } catch (error) {
        console.warn('Failed to save draft template to localStorage:', error);
      }
    }
  }, [template, templateName]);

  useEffect(() => {
    // Fetch personas
    const fetchPersonas = async () => {
      try {
        const response = await fetch('/api/digital-me/personas', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setPersonas(data.personas || []);
        }
      } catch (error) {
        console.error('Failed to fetch personas:', error);
      }
    };
    fetchPersonas();

    // Get active persona
    const personaId = typeof window !== 'undefined' ? localStorage.getItem('activePersona') : null;
    setActivePersonaId(personaId);

    // Fetch available videos
    const fetchVideos = async () => {
      try {
        const url = personaId ? `/api/broll?personaId=${personaId}` : '/api/broll';
        const response = await fetch(url, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          const realVideos = (data.broll || []).filter(
            (v: BrollVideo) =>
              v.fileUrl &&
              !v.fileUrl.includes('/placeholder/') &&
              !v.fileUrl.includes('example.com') &&
              !v.fileUrl.includes('test.mp4')
          );
          setAvailableVideos(realVideos);
        }
      } catch (error) {
        console.error('Failed to fetch videos:', error);
      }
    };
    fetchVideos();

    // Listen for storage changes (when persona is changed from another page)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'activePersona') {
        setActivePersonaId(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync templateName from template.name when template changes
  useEffect(() => {
    if (template.name && template.name.trim() && template.name.trim() !== templateName.trim()) {
      console.log('Syncing templateName from template.name:', template.name);
      setTemplateName(template.name.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.name]);

  // Auto-select first video when available videos change
  useEffect(() => {
    if (availableVideos.length > 0 && !selectedPreviewVideo) {
      setSelectedPreviewVideo(availableVideos[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableVideos]);

  // Test content for preview (same as test page)
  const getTestContent = (): Record<string, string> => {
    const scriptLines = [
      'First important point about this topic',
      'Second key insight that matters',
      'Third valuable piece of information',
      'Fourth compelling detail to share',
      'Fifth and final takeaway message',
    ];

    return {
      hook: 'This will change everything you know...',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.',
      script: scriptLines.join(' '),
      question: "What if I told you there's a better way?",
      answer:
        'The answer is simpler than you think. It all comes down to understanding the fundamentals and applying them consistently.',
      title: 'Amazing Discovery',
      items: scriptLines.map((line) => `• ${line}`).join('\n'),
      item1: scriptLines[0] || '',
      item2: scriptLines[1] || '',
      item3: scriptLines[2] || '',
      item4: scriptLines[3] || '',
      item5: scriptLines[4] || '',
      caption:
        'Check out this amazing content! Follow for more tips and insights. #content #tips #viral',
      callToAction: 'Try it now!',
      hashtags: '#test #template #content #viral #tips',
    };
  };

  const isJSON = (str: string): boolean => {
    try {
      const parsed = JSON.parse(str);
      return (
        typeof parsed === 'object' && parsed !== null && 'duration' in parsed && 'scenes' in parsed
      );
    } catch {
      return false;
    }
  };

  const handleInputSubmit = async () => {
    if (!naturalLanguageInput.trim()) {
      alert('Please enter a description or JSON template');
      return;
    }

    // Check if input is JSON
    if (isJSON(naturalLanguageInput)) {
      try {
        const jsonTemplate = JSON.parse(naturalLanguageInput);
        console.log('Loading JSON template:', jsonTemplate);
        // Preserve name from template if it exists, otherwise use templateName
        if (jsonTemplate.name && jsonTemplate.name.trim()) {
          setTemplateName(jsonTemplate.name.trim());
          // Ensure name is in template object
          jsonTemplate.name = jsonTemplate.name.trim();
        }
        setTemplate(jsonTemplate);
        setShowNaturalLanguage(false);
        setNaturalLanguageInput('');
        // Template will be auto-saved to localStorage via useEffect
        alert('JSON template loaded and saved locally! Review and adjust as needed.');
      } catch (error) {
        alert('Invalid JSON template. Please check the format.');
        console.error('JSON parse error:', error);
      }
      return;
    }

    // Otherwise, treat as natural language
    if (!activePersonaId) {
      alert('Please select a persona first to generate templates from text');
      return;
    }

    setGeneratingFromText(true);
    try {
      const response = await fetch('/api/templates/from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          description: naturalLanguageInput,
          personaId: activePersonaId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const generatedTemplate = result.template;
        // Preserve name if template has one, otherwise keep current templateName
        if (generatedTemplate.name) {
          setTemplateName(generatedTemplate.name);
        } else if (templateName) {
          generatedTemplate.name = templateName;
        }
        setTemplate(generatedTemplate);
        setShowNaturalLanguage(false);
        setNaturalLanguageInput('');
        alert('Template generated! Review and adjust as needed.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to generate template: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Template generation failed:', error);
      alert('Failed to generate template. Check console for details.');
    } finally {
      setGeneratingFromText(false);
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos((prev) => {
      const newSelection = prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId];

      // Update duration based on selected videos
      if (newSelection.length > 0) {
        const selectedVideoObjects = availableVideos.filter((v) => newSelection.includes(v.id));
        if (selectedVideoObjects.length > 0) {
          // Use average duration of selected videos, rounded to nearest integer
          const avgDuration = Math.round(
            selectedVideoObjects.reduce((sum, v) => sum + v.duration, 0) /
              selectedVideoObjects.length
          );
          setTemplate((prev) => ({ ...prev, duration: Math.max(5, Math.min(60, avgDuration)) }));
        }
      }

      return newSelection;
    });
  };

  const copyJSONTemplate = async () => {
    try {
      const jsonString = JSON.stringify(template, null, 2);

      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonString);
        setJsonCopied(true);
        setTimeout(() => setJsonCopied(false), 2000);
        return;
      }

      // Fallback: Create temporary textarea and select/copy
      const textarea = document.createElement('textarea');
      textarea.value = jsonString;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setJsonCopied(true);
          setTimeout(() => setJsonCopied(false), 2000);
        } else {
          throw new Error('execCommand copy failed');
        }
      } finally {
        document.body.removeChild(textarea);
      }
    } catch (error) {
      console.error('Failed to copy JSON:', error);
      // Show the JSON in an alert as last resort, or provide manual copy option
      const jsonString = JSON.stringify(template, null, 2);
      const textarea = document.createElement('textarea');
      textarea.value = jsonString;
      textarea.style.position = 'fixed';
      textarea.style.left = '50%';
      textarea.style.top = '50%';
      textarea.style.transform = 'translate(-50%, -50%)';
      textarea.style.width = '80%';
      textarea.style.height = '60%';
      textarea.style.zIndex = '9999';
      textarea.style.padding = '20px';
      textarea.style.fontSize = '12px';
      textarea.style.border = '2px solid #000';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      alert('Please copy the JSON from the text box that appeared, then close it.');

      // Remove textarea after a delay or on click outside
      setTimeout(() => {
        if (document.body.contains(textarea)) {
          document.body.removeChild(textarea);
        }
      }, 30000);

      textarea.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.body.contains(textarea)) {
            document.body.removeChild(textarea);
          }
        }, 100);
      });
    }
  };

  const copyBlankTemplateFormat = async () => {
    const blankTemplate = {
      duration: 10,
      textStyle: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2,
        maxWidth: 90,
        background: 'rgba(0, 0, 0, 0.55)',
      },
      scenes: [
        {
          start: 0,
          end: 10,
          text: {
            content: '{{hook}}',
            position: { x: 50, y: 50 },
            style: {
              fontSize: 48,
              fontWeight: 'bold',
              color: '#ffffff',
              stroke: '#000000',
              strokeWidth: 2,
            },
          },
          filters: ['brightness(1.0)', 'contrast(1.0)'],
        },
      ],
    };
    try {
      const jsonString = JSON.stringify(blankTemplate, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy template format:', error);
      alert('Failed to copy template format. Please select and copy manually.');
    }
  };

  const addScene = () => {
    const newScene: VideoScene = {
      start: template.scenes[template.scenes.length - 1]?.end || 0,
      end: template.duration,
      text: {
        content: '{{content}}',
        position: { x: 50, y: 50 },
        style: {
          fontSize: 36,
          fontWeight: 'normal',
          color: '#ffffff',
          stroke: '#000000',
          strokeWidth: 1,
        },
      },
      filters: ['brightness(1.0)', 'contrast(1.0)'],
    };

    setTemplate({
      ...template,
      scenes: [...template.scenes, newScene],
    });
  };

  const updateScene = (index: number, updates: Partial<VideoScene>) => {
    const newScenes = [...template.scenes];
    newScenes[index] = { ...newScenes[index], ...updates };
    setTemplate({ ...template, scenes: newScenes });
  };

  const removeScene = (index: number) => {
    const newScenes = template.scenes.filter((_, i) => i !== index);
    setTemplate({ ...template, scenes: newScenes });
  };

  const clearDraft = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('draftTemplate');
      localStorage.removeItem('draftTemplateName');
      setTemplate({
        name: '',
        duration: 10,
        scenes: [
          {
            start: 0,
            end: 10,
            text: {
              content: '{{hook}}',
              position: { x: 50, y: 50 },
              style: {
                fontSize: 48,
                fontWeight: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeWidth: 2,
              },
            },
            filters: ['brightness(1.0)', 'contrast(1.0)'],
          },
        ],
      });
      setTemplateName('');
      alert('Draft cleared!');
    }
  };

  const saveTemplate = async () => {
    // If there's JSON in the textarea that hasn't been loaded, parse it and use it directly
    let templateToSave = template;
    let nameToUse = (template.name && template.name.trim()) || templateName.trim();

    if (naturalLanguageInput.trim() && isJSON(naturalLanguageInput)) {
      try {
        const jsonTemplate = JSON.parse(naturalLanguageInput);
        console.log('Auto-loading JSON from textarea:', jsonTemplate);
        templateToSave = jsonTemplate;
        // Update state for UI consistency
        if (jsonTemplate.name && jsonTemplate.name.trim()) {
          setTemplateName(jsonTemplate.name.trim());
          jsonTemplate.name = jsonTemplate.name.trim();
        }
        setTemplate(jsonTemplate);
        // Use name from parsed JSON
        nameToUse = (jsonTemplate.name && jsonTemplate.name.trim()) || templateName.trim();
      } catch (error) {
        console.error('Failed to parse JSON from textarea:', error);
        alert('Invalid JSON in textarea. Please fix it or load it first.');
        return;
      }
    }

    console.log('Saving template:', {
      'template.name': templateToSave.name,
      templateName: templateName,
      nameToUse: nameToUse,
    });

    if (!nameToUse) {
      alert('Please enter a template name or ensure your JSON template includes a "name" field');
      return;
    }

    if (!activePersonaId) {
      alert('Please select a persona first. Use the persona switcher at the top of the dashboard.');
      return;
    }

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: nameToUse,
          json: templateToSave,
          personaId: activePersonaId,
          videoIds: selectedVideos, // Store selected videos for reference
        }),
      });

      if (response.ok) {
        // Clear draft from localStorage after successful save
        if (typeof window !== 'undefined') {
          localStorage.removeItem('draftTemplate');
          localStorage.removeItem('draftTemplateName');
        }
        alert('Template saved successfully! Draft cleared from local storage.');
        window.location.href = '/dashboard';
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to save template: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm">
                  ← Back to Dashboard
                </Link>
                <Link
                  href="/dashboard/templates/test"
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  Test Templates →
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">Create Video Template</h1>
              <p className="text-gray-600">Design timing, text positioning, and effects</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-2">
                <label className="text-xs font-medium text-gray-700">Select Persona:</label>
                <Select
                  value={activePersonaId || ''}
                  onValueChange={(value) => {
                    setActivePersonaId(value);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('activePersona', value);
                    }
                    // Refetch videos for new persona
                    const fetchVideos = async () => {
                      try {
                        const url = value ? `/api/broll?personaId=${value}` : '/api/broll';
                        const response = await fetch(url, { credentials: 'include' });
                        if (response.ok) {
                          const data = await response.json();
                          const realVideos = (data.broll || []).filter(
                            (v: BrollVideo) =>
                              v.fileUrl &&
                              !v.fileUrl.includes('/placeholder/') &&
                              !v.fileUrl.includes('example.com') &&
                              !v.fileUrl.includes('test.mp4')
                          );
                          setAvailableVideos(realVideos);
                        }
                      } catch (error) {
                        console.error('Failed to fetch videos:', error);
                      }
                    };
                    fetchVideos();
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {personas.map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{persona.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {persona.niche}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Template Builder */}
          <div className="space-y-6">
            {/* Natural Language or JSON Input */}
            <Card>
              <CardHeader>
                <CardTitle>Create from Description or JSON</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Paste a text description to generate a template, or paste JSON directly
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showNaturalLanguage ? (
                  <Button
                    onClick={() => setShowNaturalLanguage(true)}
                    variant="outline"
                    className="w-full"
                  >
                    ✨ Generate Template from Text or JSON
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2 items-center">
                      <Button
                        variant={inputMode === 'text' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setInputMode('text')}
                      >
                        Text Description
                      </Button>
                      <Button
                        variant={inputMode === 'json' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setInputMode('json')}
                      >
                        JSON Template
                      </Button>
                      {inputMode === 'json' && (
                        <>
                          <Button
                            onClick={copyJSONTemplate}
                            variant="default"
                            size="sm"
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                            title="Copy current template JSON"
                          >
                            {jsonCopied ? (
                              <>
                                <Check className="h-4 w-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copy JSON
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={saveTemplate}
                            variant="default"
                            size="sm"
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                            title="Save template"
                          >
                            Save Template
                          </Button>
                        </>
                      )}
                    </div>
                    <Textarea
                      value={naturalLanguageInput}
                      onChange={(e) => {
                        setNaturalLanguageInput(e.target.value);
                        // Auto-detect JSON
                        if (e.target.value.trim().startsWith('{')) {
                          setInputMode('json');
                        }
                      }}
                      placeholder={
                        inputMode === 'json'
                          ? 'Paste your JSON template here, e.g., {"duration": 15, "scenes": [...]}'
                          : "Describe your template layout, e.g., 'A 15-second video with a bold hook at the top for 3 seconds, then main content in the middle for 12 seconds. White text with black stroke, large font for mobile viewing.'"
                      }
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleInputSubmit}
                        disabled={
                          generatingFromText ||
                          !naturalLanguageInput.trim() ||
                          (inputMode === 'text' && !activePersonaId)
                        }
                        className="flex-1"
                      >
                        {generatingFromText
                          ? 'Generating...'
                          : inputMode === 'json'
                            ? 'Load JSON Template'
                            : 'Generate Template'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowNaturalLanguage(false);
                          setNaturalLanguageInput('');
                          setInputMode('text');
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                    {inputMode === 'text' && !activePersonaId && (
                      <p className="text-sm text-yellow-600">
                        ⚠️ Please select a persona first to generate templates from text
                      </p>
                    )}
                    {inputMode === 'json' && (
                      <p className="text-xs text-muted-foreground">
                        💡 Tip: You can paste JSON templates directly. The system will auto-detect
                        JSON format.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Videos (Optional)</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Choose videos to use with this template. You can select multiple videos.
                </p>
              </CardHeader>
              <CardContent>
                {availableVideos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No videos available. Upload videos first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableVideos.map((video) => (
                      <div
                        key={video.id}
                        onClick={() => toggleVideoSelection(video.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedVideos.includes(video.id)
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{video.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {Math.floor(video.duration)}s
                              </Badge>
                              {video.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {video.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {selectedVideos.includes(video.id) && (
                            <div className="ml-2 text-primary">✓</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedVideos.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Template Info</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setTemplateName(newName);
                      // Update template name when input changes
                      setTemplate((prev) => ({ ...prev, name: newName }));
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Quick Facts, Story Hook"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="30"
                    value={template.duration}
                    onChange={(e) =>
                      setTemplate({ ...template, duration: parseInt(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={saveTemplate}
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-lg"
                >
                  Save Template
                </button>
              </div>
            </div>

            {/* Scenes */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Scenes</h3>
                <button
                  onClick={addScene}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Scene
                </button>
              </div>

              <div className="space-y-4">
                {template.scenes.map((scene, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Scene {index + 1}</h4>
                      <div className="flex space-x-2">
                        {template.scenes.length > 1 && (
                          <button
                            onClick={() => removeScene(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time (s)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max={template.duration}
                          value={scene.start}
                          onChange={(e) =>
                            updateScene(index, { start: parseFloat(e.target.value) })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time (s)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min={scene.start}
                          max={template.duration}
                          value={scene.end}
                          onChange={(e) => updateScene(index, { end: parseFloat(e.target.value) })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Content
                      </label>
                      <input
                        type="text"
                        value={scene.text.content}
                        onChange={(e) =>
                          updateScene(index, {
                            text: { ...scene.text, content: e.target.value },
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="Use {{hook}}, {{content}}, {{question}}, etc."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          X Position (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scene.text.position.x}
                          onChange={(e) =>
                            updateScene(index, {
                              text: {
                                ...scene.text,
                                position: { ...scene.text.position, x: parseInt(e.target.value) },
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Y Position (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scene.text.position.y}
                          onChange={(e) =>
                            updateScene(index, {
                              text: {
                                ...scene.text,
                                position: { ...scene.text.position, y: parseInt(e.target.value) },
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Font Size
                        </label>
                        <input
                          type="number"
                          min="12"
                          max="72"
                          value={scene.text.style.fontSize}
                          onChange={(e) =>
                            updateScene(index, {
                              text: {
                                ...scene.text,
                                style: { ...scene.text.style, fontSize: parseInt(e.target.value) },
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Text Color
                        </label>
                        <input
                          type="color"
                          value={scene.text.style.color}
                          onChange={(e) =>
                            updateScene(index, {
                              text: {
                                ...scene.text,
                                style: { ...scene.text.style, color: e.target.value },
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 h-10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Live Template Preview</h3>

            {/* Video Selection for Preview */}
            {availableVideos.length > 0 && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Preview Video:
                </label>
                <Select
                  value={selectedPreviewVideo?.id || ''}
                  onValueChange={(value) => {
                    const video = availableVideos.find((v) => v.id === value);
                    setSelectedPreviewVideo(video || null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a video for preview" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVideos.map((video) => (
                      <SelectItem key={video.id} value={video.id}>
                        {video.name} ({video.duration}s)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Live Video Preview */}
            {selectedPreviewVideo ? (
              <div className="mb-6">
                <VideoGenerator
                  videoUrl={selectedPreviewVideo.fileUrl}
                  template={template as any}
                  content={getTestContent()}
                />
              </div>
            ) : (
              <div className="bg-black rounded-lg aspect-[9/16] max-w-xs mx-auto mb-6 relative overflow-hidden flex items-center justify-center">
                <div className="text-white text-center p-4">
                  <p className="text-sm mb-2">No video selected</p>
                  <p className="text-xs text-gray-400">
                    {availableVideos.length === 0
                      ? 'Upload videos to see live preview'
                      : 'Select a video above to preview'}
                  </p>
                </div>
              </div>
            )}

            {/* Template Variables */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Available Variables:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{hook}}'}</code>
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{content}}'}</code>
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{question}}'}</code>
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{answer}}'}</code>
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{title}}'}</code>
                <code className="bg-gray-100 px-2 py-1 rounded">{'{{items}}'}</code>
              </div>
            </div>

            {/* Common Templates */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Quick Templates:</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const name = 'Hook + Content';
                    setTemplateName(name);
                    setTemplate({
                      name: name,
                      duration: 10,
                      scenes: [
                        {
                          start: 0,
                          end: 2,
                          text: {
                            content: '{{hook}}',
                            position: { x: 50, y: 20 },
                            style: {
                              fontSize: 48,
                              fontWeight: 'bold',
                              color: '#ffffff',
                              stroke: '#000000',
                              strokeWidth: 2,
                            },
                          },
                          filters: ['brightness(1.2)', 'contrast(1.1)'],
                        },
                        {
                          start: 2,
                          end: 10,
                          text: {
                            content: '{{content}}',
                            position: { x: 50, y: 60 },
                            style: {
                              fontSize: 36,
                              fontWeight: 'normal',
                              color: '#ffffff',
                              stroke: '#000000',
                              strokeWidth: 1,
                            },
                          },
                          filters: ['brightness(1.0)', 'contrast(1.0)'],
                        },
                      ],
                    });
                  }}
                  className="w-full text-left bg-blue-50 hover:bg-blue-100 p-3 rounded-lg transition-colors"
                >
                  <div className="font-medium">Hook + Content</div>
                  <div className="text-sm text-gray-600">Strong hook (2s) + main content (8s)</div>
                </button>

                <button
                  onClick={() => {
                    const name = 'Question + Answer';
                    setTemplateName(name);
                    setTemplate({
                      name: name,
                      duration: 12,
                      scenes: [
                        {
                          start: 0,
                          end: 3,
                          text: {
                            content: '{{question}}',
                            position: { x: 50, y: 30 },
                            style: {
                              fontSize: 42,
                              fontWeight: 'bold',
                              color: '#ffff00',
                              stroke: '#000000',
                              strokeWidth: 2,
                            },
                          },
                          filters: ['brightness(1.1)', 'contrast(1.2)'],
                        },
                        {
                          start: 3,
                          end: 12,
                          text: {
                            content: '{{answer}}',
                            position: { x: 50, y: 70 },
                            style: {
                              fontSize: 38,
                              fontWeight: 'normal',
                              color: '#ffffff',
                              stroke: '#000000',
                              strokeWidth: 1,
                            },
                          },
                          filters: ['brightness(1.0)', 'contrast(1.0)'],
                        },
                      ],
                    });
                  }}
                  className="w-full text-left bg-green-50 hover:bg-green-100 p-3 rounded-lg transition-colors"
                >
                  <div className="font-medium">Question + Answer</div>
                  <div className="text-sm text-gray-600">
                    Intriguing question (3s) + answer (9s)
                  </div>
                </button>

                <button
                  onClick={() => {
                    const name = 'Countdown List';
                    setTemplateName(name);
                    setTemplate({
                      name: name,
                      duration: 15,
                      scenes: [
                        {
                          start: 0,
                          end: 2,
                          text: {
                            content: '{{title}}',
                            position: { x: 50, y: 20 },
                            style: {
                              fontSize: 44,
                              fontWeight: 'bold',
                              color: '#ff6b6b',
                              stroke: '#ffffff',
                              strokeWidth: 2,
                            },
                          },
                          filters: ['brightness(1.2)', 'contrast(1.1)'],
                        },
                        {
                          start: 2,
                          end: 15,
                          text: {
                            content: '{{items}}',
                            position: { x: 50, y: 60 },
                            style: {
                              fontSize: 32,
                              fontWeight: 'normal',
                              color: '#ffffff',
                              stroke: '#000000',
                              strokeWidth: 1,
                            },
                          },
                          filters: ['brightness(1.0)', 'contrast(1.0)'],
                        },
                      ],
                    });
                  }}
                  className="w-full text-left bg-purple-50 hover:bg-purple-100 p-3 rounded-lg transition-colors"
                >
                  <div className="font-medium">Countdown List</div>
                  <div className="text-sm text-gray-600">Title (2s) + numbered items (13s)</div>
                </button>
              </div>
            </div>
          </div>

          {/* JSON Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Template JSON Format</h3>
              <div className="flex gap-2">
                <Button
                  onClick={copyBlankTemplateFormat}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  title="Copy blank template format to use as a starting point"
                >
                  <Copy className="h-4 w-4" />
                  Copy Format
                </Button>
                <Button
                  onClick={copyJSONTemplate}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                  title="Copy current template JSON"
                >
                  {jsonCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Current
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Blank Template Format Example */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-900 mb-2">
                📋 Blank Template Format (Click &quot;Copy Format&quot; above to copy this
                structure):
              </p>
              <pre className="bg-white rounded p-2 text-xs overflow-auto max-h-32 font-mono border border-blue-200">
                {`{
  "duration": 10,
  "textStyle": {
    "fontSize": 48,
    "fontWeight": "bold",
    "color": "#ffffff",
    "stroke": "#000000",
    "strokeWidth": 2,
    "maxWidth": 90,
    "background": "rgba(0, 0, 0, 0.55)"
  },
  "scenes": [
    {
      "start": 0,
      "end": 10,
      "text": {
        "content": "{{hook}}",
        "position": { "x": 50, "y": 50 },
        "style": {
          "fontSize": 48,
          "fontWeight": "bold",
          "color": "#ffffff",
          "stroke": "#000000",
          "strokeWidth": 2
        }
      },
      "filters": ["brightness(1.0)", "contrast(1.0)"]
    }
  ]
}`}
              </pre>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-base font-semibold text-gray-900">Current Template JSON:</p>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={copyJSONTemplate}
                    variant="default"
                    size="lg"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md"
                  >
                    {jsonCopied ? (
                      <>
                        <Check className="h-5 w-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        Copy JSON Template
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={saveTemplate}
                    variant="default"
                    size="lg"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md"
                  >
                    Save Template
                  </Button>
                  <Button
                    onClick={clearDraft}
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2"
                    title="Clear draft template from local storage"
                  >
                    Clear Draft
                  </Button>
                </div>
              </div>
              <div className="relative">
                <pre className="bg-gray-100 rounded-lg p-4 text-sm overflow-auto max-h-96 font-mono border-2 border-gray-300">
                  {JSON.stringify(template, null, 2)}
                </pre>
                {/* Floating copy button on the JSON box */}
                <Button
                  onClick={copyJSONTemplate}
                  variant="default"
                  size="sm"
                  className="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg z-10"
                  title="Copy JSON template"
                >
                  {jsonCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Click &quot;Copy JSON Template&quot; above or the copy icon on the JSON box to
                copy this template, or use &quot;Copy Format&quot; at the top for a blank template
                structure. Paste into the JSON input above to load.
              </p>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">💡 Template Tips:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Position: 0-100% (50 = center)</li>
                <li>• Use variables like {'{{hook}}'} for AI-generated content</li>
                <li>• Scene timing should not overlap</li>
                <li>• Higher contrast/brightness for text readability</li>
                <li>• Test different positions for mobile screens</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
