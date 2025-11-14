'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const PLATFORM_OPTIONS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Threads',
  'Pinterest',
  'Newsletter',
  'Website',
  'LinkedIn',
];
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
  challenges: '',
});

const samplePersonaBlueprint: PersonaBlueprint = {
  persona_name: 'scape²',
  brand_type: 'wearable art and slow fashion',
  summary:
    'scape² creates black and white wearable art printed on organic cotton garments. Each piece transforms photography into minimalist, conscious fashion and invites people to see the world they know in a new way.',
  core_identity: {
    medium: 'art photography printed on clothing',
    materials: 'organic cotton Stanley and Stella base garments',
    production: 'made to order, slow fashion, locally printed',
    philosophy: "to look at something you've seen a thousand times before and see it differently",
  },
  values: [
    'slow fashion',
    'sustainability',
    'local production',
    'organic materials',
    'ethical craftsmanship',
    'minimalism',
    'artistic integrity',
  ],
  aesthetic: {
    palette: 'black and white only',
    style: 'minimal, bold, reflective',
    subjects: ['flowerscapes', 'naturescapes', 'landscapes', 'urbanscapes', 'skyscapes'],
    mood: 'stillness, depth, perspective, mindfulness',
  },
  audience: {
    profile:
      'design aware consumers, creatives, and conscious buyers who value meaning, simplicity, and authenticity',
    age_range: '20 to 40',
    values: ['sustainability', 'design', 'authenticity', 'craft'],
    location: 'urban, global',
  },
  voice: {
    tone: 'grounded, reflective, minimal, poetic but clear',
    style_rules: {
      capitalisation: 'sentence case only',
      no_em_dashes: true,
      sentence_length: 'short to medium for rhythm',
      line_breaks: 'use double line spacing for pacing and visual calm',
    },
    example_phrasing: [
      'a photograph of the sky becomes a moment you can wear.',
      'each scape² piece is made slowly, printed locally, and created to last.',
      'minimalism is not emptiness, it is space for meaning.',
      'wear what you want to remember.',
    ],
  },
  content_pillars: [
    {
      name: 'Art and storytelling',
      focus: 'explore the meaning or inspiration behind each scape',
    },
    {
      name: 'Process and craft',
      focus: 'show slow fashion, local printing, and ethical production',
    },
    {
      name: 'Visual worlds',
      focus: 'showcase scapes as visual meditations using still, minimal imagery',
    },
    {
      name: 'Sustainability and values',
      focus: 'educate gently on organic cotton, fair production, and conscious creation',
    },
    {
      name: 'Philosophy of seeing',
      focus:
        'share reflective thoughts on perspective, stillness, and finding beauty in what is often overlooked',
    },
  ],
  content_tone_keywords: [
    'minimal',
    'slow',
    'intentional',
    'reflective',
    'quiet strength',
    'artistic',
    'ethical',
    'timeless',
  ],
  platform_adaptations: {
    tiktok: {
      hook_style: 'lowercase poetic lines ending positively',
      voice: 'personal, intimate, visual',
      cta: "encourage reflection or emotional connection such as 'if this makes you pause, leave a 🌿'",
    },
    instagram: {
      voice: 'editorial, serene, aesthetic driven',
      focus: 'mood and composition of scapes with captions that read like short reflections',
    },
    threads_or_x: {
      voice: 'clear, contemplative, conversation starting',
      style: 'sentence case, short reflections or behind the art insights',
    },
  },
  sample_prompts: [
    'write an instagram caption about finding beauty in the ordinary through black and white photography',
    'create a tiktok post describing the process of turning a photograph into wearable art, focusing on slow fashion',
    'write a short reflective thread about how perspective changes what we see in nature and art',
    'create a caption introducing the concept of wearable art and why every scape² piece is made to order',
    'write a reflective paragraph about what it means to see something familiar from a new angle',
  ],
};

