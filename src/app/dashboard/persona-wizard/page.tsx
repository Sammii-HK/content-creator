'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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

interface PersonaBlueprint {
  persona_name: string;
  brand_type?: string;
  summary?: string;
  core_identity?: {
    medium?: string;
    materials?: string;
    production?: string;
    philosophy?: string;
  };
  values?: string[];
  aesthetic?: {
    palette?: string;
    style?: string;
    subjects?: string[];
    mood?: string;
  };
  audience?: {
    profile?: string;
    age_range?: string;
    values?: string[];
    location?: string;
  };
  voice?: {
    tone?: string;
    style_rules?: Record<string, unknown>;
    example_phrasing?: string[];
  };
  content_pillars?: Array<{
    name: string;
    focus: string;
  }>;
  content_tone_keywords?: string[];
  platform_adaptations?: Record<string, Record<string, string>>;
  sample_prompts?: string[];
}

interface PromptPack {
  id: string;
  title: string;
  description: string;
  prompt: string;
  tone?: string;
}

const PLATFORM_OPTIONS = ['Instagram', 'TikTok', 'YouTube', 'Threads', 'Pinterest', 'Newsletter', 'Website', 'LinkedIn'];
const STORAGE_KEY = 'ai-persona-wizard-blueprint';

const groupedSurface =
  'rounded-3xl border border-slate-200/80 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/85 shadow-lg shadow-slate-200/40 dark:shadow-none backdrop-blur';

