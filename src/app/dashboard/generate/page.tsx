'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import VideoGenerator from '@/components/VideoGenerator';
import { ArrowLeftIcon, SparklesIcon, PlayIcon } from '@heroicons/react/24/outline';

interface Template {
  id: string;
  name: string;
  json: any;
  performance?: number;
}

interface BrollVideo {
  id: string;
  name: string;
  fileUrl: string;
  category?: string;
  duration: number;
}

export default function GenerateVideo() {
  const searchParams = useSearchParams();
  const videoIdFromUrl = searchParams?.get('videoId');

  const [templates, setTemplates] = useState<Template[]>([]);
  const [brollVideos, setBrollVideos] = useState<BrollVideo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedBroll, setSelectedBroll] = useState<BrollVideo[]>([]);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [activePersonaName, setActivePersonaName] = useState<string | null>(null);
  const [activePersonaThemes, setActivePersonaThemes] = useState<string[]>([]);
  const [activePersonaTones, setActivePersonaTones] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [savingVideo, setSavingVideo] = useState(false);
  const [videoSaved, setVideoSaved] = useState(false);

  const [formData, setFormData] = useState({
    theme: '',
    tone: 'energetic' as
      | 'energetic'
      | 'calm'
      | 'mysterious'
      | 'educational'
      | 'funny'
      | 'inspiring',
    duration: 10,
  });

  // Infer tone from theme
  const inferToneFromTheme = (
    theme: string
  ): 'energetic' | 'calm' | 'mysterious' | 'educational' | 'funny' | 'inspiring' => {
    const themeLower = theme.toLowerCase();

    // Educational/informative themes
    if (
      themeLower.includes('tip') ||
      themeLower.includes('how') ||
      themeLower.includes('guide') ||
      themeLower.includes('learn') ||
      themeLower.includes('tutorial') ||
      themeLower.includes('explain')
    ) {
      return 'educational';
    }

    // Inspiring/motivational themes
    if (
      themeLower.includes('motivat') ||
      themeLower.includes('inspir') ||
      themeLower.includes('success') ||
      themeLower.includes('achieve') ||
      themeLower.includes('dream') ||
      themeLower.includes('goal')
    ) {
      return 'inspiring';
    }

    // Funny/entertaining themes
    if (
      themeLower.includes('funny') ||
      themeLower.includes('humor') ||
      themeLower.includes('joke') ||
      themeLower.includes('meme') ||
      themeLower.includes('comedy') ||
      themeLower.includes('laugh')
    ) {
      return 'funny';
    }

    // Calm/relaxing themes
    if (
      themeLower.includes('calm') ||
      themeLower.includes('peace') ||
      themeLower.includes('relax') ||
      themeLower.includes('meditat') ||
      themeLower.includes('mindful') ||
      themeLower.includes('zen')
    ) {
      return 'calm';
    }

    // Mysterious/intriguing themes
    if (
      themeLower.includes('secret') ||
      themeLower.includes('mystery') ||
      themeLower.includes('hidden') ||
      themeLower.includes('reveal') ||
      themeLower.includes('unknown') ||
      themeLower.includes('surprise')
    ) {
      return 'mysterious';
    }

    // Energetic/active themes (default)
    if (
      themeLower.includes('energetic') ||
      themeLower.includes('active') ||
      themeLower.includes('fast') ||
      themeLower.includes('quick') ||
      themeLower.includes('power') ||
      themeLower.includes('boost')
    ) {
      return 'energetic';
    }

    // Default to energetic for most content
    return 'energetic';
  };

  useEffect(() => {
    // Get active persona from localStorage
    const personaId = typeof window !== 'undefined' ? localStorage.getItem('activePersona') : null;
    setActivePersonaId(personaId);

    // Fetch persona data if available
    if (personaId) {
      fetch(`/api/digital-me/personas/${personaId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.persona) {
            console.log('📌 Persona data:', {
              name: data.persona.name,
              topThemes: data.persona.topThemes,
              preferredTones: data.persona.preferredTones,
            });
            setActivePersonaName(data.persona.name);
            const themes = Array.isArray(data.persona.topThemes) ? data.persona.topThemes : [];
            setActivePersonaThemes(themes);
            console.log('✅ Set themes:', themes.length, themes);
            const tones = Array.isArray(data.persona.preferredTones)
              ? data.persona.preferredTones
              : [];
            setActivePersonaTones(tones);

            // Don't auto-fill theme - let user choose from suggestions
            // This allows them to select any theme from the persona's top themes

            // Auto-set tone from persona's preferred tones if available (but don't override theme-based tone)
            if (
              data.persona.preferredTones &&
              data.persona.preferredTones.length > 0 &&
              !formData.theme
            ) {
              const preferredTone = data.persona.preferredTones[0] as typeof formData.tone;
              if (
                ['energetic', 'calm', 'mysterious', 'educational', 'funny', 'inspiring'].includes(
                  preferredTone
                )
              ) {
                setFormData((prev) => ({ ...prev, tone: preferredTone }));
              }
            }
          }
        })
        .catch(console.error);
    }

    fetchData(personaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoIdFromUrl]);

  const fetchData = async (personaId: string | null) => {
    try {
      // Fetch videos filtered by persona
      const brollUrl = personaId ? `/api/broll?personaId=${personaId}` : '/api/broll';

      // Fetch templates - try with personaId first, then fallback to all templates
      const templatesUrl = personaId ? `/api/templates?personaId=${personaId}` : '/api/templates';
      console.log('Fetching templates from:', templatesUrl, 'for persona:', personaId);

      const [templatesRes, brollRes] = await Promise.all([
        fetch(templatesUrl, { credentials: 'include' }),
        fetch(brollUrl, { credentials: 'include' }),
      ]);

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        console.log('Fetched templates response:', templatesData);
        const fetchedTemplates = templatesData.templates || [];
        console.log('Parsed templates:', fetchedTemplates.length, fetchedTemplates);

        // If no templates found with personaId, try fetching all templates
        if (fetchedTemplates.length === 0 && personaId) {
          console.log('No templates found for persona, trying all templates...');
          const allTemplatesRes = await fetch('/api/templates', { credentials: 'include' });
          if (allTemplatesRes.ok) {
            const allTemplatesData = await allTemplatesRes.json();
            const allTemplates = allTemplatesData.templates || [];
            console.log('All templates:', allTemplates.length, allTemplates);
            setTemplates(allTemplates);
            if (allTemplates.length > 0) {
              const firstTemplate = allTemplates[0];
              setSelectedTemplate(firstTemplate);
              if (firstTemplate.json?.duration) {
                setFormData((prev) => ({ ...prev, duration: firstTemplate.json.duration }));
              }
            } else {
              setSelectedTemplate(null);
            }
          }
        } else {
          setTemplates(fetchedTemplates);
          if (fetchedTemplates.length > 0) {
            const firstTemplate = fetchedTemplates[0];
            setSelectedTemplate(firstTemplate);
            // Set duration from template
            if (firstTemplate.json?.duration) {
              setFormData((prev) => ({ ...prev, duration: firstTemplate.json.duration }));
            }
          } else {
            console.warn('No templates found for persona:', personaId);
            setTemplates([]);
            setSelectedTemplate(null);
          }
        }
      } else {
        const errorData = await templatesRes.json().catch(() => ({}));
        console.error('Failed to fetch templates:', templatesRes.status, errorData);
        // Try fetching all templates as fallback
        try {
          const fallbackRes = await fetch('/api/templates', { credentials: 'include' });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            const fallbackTemplates = fallbackData.templates || [];
            console.log('Fallback templates:', fallbackTemplates.length);
            setTemplates(fallbackTemplates);
            if (fallbackTemplates.length > 0) {
              setSelectedTemplate(fallbackTemplates[0]);
            }
          }
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
          setTemplates([]);
          setSelectedTemplate(null);
        }
      }

      if (brollRes.ok) {
        const brollData = await brollRes.json();
        const realVideos = (brollData.broll || []).filter(
          (v: BrollVideo) =>
            v.fileUrl &&
            !v.fileUrl.includes('/placeholder/') &&
            !v.fileUrl.includes('example.com') &&
            !v.fileUrl.includes('test.mp4')
        );
        setBrollVideos(realVideos);

        // If videoId is in URL, select that video
        if (videoIdFromUrl) {
          const videoFromUrl = realVideos.find((v: BrollVideo) => v.id === videoIdFromUrl);
          if (videoFromUrl) {
            setSelectedBroll([videoFromUrl]);
          } else if (realVideos.length > 0) {
            setSelectedBroll([realVideos[0]]);
          }
        } else if (realVideos.length > 0) {
          setSelectedBroll([realVideos[0]]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async () => {
    if (!selectedTemplate) {
      alert('Please select a template first');
      return;
    }

    if (!activePersonaId) {
      alert('Please select a persona first. Use the persona switcher at the top of the dashboard.');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/generate/text-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          theme: formData.theme,
          tone: formData.tone,
          duration: formData.duration,
          templateId: selectedTemplate.id,
          personaId: activePersonaId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedContent(result.results[0]?.content);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Content generation failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Content generation failed:', error);
      alert('Content generation failed. Check console for details.');
    } finally {
      setGenerating(false);
    }
  };

  const handleVideoComplete = async (videoBlob: Blob) => {
    console.log('🎬 handleVideoComplete called with blob size:', videoBlob.size, 'bytes');

    // Automatically save the generated video
    if (!activePersonaId || !selectedTemplate || !generatedContent) {
      console.warn('❌ Cannot save video: missing required data', {
        hasPersona: !!activePersonaId,
        hasTemplate: !!selectedTemplate,
        hasContent: !!generatedContent,
        personaId: activePersonaId,
        templateId: selectedTemplate?.id,
        contentKeys: generatedContent ? Object.keys(generatedContent) : null,
      });
      alert('Cannot save video: Missing required data. Check console for details.');
      return;
    }

    console.log('💾 Starting video save process...');
    setSavingVideo(true);
    setVideoSaved(false);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(videoBlob);
      });

      const base64Video = await base64Promise;
      console.log('📦 Video converted to base64, length:', base64Video.length);

      // Handle different content structures:
      // - llmService returns: { hook, content (string), caption, tone, hashtags }
      // - digitalMeService returns: { hook, script (array), caption, tone, hashtags, callToAction }
      const contentText =
        generatedContent.content ||
        (Array.isArray(generatedContent.script)
          ? generatedContent.script.join(' ')
          : generatedContent.caption || '');
      console.log('📝 Content text extracted, length:', contentText.length);

      const savePayload = {
        videoBlob: base64Video.substring(0, 100) + '...', // Log first 100 chars
        theme: formData.theme,
        tone: formData.tone,
        duration: formData.duration,
        hook: generatedContent.hook || '',
        content: contentText.substring(0, 100) + '...', // Log first 100 chars
        templateId: selectedTemplate.id,
        brollId: selectedBroll.length > 0 ? selectedBroll[0].id : null,
        personaId: activePersonaId,
      };
      console.log('📤 Sending save request:', {
        ...savePayload,
        videoBlob: '[base64 video]',
        content: '[content text]',
      });

      // Save to database via API
      const response = await fetch('/api/videos/generated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          videoBlob: base64Video,
          theme: formData.theme,
          tone: formData.tone,
          duration: formData.duration,
          hook: generatedContent.hook || '',
          content: contentText,
          templateId: selectedTemplate.id,
          brollId: selectedBroll.length > 0 ? selectedBroll[0].id : null,
          personaId: activePersonaId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Video automatically saved:', result.video);
        setVideoSaved(true);
        // Clear saved status after 5 seconds
        setTimeout(() => setVideoSaved(false), 5000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to save video:', errorData);
        alert(
          `Failed to save video: ${errorData.error || 'Unknown error'}. Check console for details.`
        );
      }
    } catch (error) {
      console.error('❌ Failed to save generated video:', error);
      alert(
        `Failed to save video: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`
      );
    } finally {
      setSavingVideo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors mr-6"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 rounded-lg p-2">
                <SparklesIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Generate Video</h1>
                <p className="text-gray-600">AI content + client-side video generation</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Forms (2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Persona Info */}
            {activePersonaId && activePersonaName && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-900">Using Persona:</p>
                    <p className="text-lg font-semibold text-indigo-700">{activePersonaName}</p>
                  </div>
                  <Link href="/dashboard/personas">
                    <button className="text-sm text-indigo-600 hover:text-indigo-800 underline">
                      Change
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {!activePersonaId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ No persona selected. Please select a persona from the dashboard to generate
                  content in your brand voice.
                </p>
                <Link href="/dashboard/personas">
                  <button className="mt-2 text-sm text-yellow-700 hover:text-yellow-900 underline">
                    Go to Personas →
                  </button>
                </Link>
              </div>
            )}

            {/* Content Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Generate Content</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>

                  {/* Persona Theme Selection */}
                  {activePersonaThemes.length > 0 && (
                    <div className="mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-xs font-medium text-indigo-900 mb-2">
                        📌 Select a theme from {activePersonaName} ({activePersonaThemes.length}{' '}
                        available):
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {activePersonaThemes.map((theme, idx) => {
                          const suggestedTheme = `${theme} content`;
                          const isSelected =
                            formData.theme === suggestedTheme || formData.theme.includes(theme);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  theme: suggestedTheme,
                                  tone: inferToneFromTheme(suggestedTheme),
                                });
                              }}
                              className={`text-xs px-3 py-2 rounded-lg font-medium transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-100 hover:border-indigo-400'
                              }`}
                            >
                              {theme}
                              {isSelected && ' ✓'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <input
                    type="text"
                    value={formData.theme}
                    onChange={(e) => {
                      const newTheme = e.target.value;
                      const inferredTone = inferToneFromTheme(newTheme);
                      setFormData({
                        ...formData,
                        theme: newTheme,
                        tone: inferredTone, // Auto-update tone based on theme
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={
                      activePersonaThemes.length > 0
                        ? `Or type a custom theme (e.g., ${activePersonaThemes[0]} tips)`
                        : 'e.g., morning productivity routine'
                    }
                    list="theme-suggestions"
                  />
                  <datalist id="theme-suggestions">
                    {activePersonaThemes.map((theme, idx) => (
                      <option key={idx} value={`${theme} content`} />
                    ))}
                    {activePersonaThemes.length === 0 && (
                      <>
                        <option value="productivity tips for creators" />
                        <option value="morning routine inspiration" />
                        <option value="quick tutorial guide" />
                      </>
                    )}
                  </datalist>

                  {activePersonaThemes.length > 0 && formData.theme && (
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Tip: Click a theme above to quickly select it, or type your own custom
                      theme
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tone{' '}
                      {formData.theme && (
                        <span className="text-xs text-gray-500">(auto-detected)</span>
                      )}
                    </label>
                    <select
                      value={formData.tone}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {activePersonaTones.length > 0 ? (
                        // Show persona's preferred tones first
                        <>
                          {activePersonaTones
                            .filter((tone) =>
                              [
                                'energetic',
                                'calm',
                                'mysterious',
                                'educational',
                                'funny',
                                'inspiring',
                              ].includes(tone)
                            )
                            .map((tone) => (
                              <option key={tone} value={tone} className="font-semibold">
                                {tone.charAt(0).toUpperCase() + tone.slice(1)} (Recommended)
                              </option>
                            ))}
                          {['energetic', 'calm', 'mysterious', 'educational', 'funny', 'inspiring']
                            .filter((tone) => !activePersonaTones.includes(tone))
                            .map((tone) => (
                              <option key={tone} value={tone}>
                                {tone.charAt(0).toUpperCase() + tone.slice(1)}
                              </option>
                            ))}
                        </>
                      ) : (
                        <>
                          <option value="energetic">Energetic</option>
                          <option value="calm">Calm</option>
                          <option value="educational">Educational</option>
                          <option value="funny">Funny</option>
                          <option value="inspiring">Inspiring</option>
                          <option value="mysterious">Mysterious</option>
                        </>
                      )}
                    </select>
                    {formData.theme && (
                      <p className="text-xs text-gray-500 mt-1">
                        Detected: {inferToneFromTheme(formData.theme)} (change if needed)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration{' '}
                      {selectedTemplate?.json?.duration && (
                        <span className="text-xs text-gray-500">(from template)</span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={selectedTemplate?.json?.duration || formData.duration}
                      onChange={(e) => {
                        const newDuration = parseInt(e.target.value);
                        setFormData({ ...formData, duration: newDuration });
                        // Also update template if selected
                        if (selectedTemplate) {
                          setSelectedTemplate({
                            ...selectedTemplate,
                            json: { ...selectedTemplate.json, duration: newDuration },
                          });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {selectedTemplate?.json?.duration && (
                      <p className="text-xs text-gray-500 mt-1">
                        Template duration: {selectedTemplate.json.duration}s
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={generateContent}
                  disabled={generating || !activePersonaId}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {generating
                    ? 'Generating...'
                    : `Generate Content ${activePersonaName ? `with ${activePersonaName}` : ''}`}
                </button>
              </div>
            </div>

            {/* Generated Content */}
            {generatedContent && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Generated Content</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Hook:</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">{generatedContent.hook}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Content:</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">
                      {generatedContent.content}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Hashtags:</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">
                      {generatedContent.hashtags?.map((tag: string) => `#${tag}`).join(' ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Template & B-roll Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Select Assets</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                  <select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => {
                      const template = templates.find((t) => t.id === e.target.value) || null;
                      setSelectedTemplate(template);
                      // Update duration from template
                      if (template?.json?.duration) {
                        setFormData((prev) => ({ ...prev, duration: template.json.duration }));
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {templates.length === 0 ? (
                      <option value="">No templates available - Create one first</option>
                    ) : (
                      <>
                        <option value="">Select a template...</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} (
                            {template.performance ? `${Math.round(template.performance)}%` : 'New'})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {templates.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ No templates found.{' '}
                      <Link href="/dashboard/templates/new" className="underline">
                        Create a template first
                      </Link>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    B-roll Videos ({selectedBroll.length} selected)
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                    {brollVideos.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No videos available. Upload videos first.
                      </p>
                    ) : (
                      brollVideos.map((broll) => {
                        const isSelected = selectedBroll.some((v) => v.id === broll.id);
                        return (
                          <label
                            key={broll.id}
                            className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 border-2 border-indigo-500'
                                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBroll([...selectedBroll, broll]);
                                } else {
                                  setSelectedBroll(selectedBroll.filter((v) => v.id !== broll.id));
                                }
                              }}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {broll.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {broll.duration}s • {broll.category}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                  {selectedBroll.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Using first selected video for preview. Multiple videos can be used for
                      multi-scene templates.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Video Preview (1/3 width on large screens) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {selectedTemplate && selectedBroll.length > 0 && generatedContent ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Video Preview</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Preview = live canvas • Generated = final saved video
                      </p>
                    </div>
                    {savingVideo && (
                      <span className="text-xs text-blue-600 flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        Saving...
                      </span>
                    )}
                    {videoSaved && (
                      <span className="text-xs text-green-600 flex items-center gap-1 font-semibold">
                        ✓ Saved to library
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    {/* Compact video preview */}
                    <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
                      <VideoGenerator
                        videoUrl={selectedBroll[0].fileUrl}
                        template={selectedTemplate.json}
                        content={(() => {
                          // Extract all content fields from generated content
                          const hook = generatedContent.hook || '';
                          const scriptArray = Array.isArray(generatedContent.script)
                            ? generatedContent.script
                            : [];
                          const scriptText = scriptArray.join(' ');
                          const contentText =
                            generatedContent.content ||
                            scriptText ||
                            generatedContent.caption ||
                            '';
                          const caption = generatedContent.caption || contentText || '';
                          const callToAction = generatedContent.callToAction || '';
                          const hashtags = Array.isArray(generatedContent.hashtags)
                            ? generatedContent.hashtags.join(' ')
                            : '';

                          // Map to all possible template variables
                          return {
                            hook: hook,
                            content: contentText,
                            script: scriptText,
                            caption: caption,
                            callToAction: callToAction,
                            hashtags: hashtags,
                            // Common template patterns
                            question: hook, // Often hooks are questions
                            answer: contentText,
                            title: hook,
                            items: scriptArray.length > 0 ? scriptArray.join('\n• ') : contentText,
                            // For list-style templates
                            item1: scriptArray[0] || '',
                            item2: scriptArray[1] || '',
                            item3: scriptArray[2] || '',
                            item4: scriptArray[3] || '',
                            item5: scriptArray[4] || '',
                          };
                        })()}
                        onComplete={handleVideoComplete}
                      />
                    </div>

                    {/* Selected videos list */}
                    {selectedBroll.length > 1 && (
                      <div className="border-t pt-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Selected Videos ({selectedBroll.length}):
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {selectedBroll.map((video, idx) => (
                            <div
                              key={video.id}
                              className={`text-xs p-2 rounded ${
                                idx === 0
                                  ? 'bg-indigo-50 text-indigo-900 font-medium'
                                  : 'bg-gray-50 text-gray-600'
                              }`}
                            >
                              {idx === 0 && '🎬 '}
                              {video.name} ({video.duration}s)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                  <PlayIcon className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Ready to Generate</h3>
                  <p className="text-xs text-gray-600 mb-3">Complete steps 1-3</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className={selectedTemplate ? 'text-green-600' : ''}>
                      {selectedTemplate ? '✅' : '⏳'} Template:{' '}
                      {selectedTemplate?.name || 'Not selected'}
                    </p>
                    <p className={selectedBroll.length > 0 ? 'text-green-600' : ''}>
                      {selectedBroll.length > 0 ? '✅' : '⏳'} Videos: {selectedBroll.length}{' '}
                      selected
                    </p>
                    <p className={generatedContent ? 'text-green-600' : ''}>
                      {generatedContent ? '✅' : '⏳'} Content:{' '}
                      {generatedContent ? 'Generated' : 'Not generated'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