export default function PersonaWizard() {
  const [step, setStep] = useState(1);
  const [personaData, setPersonaData] = useState<PersonaData>(() => createEmptyPersona());
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [creating, setCreating] = useState(false);
  const [blueprintJSON, setBlueprintJSON] = useState('');
  const [blueprintStatus, setBlueprintStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [activePersonaName, setActivePersonaName] = useState<string | null>(null);
  const [loadingPersonaBlueprint, setLoadingPersonaBlueprint] = useState(false);
  const [savingBlueprint, setSavingBlueprint] = useState(false);
  const [chatgptResponse, setChatgptResponse] = useState('');
  const [savingResponse, setSavingResponse] = useState(false);

  const flashStatus = useCallback((payload: { type: 'success' | 'error'; message: string }) => {
    setBlueprintStatus(payload);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => setBlueprintStatus(null), 2500);
    }
  }, []);

  const totalSteps = 5;

  const updatePersonaData = (field: keyof PersonaData, value: string | string[]) => {
    setPersonaData((prev) => ({ ...prev, [field]: value }));
  };

  const generateComprehensivePrompt = () => {
    const contextParts = [];

    if (personaData.name) contextParts.push(`**Persona Name:** ${personaData.name}`);
    if (personaData.niche) contextParts.push(`**Content Niche/Brand Type:** ${personaData.niche}`);
    if (personaData.expertise) contextParts.push(`**Expertise:** ${personaData.expertise}`);
    if (personaData.audience) contextParts.push(`**Target Audience:** ${personaData.audience}`);
    if (personaData.businessGoals)
      contextParts.push(`**Business Goals:** ${personaData.businessGoals}`);
    if (personaData.contentStyle)
      contextParts.push(`**Content Style:** ${personaData.contentStyle}`);
    if (personaData.brandVoice) contextParts.push(`**Brand Voice:** ${personaData.brandVoice}`);
    if (personaData.platforms.length > 0)
      contextParts.push(`**Platforms:** ${personaData.platforms.join(', ')}`);
    if (personaData.successfulContent)
      contextParts.push(`**Most Successful Content:** ${personaData.successfulContent}`);
    if (personaData.challenges)
      contextParts.push(`**Current Challenges:** ${personaData.challenges}`);

    const prompt = `# Digital Persona Creation for AI Content System

## What We're Trying to Achieve

I'm building an AI-powered content creation system that needs to generate authentic, on-brand content automatically. To do this, I need to create a detailed "persona blueprint" that captures everything about my brand voice, audience, content style, and communication approach.

The goal is to train an AI system that can:
- Write content in my exact voice and style
- Adapt tone for different platforms (${personaData.platforms.length > 0 ? personaData.platforms.join(', ') : 'Instagram, TikTok, YouTube, Threads, etc.'})
- Create content that feels authentic and true to my brand
- Generate hooks, captions, CTAs, and content prompts that match my style
- Understand my audience and speak directly to them

## My Context & Background

${contextParts.length > 0 ? contextParts.join('\n') : '*No context provided yet - please fill in the form fields above*'}

## Your Task: Help Me Build This Persona

Please ask me thoughtful questions and guide me through answering ALL of the following areas. I'll provide my answers, and you'll help me refine them into a comprehensive persona blueprint:

### 1. Brand Essence & Story
Ask me about:
- The origin story and purpose of this brand/persona
- The emotional transformation we want the audience to feel
- The philosophy or point of view that guides the work
- The core values that define us

### 2. Audience Profile
Help me clarify:
- Who is the perfect audience? (lifestyle, values, design taste, emotional triggers)
- What decisions do they struggle with and what do they crave right now?
- Where do they spend time online and what inspires or annoys them?
- Age range, location, and values they hold

### 3. Voice & Communication Style
Guide me to define:
- How this persona writes and communicates (tone descriptors with examples)
- Style rules (capitalization, punctuation, line breaks, rhythm, sentence length)
- Sample phrases this persona would absolutely say (and wouldn't say)
- How the voice adapts for different content types

### 4. Content Systems & Pillars
Help me identify:
- 3-5 recurring content pillars or themes that feel inherent to this persona
- Signature formats, visuals, or rituals that could become consistent series
- Stories, processes, or philosophies that get the best engagement
- Content tone keywords we should use

### 5. Platform Adaptation
Work with me on:
- How the voice adapts for each platform (${personaData.platforms.length > 0 ? personaData.platforms.join(', ') : 'Instagram, TikTok, YouTube, Threads, etc.'})
- Platform-specific voice rules and styles
- How hooks and CTAs differ by platform

### 6. Conversion & Momentum
Explore with me:
- What actions feel aligned for this persona? (buying, subscribing, reflecting, sharing)
- How we invite people to stay in the world longer without feeling salesy
- 3-5 CTA archetypes that sound like this persona
- Seasonal or campaign moments where the persona can rally people

### 7. Aesthetic & Visual Identity
Define together:
- The visual palette (colors, mood, style)
- Subjects or themes that appear in visuals
- The overall aesthetic mood

### 8. Content Examples & Prompts
Create with me:
- 5-10 sample prompts that demonstrate this persona's voice
- Examples of successful content formats
- How hooks, captions, and CTAs work together

---

## How to Use This Prompt

1. Copy this entire prompt
2. Paste it into ChatGPT (GPT-4 recommended) along with any additional context about yourself
3. ChatGPT will guide you through answering all these questions
4. Answer each question as ChatGPT asks them
5. Copy ChatGPT's complete response (your persona blueprint)
6. Paste it back into the "ChatGPT Response" section below and save

**Important:** Be specific, detailed, and practical in your answers. The more detail you provide, the better the AI will understand your voice and generate authentic content.`;

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
          engagement: 85.5,
        },
      ];

      const response = await fetch('/api/digital-me/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: personaData.name,
          description: personaData.expertise,
          niche: personaData.niche,
          samples: sampleExamples,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to create persona');
      }

      const result = await response.json();

      // Set the active persona to the newly created one
      setActivePersonaId(result.persona.id);

      alert(
        `Persona "${personaData.name}" created successfully! You can now configure its blueprint and add more examples.`
      );

      // Move to step 3 to configure the blueprint
      setStep(3);
    } catch (error) {
      console.error('Failed to create persona:', error);
      alert(
        `Failed to create persona: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
        ? personaData.successfulContent
            .split('\n')
            .filter(Boolean)
            .map((line, index) => {
              const [name, ...rest] = line.split(':');
              return {
                name: name?.trim() || `Pillar ${index + 1}`,
                focus: rest.join(':').trim() || 'Focus to be detailed',
              };
            })
        : undefined,
      sample_prompts: personaData.challenges
        ? personaData.challenges.split('\n').filter(Boolean)
        : undefined,
    };
  }, [personaData]);

  const applyBlueprintToForm = useCallback((incoming: PersonaBlueprint | undefined | null) => {
    if (!incoming || typeof incoming !== 'object') {
      return;
    }

    setPersonaData((prev) => {
      const current = { ...createEmptyPersona(), ...prev };

      const expertiseLines = [
        incoming.summary,
        incoming.core_identity?.medium ? `Medium: ${incoming.core_identity.medium}` : '',
        incoming.core_identity?.materials ? `Materials: ${incoming.core_identity.materials}` : '',
        incoming.core_identity?.production ? `Process: ${incoming.core_identity.production}` : '',
        incoming.core_identity?.philosophy
          ? `Philosophy: ${incoming.core_identity.philosophy}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      const audienceBlock = incoming.audience
        ? [
            incoming.audience.profile,
            incoming.audience.age_range ? `Age: ${incoming.audience.age_range}` : '',
            incoming.audience.values?.length
              ? `Values: ${incoming.audience.values.join(', ')}`
              : '',
            incoming.audience.location ? `Location: ${incoming.audience.location}` : '',
          ]
            .filter(Boolean)
            .join('\n')
        : current.audience;

      const contentStyleBlock = [
        incoming.aesthetic?.style,
        incoming.aesthetic?.palette ? `Palette: ${incoming.aesthetic.palette}` : '',
        incoming.aesthetic?.mood ? `Mood: ${incoming.aesthetic.mood}` : '',
        incoming.content_tone_keywords?.length
          ? `Keywords: ${incoming.content_tone_keywords.join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      const brandVoiceBlock = incoming.voice
        ? [
            incoming.voice.tone ? `Tone: ${incoming.voice.tone}` : '',
            incoming.voice.style_rules
              ? `Style Rules: ${JSON.stringify(incoming.voice.style_rules, null, 2)}`
              : '',
            incoming.voice.example_phrasing?.length
              ? `Example phrasing:\n- ${incoming.voice.example_phrasing.join('\n- ')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n\n')
        : current.brandVoice;

      const businessGoalsBlock = incoming.values?.length
        ? `Values we must uphold: ${incoming.values.join(', ')}`
        : current.businessGoals;

      const successfulContentBlock = incoming.content_pillars
        ? incoming.content_pillars.map((pillar) => `${pillar.name}: ${pillar.focus}`).join('\n')
        : current.successfulContent;

      const challengesBlock = incoming.sample_prompts
        ? incoming.sample_prompts.join('\n')
        : current.challenges;

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
        challenges: challengesBlock,
      };
    });
  }, []);

  const applyBlueprint = () => {
    try {
      const parsed = JSON.parse(blueprintJSON) as PersonaBlueprint;
      applyBlueprintToForm(parsed);
      flashStatus({
        type: 'success',
        message: 'Persona blueprint imported and synced with the wizard.',
      });
    } catch (error) {
      console.error('Blueprint parse error:', error);
      flashStatus({
        type: 'error',
        message: 'Unable to parse JSON. Please validate the syntax and try again.',
      });
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
          cache: 'no-store',
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
        const guidancePromptsPayload = persona?.guidancePrompts;

        if (blueprintPayload) {
          const pretty = JSON.stringify(blueprintPayload, null, 2);
          setBlueprintJSON(pretty);

          if (typeof blueprintPayload === 'object' && !Array.isArray(blueprintPayload)) {
            applyBlueprintToForm(blueprintPayload as PersonaBlueprint);
          }
        } else {
          setBlueprintJSON('');
          setPersonaData(createEmptyPersona());
          setGeneratedPrompt('');
        }

        // Load ChatGPT response if saved
        if (guidancePromptsPayload && typeof guidancePromptsPayload === 'object') {
          const guidance = guidancePromptsPayload as Record<string, unknown>;
          if (typeof guidance.chatgptResponse === 'string') {
            setChatgptResponse(guidance.chatgptResponse);
          }
        } else {
          setChatgptResponse('');
        }

        flashStatus({
          type: 'success',
          message: blueprintPayload
            ? `Loaded ${persona?.name ?? 'persona'} blueprint.`
            : `${persona?.name ?? 'This persona'} has no saved blueprint yet.`,
        });
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
      personaData.brandVoice ? `with a voice that is ${personaData.brandVoice.split('\n')[0]}` : '',
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
        prompt: `You are helping me craft content for a persona. Memorise this JSON blueprint and acknowledge once you fully understand it.\n\n${blueprintString}\n\nWhen you understand, reply with: "ready for prompts as ${memoizedSummary}" and wait for my requests.`,
      },
      {
        id: 'intake-interview',
        title: 'Persona Intake Interview',
        description: 'Gather any missing details, referencing the current blueprint.',
        prompt: `Review the following persona blueprint and then ask me focused questions to fill gaps. Prioritise tone, emotional triggers, and content rituals we haven't detailed.\n\n${blueprintString}\n\nAsk one question at a time, referencing specifics so it feels collaborative.`,
      },
      {
        id: 'content-drafting',
        title: 'Content Drafting Companion',
        description: 'Give the persona to another chat and request new content instantly.',
        prompt: `You are writing as ${memoizedSummary}\n\nPersona blueprint:\n${blueprintString}\n\nWhen I give you a brief, respond in this exact persona voice. Offer 3 variants at different energy levels (soft / balanced / bold) unless I specify otherwise.`,
      },
    ];
  }, [memoizedBlueprint, memoizedSummary]);

  const glassCard = groupedSurface;

  // Extract name and niche from ChatGPT response
  const extractPersonaInfo = (response: string): { name: string; niche: string } => {
    const lines = response
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l);

    // Try to find name and niche in common patterns
    let name = '';
    let niche = '';

    // Look for patterns like "Persona Name:", "Brand Name:", "Name:", etc.
    const namePatterns = [
      /(?:persona|brand|name)[\s:]+(.+)/i,
      /^#+\s*(.+)$/m, // Markdown headers
      /^(.+?)(?:\s*[-–—]\s*|$)/m, // First line before dash
    ];

    for (const pattern of namePatterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        name = match[1]
          .trim()
          .replace(/^#+\s*/, '')
          .substring(0, 50);
        break;
      }
    }

    // Look for niche/brand type
    const nichePatterns = [
      /(?:niche|brand\s*type|category)[\s:]+(.+)/i,
      /(?:content|focus|specialty)[\s:]+(.+)/i,
    ];

    for (const pattern of nichePatterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        niche = match[1].trim().substring(0, 100);
        break;
      }
    }

    // Fallback: use first meaningful line as name, second as niche
    if (!name && lines.length > 0) {
      name = lines[0].replace(/^#+\s*/, '').substring(0, 50);
    }
    if (!niche && lines.length > 1) {
      niche = lines[1].replace(/^#+\s*/, '').substring(0, 100);
    }

    // Final fallbacks
    if (!name) name = 'New Persona';
    if (!niche) niche = 'Content Creator';

    return { name, niche };
  };

  const handleSaveChatGPTResponse = useCallback(async () => {
    if (!chatgptResponse.trim()) {
      flashStatus({ type: 'error', message: 'Please paste ChatGPT response before saving.' });
      return;
    }

    try {
      setSavingResponse(true);

      let currentPersonaId = activePersonaId;

      // If no persona exists, create one from ChatGPT response
      if (!currentPersonaId) {
        const { name, niche } = extractPersonaInfo(chatgptResponse);

        // Prompt user for name if we couldn't extract a good one
        const finalName =
          name === 'New Persona' ? prompt('Enter a name for this persona:', name) || name : name;

        if (!finalName || finalName.trim() === '') {
          throw new Error('Persona name is required. Please enter a name.');
        }

        // Create persona
        const createResponse = await fetch('/api/digital-me/personas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: finalName.trim(),
            description: `Persona created from ChatGPT response`,
            niche: niche || 'Content Creator',
            samples: [],
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          throw new Error(errorData.details || 'Failed to create persona');
        }

        const createResult = await createResponse.json();
        currentPersonaId = createResult.persona.id;
        setActivePersonaId(currentPersonaId);
        setActivePersonaName(createResult.persona.name);

        // Update personaData with extracted info
        setPersonaData((prev) => ({
          ...prev,
          name: finalName.trim(),
          niche: niche || 'Content Creator',
        }));
      }

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

      const response = await fetch(`/api/digital-me/personas/${currentPersonaId}/blueprint`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprint: parsedBlueprint,
          guidancePrompts: {
            chatgptResponse: chatgptResponse.trim(),
            savedAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || 'Failed to save ChatGPT response.');
      }

      const payload = await response.json();
      setActivePersonaName(payload.persona?.name ?? activePersonaName);
      flashStatus({
        type: 'success',
        message: 'ChatGPT response saved successfully! Persona created if needed.',
      });
    } catch (error) {
      console.error('Failed to save ChatGPT response:', error);
      flashStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to save response.',
      });
    } finally {
      setSavingResponse(false);
    }
  }, [
    activePersonaId,
    activePersonaName,
    blueprintJSON,
    chatgptResponse,
    flashStatus,
    memoizedBlueprint,
    setActivePersonaId,
    setActivePersonaName,
    setPersonaData,
  ]);

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

      const guidancePromptsData: Record<string, unknown> = {};
      if (chatgptResponse.trim()) {
        guidancePromptsData.chatgptResponse = chatgptResponse.trim();
        guidancePromptsData.savedAt = new Date().toISOString();
      }
      if (contextualPrompts.length > 0) {
        guidancePromptsData.contextualPrompts = contextualPrompts;
      }

      const response = await fetch(`/api/digital-me/personas/${activePersonaId}/blueprint`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprint: parsedBlueprint,
          guidancePrompts:
            Object.keys(guidancePromptsData).length > 0 ? guidancePromptsData : undefined,
        }),
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
      flashStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to save blueprint.',
      });
    } finally {
      setSavingBlueprint(false);
    }
  }, [
    activePersonaId,
    activePersonaName,
    blueprintJSON,
    chatgptResponse,
    contextualPrompts,
    flashStatus,
    memoizedBlueprint,
  ]);

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
            <Button
              variant="outline"
              className="rounded-full border-slate-200 bg-white/80 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700"
            >
              ← Back to Personas
            </Button>
          </Link>
          <div className="text-right">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              🧙‍♂️ AI Persona Blueprint Wizard
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Design personas you can reuse across AI tools, with JSON blueprints, guided prompts,
              and export options.
            </p>
          </div>
        </div>

        {/* Simple Two-Step Flow */}
        <div className="space-y-6">
          {/* Step 1: Generate & Copy Prompt */}
          <Card className="border-2 border-primary/30 shadow-lg">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl">Step 1: Generate Your ChatGPT Prompt</CardTitle>
              <CardDescription>
                Generate a prompt you can paste into ChatGPT. ChatGPT will guide you through all the
                questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    generateComprehensivePrompt();
                  }}
                  size="lg"
                  variant={generatedPrompt ? 'outline' : 'default'}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {generatedPrompt ? '🔄 Regenerate' : '🤖 Generate Prompt'}
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text.trim()) {
                        setGeneratedPrompt(text);
                        flashStatus({ type: 'success', message: 'Prompt pasted from clipboard!' });
                      } else {
                        flashStatus({ type: 'error', message: 'Clipboard is empty' });
                      }
                    } catch {
                      flashStatus({ type: 'error', message: 'Unable to read clipboard' });
                    }
                  }}
                  size="lg"
                  variant="outline"
                  className="flex-1"
                >
                  📥 Paste External Prompt
                </Button>
                {generatedPrompt && (
                  <Button
                    onClick={() => handleCopy(generatedPrompt, '✅ Copied! Paste into ChatGPT now')}
                    size="lg"
                    className="flex-1 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900"
                  >
                    📋 Copy Prompt
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Your Prompt {generatedPrompt ? '(Ready to Copy)' : '(Generate or Paste)'}
                </Label>
                <Textarea
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  onFocus={(e) => {
                    if (generatedPrompt) {
                      e.target.select();
                    }
                  }}
                  onPaste={(e) => {
                    // Allow pasting directly into textarea
                    const pastedText = e.clipboardData.getData('text');
                    if (pastedText && !generatedPrompt) {
                      setGeneratedPrompt(pastedText);
                      flashStatus({ type: 'success', message: 'Prompt pasted!' });
                    }
                  }}
                  className="h-64 font-mono text-sm"
                  placeholder="Generate a prompt above, or paste your externally created prompt here..."
                />
                {generatedPrompt ? (
                  <p className="text-xs text-muted-foreground">
                    💡 Click in the box to select all, then copy (Cmd+C / Ctrl+C) to paste into
                    ChatGPT
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    💡 Click &quot;Generate Prompt&quot; to create one, or paste your own prompt
                    directly into the box above
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Paste Response & Save */}
          <Card className="border-2 border-success/30 shadow-lg">
            <CardHeader className="bg-success/5">
              <CardTitle className="text-2xl">Step 2: Paste ChatGPT Response & Save</CardTitle>
              <CardDescription>
                After ChatGPT guides you through the questions, paste its complete response here and
                save.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">ChatGPT Response</Label>
                <Textarea
                  value={chatgptResponse}
                  onChange={(e) => setChatgptResponse(e.target.value)}
                  placeholder="Paste ChatGPT's complete response here..."
                  className="min-h-[300px] font-mono text-sm"
                />
                {chatgptResponse && (
                  <p className="text-xs text-muted-foreground">
                    {chatgptResponse.length} characters
                  </p>
                )}
              </div>

              <Button
                onClick={handleSaveChatGPTResponse}
                disabled={savingResponse || !chatgptResponse.trim()}
                size="lg"
                className="w-full bg-success text-success-foreground hover:bg-success/90 disabled:opacity-50"
              >
                {savingResponse
                  ? 'Saving...'
                  : activePersonaId
                    ? '💾 Save Response'
                    : '💾 Create Persona & Save'}
              </Button>

              {!activePersonaId && chatgptResponse.trim() && (
                <p className="text-xs text-center text-muted-foreground">
                  A new persona will be created automatically from your response
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hidden: Old form steps - keeping for backward compatibility but hidden */}
        {/* All old form code removed for simplicity - only showing simple two-step flow above */}
      </div>
    </div>
  );
}