const createEmptyPersona = (): PersonaData => ({
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

const guidedPromptPacks: PromptPack[] = [
  {
    id: 'brand-essence',
    title: 'Brand Essence & Story',
    description: 'Uncover the core story, philosophy, and emotional purpose behind the persona.',
    prompt: `You're a brand strategist helping me define a digital persona. Ask me smart follow-up questions to understand:
- The origin story and purpose of the brand/persona
- The emotional transformation we want the audience to feel
- The philosophy or point of view that guides the work
Keep it conversational, one question at a time, and push deeper for real emotional clarity.`
  },
  {
    id: 'audience-lens',
    title: 'Audience Lens',
    description: 'Clarify who the persona speaks to, what they need, and where they live digitally.',
    prompt: `Help me profile the perfect audience for this persona. Ask about:
- Their lifestyle, values, design taste, and emotional triggers
- The decisions they struggle with and what they crave right now
- Where they spend time online and what inspires or annoys them
Use probing follow-ups to get vivid details I can use in content.`
  },
  {
    id: 'voice-composer',
    title: 'Voice Composer',
    description: 'Craft a precise writing voice, pacing, and stylistic rules.',
    prompt: `Help me document the persona's writing voice. Ask for:
- Tone descriptors with examples of sentence structures
- Rules or boundaries (capitalisation, punctuation, line breaks, rhythm)
- Sample phrases this persona would absolutely say (and wouldn't say)
Ask step-by-step so we can refine until it feels undeniably on-brand.`
  },
  {
    id: 'content-systems',
    title: 'Content Systems',
    description: 'Define pillars, recurring formats, and creative rituals that feel true to the persona.',
    prompt: `Help me architect content systems for this persona. Ask me about:
- 3-5 recurring pillars or themes that feel inherent to this persona
- Signature formats, visuals, or rituals that could become consistent series
- Stories, processes, or philosophies that get the best engagement
Guide me to describe each in rich detail that AI can replicate.`
  },
  {
    id: 'conversion-path',
    title: 'Conversion & Momentum',
    description: 'Map the path from inspiration to action in a way that fits the persona naturally.',
    prompt: `We're designing authentic CTAs and momentum builders. Ask questions to reveal:
- What actions feel aligned for this persona (buying, subscribing, reflecting, sharing)
- How we invite people to stay in the world longer without feeling salesy
- Seasonal or campaign moments where the persona can rally people
Use my answers to outline 3-5 CTA archetypes that sound like this persona.`
  }
];

const samplePersonaBlueprint: PersonaBlueprint = {
  persona_name: 'scape²',
  brand_type: 'wearable art and slow fashion',
  summary:
    'scape² creates black and white wearable art printed on organic cotton garments. Each piece transforms photography into minimalist, conscious fashion and invites people to see the world they know in a new way.',
  core_identity: {
    medium: 'art photography printed on clothing',
    materials: 'organic cotton Stanley and Stella base garments',
    production: 'made to order, slow fashion, locally printed',
    philosophy: "to look at something you've seen a thousand times before and see it differently"
  },
  values: [
    'slow fashion',
    'sustainability',
    'local production',
    'organic materials',
    'ethical craftsmanship',
    'minimalism',
    'artistic integrity'
  ],
  aesthetic: {
    palette: 'black and white only',
    style: 'minimal, bold, reflective',
    subjects: ['flowerscapes', 'naturescapes', 'landscapes', 'urbanscapes', 'skyscapes'],
    mood: 'stillness, depth, perspective, mindfulness'
  },
  audience: {
    profile:
      'design aware consumers, creatives, and conscious buyers who value meaning, simplicity, and authenticity',
    age_range: '20 to 40',
    values: ['sustainability', 'design', 'authenticity', 'craft'],
    location: 'urban, global'
  },
  voice: {
    tone: 'grounded, reflective, minimal, poetic but clear',
    style_rules: {
      capitalisation: 'sentence case only',
      no_em_dashes: true,
      sentence_length: 'short to medium for rhythm',
      line_breaks: 'use double line spacing for pacing and visual calm'
    },
    example_phrasing: [
      'a photograph of the sky becomes a moment you can wear.',
      'each scape² piece is made slowly, printed locally, and created to last.',
      'minimalism is not emptiness, it is space for meaning.',
      'wear what you want to remember.'
    ]
  },
  content_pillars: [
    {
      name: 'Art and storytelling',
      focus: 'explore the meaning or inspiration behind each scape'
    },
    {
      name: 'Process and craft',
      focus: 'show slow fashion, local printing, and ethical production'
    },
    {
      name: 'Visual worlds',
      focus: 'showcase scapes as visual meditations using still, minimal imagery'
    },
    {
      name: 'Sustainability and values',
      focus: 'educate gently on organic cotton, fair production, and conscious creation'
    },
    {
      name: 'Philosophy of seeing',
      focus: 'share reflective thoughts on perspective, stillness, and finding beauty in what is often overlooked'
    }
  ],
  content_tone_keywords: [
    'minimal',
    'slow',
    'intentional',
    'reflective',
    'quiet strength',
    'artistic',
    'ethical',
    'timeless'
  ],
  platform_adaptations: {
    tiktok: {
      hook_style: 'lowercase poetic lines ending positively',
      voice: 'personal, intimate, visual',
      cta: "encourage reflection or emotional connection such as 'if this makes you pause, leave a 🌿'"
    },
    instagram: {
      voice: 'editorial, serene, aesthetic driven',
      focus: 'mood and composition of scapes with captions that read like short reflections'
    },
    threads_or_x: {
      voice: 'clear, contemplative, conversation starting',
      style: 'sentence case, short reflections or behind the art insights'
    }
  },
  sample_prompts: [
    'write an instagram caption about finding beauty in the ordinary through black and white photography',
    'create a tiktok post describing the process of turning a photograph into wearable art, focusing on slow fashion',
    'write a short reflective thread about how perspective changes what we see in nature and art',
    'create a caption introducing the concept of wearable art and why every scape² piece is made to order',
    'write a reflective paragraph about what it means to see something familiar from a new angle'
  ]
};

export default function PersonaWizard() {
  const [step, setStep] = useState(1);
  const [personaData, setPersonaData] = useState<PersonaData>(() => createEmptyPersona());
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [creating, setCreating] = useState(false);
  const [blueprintJSON, setBlueprintJSON] = useState('');
  const [blueprintStatus, setBlueprintStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [activePersonaName, setActivePersonaName] = useState<string | null>(null);
  const [loadingPersonaBlueprint, setLoadingPersonaBlueprint] = useState(false);
  const [savingBlueprint, setSavingBlueprint] = useState(false);

  const flashStatus = useCallback((payload: { type: 'success' | 'error'; message: string }) => {
    setBlueprintStatus(payload);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => setBlueprintStatus(null), 2500);
    }
  }, []);

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
      // Create persona with sample data
      const sampleExamples = [
        {
          theme: personaData.niche,
          tone: personaData.brandVoice || 'authentic',
          hook: `Discover the world of ${personaData.niche}`,
          body: `${personaData.successfulContent.slice(0, 200)}...`,
          caption: `Expert insights on ${personaData.niche}`,
          tags: [personaData.niche.toLowerCase(), 'content', 'expert'],
          engagement: 85.5
        }
      ];

      const response = await fetch('/api/digital-me/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: personaData.name,
          description: personaData.expertise,
          niche: personaData.niche,
          samples: sampleExamples
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to create persona');
      }

      const result = await response.json();
      
      // Set the active persona to the newly created one
      setActivePersonaId(result.persona.id);
      
      alert(`Persona "${personaData.name}" created successfully! You can now configure its blueprint and add more examples.`);
      
      // Move to step 3 to configure the blueprint
      setStep(3);
      
    } catch (error) {
      console.error('Failed to create persona:', error);
      alert(`Failed to create persona: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (content: string, message = 'Copied to clipboard!') => {
    try {
      await navigator.clipboard.writeText(content);
      flashStatus({ type: 'success', message });
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      flashStatus({ type: 'error', message: 'Unable to copy to clipboard' });
    }
  };

  const memoizedBlueprint = useMemo<PersonaBlueprint>(() => {
    const cleanString = (value: string) => value?.trim() || undefined;

    const summaryBlock = cleanString(personaData.expertise);
    const audienceBlock = cleanString(personaData.audience);

    return {
      persona_name: personaData.name,
      brand_type: personaData.niche || undefined,
      summary: summaryBlock,
      core_identity: {
        philosophy: cleanString(personaData.brandVoice),
        production: cleanString(personaData.businessGoals),
      },
      audience: audienceBlock
        ? {
            profile: audienceBlock,
          }
        : undefined,
      content_pillars: personaData.successfulContent
        ? personaData.successfulContent.split('\n').filter(Boolean).map((line, index) => {
            const [name, ...rest] = line.split(':');
            return {
              name: name?.trim() || `Pillar ${index + 1}`,
              focus: rest.join(':').trim() || 'Focus to be detailed',
            };
          })
        : undefined,
      sample_prompts: personaData.challenges
        ? personaData.challenges.split('\n').filter(Boolean)
        : undefined
    };
  }, [personaData]);

  const applyBlueprintToForm = useCallback((incoming: PersonaBlueprint | undefined | null) => {
    if (!incoming || typeof incoming !== 'object') {
      return;
    }

    setPersonaData(prev => {
      const current = { ...createEmptyPersona(), ...prev };

      const expertiseLines = [
        incoming.summary,
        incoming.core_identity?.medium ? `Medium: ${incoming.core_identity.medium}` : '',
        incoming.core_identity?.materials ? `Materials: ${incoming.core_identity.materials}` : '',
        incoming.core_identity?.production ? `Process: ${incoming.core_identity.production}` : '',
        incoming.core_identity?.philosophy ? `Philosophy: ${incoming.core_identity.philosophy}` : ''
      ]
        .filter(Boolean)
        .join('\n');

      const audienceBlock = incoming.audience
        ? [
            incoming.audience.profile,
            incoming.audience.age_range ? `Age: ${incoming.audience.age_range}` : '',
            incoming.audience.values?.length ? `Values: ${incoming.audience.values.join(', ')}` : '',
            incoming.audience.location ? `Location: ${incoming.audience.location}` : ''
          ]
            .filter(Boolean)
            .join('\n')
        : current.audience;

      const contentStyleBlock = [
        incoming.aesthetic?.style,
        incoming.aesthetic?.palette ? `Palette: ${incoming.aesthetic.palette}` : '',
        incoming.aesthetic?.mood ? `Mood: ${incoming.aesthetic.mood}` : '',
        incoming.content_tone_keywords?.length ? `Keywords: ${incoming.content_tone_keywords.join(', ')}` : ''
      ]
        .filter(Boolean)
        .join('\n');

      const brandVoiceBlock = incoming.voice
        ? [
            incoming.voice.tone ? `Tone: ${incoming.voice.tone}` : '',
            incoming.voice.style_rules ? `Style Rules: ${JSON.stringify(incoming.voice.style_rules, null, 2)}` : '',
            incoming.voice.example_phrasing?.length
              ? `Example phrasing:\n- ${incoming.voice.example_phrasing.join('\n- ')}`
              : ''
          ]
            .filter(Boolean)
            .join('\n\n')
        : current.brandVoice;

      const businessGoalsBlock = incoming.values?.length
        ? `Values we must uphold: ${incoming.values.join(', ')}`
        : current.businessGoals;

      const successfulContentBlock = incoming.content_pillars
        ? incoming.content_pillars.map(pillar => `${pillar.name}: ${pillar.focus}`).join('\n')
        : current.successfulContent;

      const challengesBlock = incoming.sample_prompts ? incoming.sample_prompts.join('\n') : current.challenges;

      return {
        ...current,
        name: incoming.persona_name || current.name,
        niche: incoming.brand_type || incoming.core_identity?.medium || current.niche,
        expertise: expertiseLines || current.expertise,
        audience: audienceBlock,
        contentStyle: contentStyleBlock || current.contentStyle,
        businessGoals: businessGoalsBlock,
        brandVoice: brandVoiceBlock,
        platforms: Object.keys(incoming.platform_adaptations || {}),
        successfulContent: successfulContentBlock,
        challenges: challengesBlock
      };
    });
  }, []);

  const applyBlueprint = () => {
    try {
      const parsed = JSON.parse(blueprintJSON) as PersonaBlueprint;
      applyBlueprintToForm(parsed);
      flashStatus({
        type: 'success',
        message: 'Persona blueprint imported and synced with the wizard.'
      });
    } catch (error) {
      console.error('Blueprint parse error:', error);
      flashStatus({
        type: 'error',
        message: 'Unable to parse JSON. Please validate the syntax and try again.'
      });
    }
  };

  const downloadBlueprint = () => {
    try {
      const parsed = JSON.parse(blueprintJSON || JSON.stringify(memoizedBlueprint, null, 2));
      const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${parsed.persona_name || 'persona-blueprint'}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      setBlueprintStatus({ type: 'success', message: 'Blueprint downloaded as JSON.' });
    } catch (error) {
      console.error('Blueprint download error:', error);
      setBlueprintStatus({ type: 'error', message: 'Blueprint must be valid JSON before download.' });
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedPersona = window.localStorage.getItem('activePersona');
    if (savedPersona) {
      setActivePersonaId(savedPersona);
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setBlueprintJSON(stored);
      try {
        const storedBlueprint = JSON.parse(stored) as PersonaBlueprint;
        applyBlueprintToForm(storedBlueprint);
      } catch (error) {
        console.warn('Stored persona blueprint is invalid JSON', error);
      }
    }
  }, [applyBlueprintToForm]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!blueprintJSON) return;
    window.localStorage.setItem(STORAGE_KEY, blueprintJSON);
  }, [blueprintJSON]);

  const loadPersonaBlueprint = useCallback(
    async (personaId: string) => {
      setLoadingPersonaBlueprint(true);
      try {
        const response = await fetch(`/api/digital-me/personas/${personaId}/blueprint`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        });

        if (!response.ok) {
          if (response.status === 404) {
            flashStatus({ type: 'error', message: 'Persona not found. Please refresh personas.' });
          } else {
            flashStatus({ type: 'error', message: 'Failed to load persona blueprint.' });
          }
          return;
        }

        const data = await response.json();
        const persona = data.persona;
        setActivePersonaName(persona?.name ?? null);

        const blueprintPayload = persona?.blueprint;

        if (blueprintPayload) {
          const pretty = JSON.stringify(blueprintPayload, null, 2);
          setBlueprintJSON(pretty);

          if (typeof blueprintPayload === 'object' && !Array.isArray(blueprintPayload)) {
            applyBlueprintToForm(blueprintPayload as PersonaBlueprint);
          }

          flashStatus({
            type: 'success',
            message: `Loaded ${persona?.name ?? 'persona'} blueprint.`
          });
        } else {
          setBlueprintJSON('');
          setPersonaData(createEmptyPersona());
          setGeneratedPrompt('');
          flashStatus({
            type: 'success',
            message: `${persona?.name ?? 'This persona'} has no saved blueprint yet.`
          });
        }
      } catch (error) {
        console.error('Failed to load persona blueprint:', error);
        flashStatus({ type: 'error', message: 'Unable to load persona blueprint.' });
      } finally {
        setLoadingPersonaBlueprint(false);
      }
    },
    [applyBlueprintToForm, flashStatus]
  );

  useEffect(() => {
    if (!activePersonaId) {
      setActivePersonaName(null);
      return;
    }
    loadPersonaBlueprint(activePersonaId);
  }, [activePersonaId, loadPersonaBlueprint]);

  const memoizedSummary = useMemo(() => {
    const fragments = [
      personaData.name ? `${personaData.name} is` : '',
      personaData.niche,
      personaData.audience ? `for ${personaData.audience.split('\n')[0]}` : '',
      personaData.brandVoice ? `with a voice that is ${personaData.brandVoice.split('\n')[0]}` : ''
    ]
      .filter(Boolean)
      .join(' ');

    return fragments || 'A digital persona we are crafting.';
  }, [personaData.name, personaData.niche, personaData.audience, personaData.brandVoice]);

  const contextualPrompts = useMemo(() => {
    const blueprintString = JSON.stringify(memoizedBlueprint, null, 2);
    if (!blueprintString.trim() || blueprintString === '{}') {
      return [];
    }

    return [
      {
        id: 'context-bridge',
        title: 'Context Bridge Prompt',
        description: 'Load this persona into a fresh chat before asking for content.',
        prompt: `You are helping me craft content for a persona. Memorise this JSON blueprint and acknowledge once you fully understand it.\n\n${blueprintString}\n\nWhen you understand, reply with: "ready for prompts as ${memoizedSummary}" and wait for my requests.`
      },
      {
        id: 'intake-interview',
        title: 'Persona Intake Interview',
        description: 'Gather any missing details, referencing the current blueprint.',
        prompt: `Review the following persona blueprint and then ask me focused questions to fill gaps. Prioritise tone, emotional triggers, and content rituals we haven't detailed.\n\n${blueprintString}\n\nAsk one question at a time, referencing specifics so it feels collaborative.`
      },
      {
        id: 'content-drafting',
        title: 'Content Drafting Companion',
        description: 'Give the persona to another chat and request new content instantly.',
        prompt: `You are writing as ${memoizedSummary}\n\nPersona blueprint:\n${blueprintString}\n\nWhen I give you a brief, respond in this exact persona voice. Offer 3 variants at different energy levels (soft / balanced / bold) unless I specify otherwise.`
      }
    ];
  }, [memoizedBlueprint, memoizedSummary]);

  const glassCard = groupedSurface;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    alert('ChatGPT prompt copied to clipboard!');
  };

  const handleSaveBlueprint = useCallback(async () => {
    if (!activePersonaId) {
      flashStatus({ type: 'error', message: 'Select a persona using the switcher before saving.' });
      return;
    }

    try {
      setSavingBlueprint(true);

      let parsedBlueprint: PersonaBlueprint;

      if (blueprintJSON.trim()) {
        try {
          parsedBlueprint = JSON.parse(blueprintJSON) as PersonaBlueprint;
        } catch (error) {
          throw new Error('Blueprint JSON is invalid. Please fix the syntax before saving.');
        }
      } else {
        parsedBlueprint = memoizedBlueprint;
      }

      const response = await fetch(`/api/digital-me/personas/${activePersonaId}/blueprint`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprint: parsedBlueprint,
          guidancePrompts: contextualPrompts
        })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || 'Failed to save persona blueprint.');
      }

      const payload = await response.json();
      setActivePersonaName(payload.persona?.name ?? activePersonaName);
      flashStatus({ type: 'success', message: 'Persona blueprint saved.' });
    } catch (error) {
      console.error('Failed to save persona blueprint:', error);
      flashStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to save blueprint.' });
    } finally {
      setSavingBlueprint(false);
    }
  }, [activePersonaId, activePersonaName, blueprintJSON, contextualPrompts, flashStatus, memoizedBlueprint]);

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#10172a] dark:via-[#0f172a] dark:to-[#020617] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard/personas">
            <Button variant="outline" className="rounded-full border-slate-200 bg-white/80 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700">← Back to Personas</Button>
          </Link>
          <div className="text-right">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">🧙‍♂️ AI Persona Blueprint Wizard</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Design personas you can reuse across AI tools, with JSON blueprints, guided prompts, and export options.
            </p>
          </div>
        </div>

        {/* Blueprint Ingest */}
        <Card className={cn(glassCard, 'p-0')}>
          <CardHeader className="border-b border-white/60 dark:border-slate-800/60">
            <CardTitle className="flex items-center justify-between text-lg text-slate-900 dark:text-slate-50">
              <span>📦 Persona Blueprint Workspace</span>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  onClick={() => {
                    const pretty = JSON.stringify(samplePersonaBlueprint, null, 2);
                    setBlueprintJSON(pretty);
                    applyBlueprintToForm(samplePersonaBlueprint);
                    flashStatus({
                      type: 'success',
                      message: 'Loaded scape² sample blueprint into the workspace.'
                    });
                  }}
                >
                  Load Example
                </Button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={applyBlueprint}>
                  Import JSON
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={savingBlueprint}
                  className="rounded-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100"
                  onClick={handleSaveBlueprint}
                >
                  {savingBlueprint ? 'Saving…' : activePersonaId ? 'Save to Persona' : 'Select Persona'}
                </Button>
                <Button variant="outline" size="sm" className="rounded-full border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={downloadBlueprint}>
                  Download JSON
                </Button>
              </div>
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Paste a persona blueprint (like the example you shared) to override the wizard, or edit inline and export when you&apos;re happy.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {activePersonaId ? (
                <>
                  <span className="text-slate-600 dark:text-slate-300">
                    Editing for persona:{' '}
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {activePersonaName || 'Loading…'}
                    </span>
                  </span>
                  {loadingPersonaBlueprint ? (
                    <span className="text-slate-500 dark:text-slate-400 animate-pulse">Refreshing persona data…</span>
                  ) : (
                    <Badge variant="secondary" className="rounded-full bg-slate-100/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-200">
                      Synced with account persona
                    </Badge>
                  )}
                </>
              ) : (
                <span className="w-full rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200 px-4 py-2">
                  No persona selected. Use the persona switcher at the top of the dashboard to link this wizard to an account persona.
                </span>
              )}
            </div>
            <Textarea
              value={blueprintJSON}
              onChange={(e) => setBlueprintJSON(e.target.value)}
              placeholder="Paste or compose your persona blueprint JSON here..."
              className="min-h-[280px] font-mono text-xs md:text-sm leading-relaxed bg-white dark:bg-[#0b1220] text-slate-900 dark:text-slate-100 border-slate-200/70 dark:border-slate-700/70 rounded-2xl shadow-inner"
            />
            {blueprintStatus && (
              <div
                className={cn(
                  'rounded-xl px-4 py-3 text-sm',
                  blueprintStatus.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/40'
                    : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-500/40'
                )}
              >
                {blueprintStatus.message}
              </div>
            )}
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Badge variant="secondary" className="rounded-full px-3 py-1 bg-slate-100/80 dark:bg-slate-800/80">
                Autosaves to browser
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1 bg-slate-100/80 dark:bg-slate-800/80">
                Import to populate the wizard instantly
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <div className="rounded-3xl border border-white/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur p-4 shadow-lg">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Step {step} of {totalSteps}</span>
            <div className="flex-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-slate-900 dark:bg-slate-200 rounded-full h-2 transition-all"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
            <Badge variant="outline" className="rounded-full border-slate-300/70 dark:border-slate-700/60 px-3 py-1 text-xs text-slate-600 dark:text-slate-300">
              Guided wizard + JSON blueprint mode
            </Badge>
          </div>
        </div>

        <Card className={cn(glassCard, 'overflow-hidden')}>
          <CardHeader className="bg-white/80 dark:bg-slate-900/75 border-b border-white/60 dark:border-slate-800/60">
            <CardTitle className="text-xl text-slate-900 dark:text-slate-50">
              {step === 1 && '🎯 Basic Information'}
              {step === 2 && '👥 Audience & Content'}
              {step === 3 && '🎨 Style & Voice'}
              {step === 4 && '📊 Performance & Goals'}
              {step === 5 && '🤖 Generate ChatGPT Prompt'}
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-300">
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
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-200">Persona Name</Label>
                  <Input
                    id="name"
                    value={personaData.name}
                    onChange={(e) => updatePersonaData('name', e.target.value)}
                    placeholder="e.g., scape², Minimal Storyteller, Conscious Futurist"
                    className="rounded-2xl border-slate-200/70 dark:border-slate-700 bg-white/90 text-slate-900 dark:text-slate-100 dark:bg-[#0b1220]"
                  />
                </div>
                <div>
                  <Label htmlFor="niche" className="text-sm font-medium text-slate-700 dark:text-slate-200">Content Niche / Brand Type</Label>
                  <Input
                    id="niche"
                    value={personaData.niche}
                    onChange={(e) => updatePersonaData('niche', e.target.value)}
                    placeholder="e.g., wearable art and slow fashion, regenerative beauty studio"
                    className="rounded-2xl border-slate-200/70 dark:border-slate-700 bg-white/90 text-slate-900 dark:text-slate-100 dark:bg-[#0b1220]"
                  />
                </div>
                <div>
                  <Label htmlFor="expertise" className="text-sm font-medium text-slate-700 dark:text-slate-200">Your Expertise</Label>
                  <Textarea
                    id="expertise"
                    value={personaData.expertise}
                    onChange={(e) => updatePersonaData('expertise', e.target.value)}
                    placeholder="What are you an expert in? What unique knowledge or experience do you bring?"
                    className="h-32 rounded-2xl border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-[#0b1220] text-slate-900 dark:text-slate-100 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Audience & Platforms */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="audience" className="text-sm font-medium text-slate-700 dark:text-slate-200">Target Audience</Label>
                  <Textarea
                    id="audience"
                    value={personaData.audience}
                    onChange={(e) => updatePersonaData('audience', e.target.value)}
                    placeholder="Who do you create content for? Demographics, interests, pain points, goals..."
                    className="h-32 rounded-2xl border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-[#0b1220] text-slate-900 dark:text-slate-100 leading-relaxed"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Primary Platforms</Label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORM_OPTIONS.map((platform) => {
                      const isActive = personaData.platforms.includes(platform);
                      return (
                        <Button
                          key={platform}
                          type="button"
                          variant={isActive ? 'default' : 'outline'}
                          className={cn(
                            'rounded-full px-4 py-2 text-sm transition-all',
                            isActive
                              ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100'
                              : 'border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-transparent hover:border-slate-300 dark:hover:border-slate-500'
                          )}
                          onClick={() => {
                            const platforms = isActive
                              ? personaData.platforms.filter(p => p !== platform)
                              : [...personaData.platforms, platform];
                            updatePersonaData('platforms', platforms);
                          }}
                        >
                          {platform}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label htmlFor="contentStyle" className="text-sm font-medium text-slate-700 dark:text-slate-200">Content Style</Label>
                  <Textarea
                    id="contentStyle"
                    value={personaData.contentStyle}
                    onChange={(e) => updatePersonaData('contentStyle', e.target.value)}
                    placeholder="How do you create content? Educational, entertaining, inspirational? What formats work best?"
                    className="h-32 rounded-2xl border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-[#0b1220] text-slate-900 dark:text-slate-100 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Voice & Style */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="brandVoice" className="text-sm font-medium text-slate-700 dark:text-slate-200">Brand Voice & Personality</Label>
                  <Textarea
                    id="brandVoice"
                    value={personaData.brandVoice}
                    onChange={(e) => updatePersonaData('brandVoice', e.target.value)}
                    placeholder="How do you communicate? Friendly, professional, casual, inspiring? What's your personality like in content?"
                    className="h-36 rounded-2xl border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-[#0b1220] text-slate-900 dark:text-slate-100 leading-relaxed"
                  />
                </div>
                <div>
                  <Label htmlFor="businessGoals" className="text-sm font-medium text-slate-700 dark:text-slate-200">Business Goals</Label>
                  <Textarea
                    id="businessGoals"
                    value={personaData.businessGoals}
                    onChange={(e) => updatePersonaData('businessGoals', e.target.value)}
                    placeholder="What are you trying to achieve? Brand awareness, product sales, community building, education?"
                    className="h-32 rounded-2xl border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-[#0b1220] text-slate-900 dark:text-slate-100 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Performance & Challenges */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="successfulContent" className="text-sm font-medium text-slate-700 dark:text-slate-200">Most Successful Content</Label>
                  <Textarea
                    id="successfulContent"
                    value={personaData.successfulContent}
                    onChange={(e) => updatePersonaData('successfulContent', e.target.value)}
                    placeholder="Describe your best-performing posts. What worked? What got the most engagement?"
                    className="h-36 rounded-2xl border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-[#0b1220] text-slate-900 dark:text-slate-100 leading-relaxed"
                  />
                </div>
                <div>
                  <Label htmlFor="challenges" className="text-sm font-medium text-slate-700 dark:text-slate-200">Current Challenges / Prompts to Collect</Label>
                  <Textarea
                    id="challenges"
                    value={personaData.challenges}
                    onChange={(e) => updatePersonaData('challenges', e.target.value)}
                    placeholder="What struggles do you have with content creation? What would you like to improve? Or list the prompts you ask your persona."
                    className="h-32 rounded-2xl border-slate-200/70 dark:border-slate-700 bg-white/90 dark:bg-[#0b1220] text-slate-900 dark:text-slate-100 leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Generated Prompt */}
            {step === 5 && (
              <div className="space-y-4">
                {!generatedPrompt && (
                  <div className="text-center py-10">
                    <Button onClick={generateChatGPTPrompt} size="lg" className="rounded-full px-8 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100">
                      🤖 Generate ChatGPT Prompt
                    </Button>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">
                      Create a comprehensive prompt with all your context
                    </p>
                  </div>
                )}

                {generatedPrompt && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">Your ChatGPT Persona Prompt</Label>
                        <Button onClick={copyToClipboard} variant="outline" size="sm" className="rounded-full">
                          📋 Copy to Clipboard
                        </Button>
                      </div>
                      <Textarea
                        value={generatedPrompt}
                        readOnly
                        className="h-96 font-mono text-sm rounded-2xl border-slate-200/70 dark:border-slate-700 bg-white dark:bg-[#0b1220] text-slate-900 dark:text-slate-100 leading-relaxed"
                      />
                    </div>
                    
                    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/60 bg-slate-100/60 dark:bg-slate-950/60 p-4">
                      <h4 className="font-medium text-slate-700 dark:text-slate-200 mb-2">🚀 How to Use This Prompt:</h4>
                      <ol className="text-sm space-y-1 list-decimal list-inside text-slate-600 dark:text-slate-300">
                        <li>Copy the prompt above</li>
                        <li>Paste it into ChatGPT (GPT-4 recommended)</li>
                        <li>Get detailed persona insights and guidelines</li>
                        <li>Come back and paste ChatGPT&apos;s response to train your AI persona</li>
                        <li>Your AI will learn to create content in this authentic voice</li>
                      </ol>
                    </div>

                    <div className="flex space-x-3">
                      <Button onClick={createPersona} disabled={creating} className="flex-1 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900">
                        {creating ? 'Creating Persona...' : '✨ Create AI Persona'}
                      </Button>
                      <Button onClick={() => setGeneratedPrompt('')} variant="outline" className="rounded-2xl">
                        🔄 Regenerate Prompt
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button 
                onClick={prevStep} 
                variant="outline" 
                disabled={step === 1}
                className="rounded-full"
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
                  className="rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900"
                >
                  Next →
                </Button>
              ) : (
                <Badge variant="secondary" className="rounded-full px-4 py-2 text-slate-600 dark:text-slate-300">Ready to Generate</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        {step > 1 && (
          <Card className={cn(glassCard, 'mt-6')}>
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 dark:text-slate-50">📋 Persona Preview</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p><span className="font-semibold text-slate-900 dark:text-slate-100">Name:</span> {personaData.name || 'Not set'}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-slate-100">Niche:</span> {personaData.niche || 'Not set'}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-slate-100">Platforms:</span> {personaData.platforms.join(', ') || 'None selected'}</p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-semibold text-slate-900 dark:text-slate-100">Audience:</span> {personaData.audience ? `${personaData.audience.slice(0, 120)}${personaData.audience.length > 120 ? '…' : ''}` : 'Not set'}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-slate-100">Style:</span> {personaData.contentStyle ? `${personaData.contentStyle.slice(0, 120)}${personaData.contentStyle.length > 120 ? '…' : ''}` : 'Not set'}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-slate-100">Voice:</span> {personaData.brandVoice ? `${personaData.brandVoice.slice(0, 120)}${personaData.brandVoice.length > 120 ? '…' : ''}` : 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Context Bridge Prompts */}
        {contextualPrompts.length > 0 && (
          <Card className={cn(glassCard, 'mt-6')}>
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 dark:text-slate-50">🧵 Context Bridge Prompts</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Drop these straight into a separate GPT chat to load the persona, keep context, or run deeper interviews. Each one copies the current blueprint.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {contextualPrompts.map((prompt) => (
                <div key={prompt.id} className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/80 dark:bg-[#0f172a] p-4 flex flex-col gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{prompt.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{prompt.description}</p>
                  </div>
                  <Button
                    variant="secondary"
                    className="rounded-full bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                    onClick={() => handleCopy(prompt.prompt, `${prompt.title} copied`)}
                  >
                    Copy Prompt
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Guided Prompt Packs */}
        <Card className={cn(glassCard, 'mt-6')}>
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 dark:text-slate-50">🧩 Guided Question Prompts</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Drop these prompts into a separate GPT chat to gather richer inputs. Each bundle keeps context and asks smart follow-ups.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {guidedPromptPacks.map((pack) => (
              <div key={pack.id} className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/85 dark:bg-[#0f172a] p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100">{pack.title}</h4>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">
                    {pack.description}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="mt-4 rounded-full bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                  onClick={() => handleCopy(pack.prompt, `${pack.title} prompt copied`)}
                >
                  Copy Prompt
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className={cn(glassCard, 'mt-6 mb-10')}>
          <CardHeader>
            <CardTitle className="text-sm text-slate-900 dark:text-slate-50">💡 Tips for Better Personas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/85 dark:bg-[#0f172a] p-4">
                <h4 className="font-medium mb-1 text-slate-800 dark:text-slate-100">🎯 Be Specific</h4>
                <p>The more specific you are, the better your AI persona will be.</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/85 dark:bg-[#0f172a] p-4">
                <h4 className="font-medium mb-1 text-slate-800 dark:text-slate-100">📈 Include Performance Data</h4>
                <p>Mention what content performs well and why.</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/85 dark:bg-[#0f172a] p-4">
                <h4 className="font-medium mb-1 text-slate-800 dark:text-slate-100">🗣️ Define Your Voice</h4>
                <p>Describe how you communicate and connect with your audience.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
