{
  "name": "Digital Me Engine",
  "description": "A personality-driven AI layer that models the creator’s tone, themes, and storytelling style. It learns from existing posts, engagement analytics, and trend data to generate new scripts and captions that sound authentically 'you'.",

  "objectives": [
    "Capture and model the creator’s unique writing voice, tone, and rhythm.",
    "Generate new hooks, captions, and scripts aligned with that voice.",
    "Continuously update style preferences using performance analytics.",
    "Serve as the personality foundation for all future AI content generation."
  ],

  "env_variables": [
    "OPENAI_API_KEY",
    "NEON_DATABASE_URL",
    "AYRSHARE_KEY",
    "BLOB_READ_WRITE_TOKEN"
  ],

  "data_models": [
    {
      "name": "VoiceExample",
      "fields": [
        "id:String@id@uuid",
        "theme:String",
        "tone:String",
        "hook:String",
        "body:String",
        "caption:String?",
        "tags:String[]?",
        "engagement:Float?",
        "embedding:Float[]?",
        "createdAt:DateTime@now"
      ]
    },
    {
      "name": "VoiceProfile",
      "fields": [
        "id:String@id@uuid",
        "summary:String",
        "preferredTones:String[]",
        "topThemes:String[]",
        "lexicalTraits:Json?",
        "updatedAt:DateTime@now"
      ]
    }
  ],

  "modules": [
    {
      "name": "Digital Me Library",
      "description": "Core personality modelling library for text generation and adaptation.",
      "tasks": [
        "Create /lib/digitalMe.ts with functions to embed sample posts and store them as VoiceExample records.",
        "Use OpenAI Embeddings API or text-embedding-3-small to vectorize hooks and bodies.",
        "Compute lexical statistics (avg sentence length, word choice diversity, sentiment balance).",
        "Summarise traits into a VoiceProfile JSON object for reuse in generation prompts."
      ]
    },
    {
      "name": "Script Generator API",
      "description": "Produces new hooks, captions, and tone suggestions based on the creator’s voice and analytics data.",
      "tasks": [
        "Add /api/digital-me/generate route.",
        "Fetch latest VoiceProfile summary and top-performing tones from Metrics table.",
        "Inject profile + analytics into prompt template:",
        "Example prompt: 'You are my digital self. Write a 7-second TikTok hook in my style. Keep poetic pacing, reflective tone, short lines.'",
        "Return JSON { lines, caption, tone, mood }."
      ]
    },
    {
      "name": "Learning Updater",
      "description": "Periodically retrains the voice profile with new data and performance metrics.",
      "tasks": [
        "Add /workers/digitalMeUpdate.ts scheduled weekly via GitHub Actions or Vercel Cron.",
        "Pull recent high-performing posts from Ayrshare analytics.",
        "Embed new examples and update VoiceProfile trait averages.",
        "Optionally fine-tune tone weights based on engagement deltas (e.g., +0.1 bias to poetic if avg engagement +20%)."
      ]
    },
    {
      "name": "Trend-Aware Personality Adapter",
      "description": "Aligns the Digital Me voice with current trends without losing authenticity.",
      "tasks": [
        "Read latest Trend table entries (hashtags, moods).",
        "Classify mood compatibility (LLM call: 'Which trending moods fit my voice?').",
        "When compatible, adjust generation prompts to subtly incorporate those tags or moods."
      ]
    }
  ],

  "integration_points": [
    {
      "with": "LLM Content Generator",
      "description": "Digital Me replaces generic system prompt with personalised tone guidance and examples."
    },
    {
      "with": "Analytics Integration",
      "description": "Uses Metrics engagement scores to update tone and theme preferences automatically."
    },
    {
      "with": "Template System",
      "description": "Suggests which visual template best matches current tone (e.g., poetic → 7s minimal)."
    }
  ],

  "learning_cycle": {
    "steps": [
      "Collect new post examples and metrics.",
      "Embed text samples into vector DB (VoiceExample).",
      "Recalculate VoiceProfile with averaged traits and top-performing tones.",
      "Inject VoiceProfile summary into script-generation prompts.",
      "Generate new content; measure engagement; repeat weekly."
    ]
  },

  "stretch_goals": [
    "Add voice synthesis using ElevenLabs with custom voice embedding.",
    "Train local fine-tune (GPT-3.5-Turbo or Llama-3) once >500 examples exist.",
    "Implement avatar/face animation for talking-head videos using Synthesia or HeyGen API.",
    "Develop chat-style interface: user converses with Digital Me for brainstorming."
  ],

  "expected_costs": {
    "embeddings": "$1–3/month (OpenAI pay-per-call)",
    "LLM generation": "$2–5/month",
    "Storage + DB": "Free tiers",
    "Total_estimate": "$5–8/month"
  },

  "delivery": {
    "initial_commit": [
      "Create Prisma models VoiceExample and VoiceProfile.",
      "Add /lib/digitalMe.ts for embeddings and summary builder.",
      "Implement /api/digital-me/generate route for text generation.",
      "Add weekly updater script for ongoing learning."
    ],
    "milestones": [
      "M1 – Collect & embed sample posts.",
      "M2 – Generate new scripts from VoiceProfile.",
      "M3 – Integrate analytics-driven tone adaptation.",
      "M4 – Add trend-aware modifier and voice synthesis stretch goal."
    ]
  }
}
