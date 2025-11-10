import { NextRequest, NextResponse } from 'next/server';
import { multiAIRouter } from '@/lib/multi-ai-router';
import { db } from '@/lib/db';
import { z } from 'zod';

// External API specifically for model photography
const ExternalModelShotSchema = z.object({
  modelImageUrl: z.string().url('Valid model image URL required').optional(),
  modelId: z.string().optional(), // Use predefined favorite model from bank
  style: z.enum(['portrait', 'lifestyle', 'professional', 'casual', 'artistic']).default('lifestyle'),
  setting: z.enum(['studio', 'outdoor', 'home', 'office', 'urban', 'nature']).default('studio'),
  mood: z.enum(['confident', 'friendly', 'professional', 'relaxed', 'energetic']).default('friendly'),
  quality: z.enum(['budget', 'standard', 'premium']).default('standard'),
  clothing: z.string().optional(),
  pose: z.string().optional(),
  apiKey: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    console.log('👤 External API: Generating model shot...');

    const body = await request.json();
    const { 
      modelImageUrl, 
      modelId,
      style, 
      setting, 
      mood,
      quality,
      clothing,
      pose,
      apiKey 
    } = ExternalModelShotSchema.parse(body);

    // API key check
    const validApiKey = process.env.EXTERNAL_API_KEY || 'demo-key';
    if (apiKey && apiKey !== validApiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    let finalModelUrl = modelImageUrl;

    // If using predefined favorite model
    if (modelId && !modelImageUrl) {
      const favoriteModel = await db.asset.findFirst({
        where: { 
          id: modelId, 
          type: 'model',
          isFavorite: true 
        }
      });

      if (favoriteModel) {
        finalModelUrl = favoriteModel.imageUrl;
      } else {
        return NextResponse.json(
          { error: 'Favorite model not found' },
          { status: 404 }
        );
      }
    }

    if (!finalModelUrl) {
      return NextResponse.json(
        { error: 'Either modelImageUrl or modelId is required' },
        { status: 400 }
      );
    }

    // Generate enhanced prompt for model photography
    const enhancedPrompt = `Professional model photography, ${style} style.
Setting: ${setting}. Mood: ${mood}.
${clothing ? `Clothing: ${clothing}. ` : ''}
${pose ? `Pose: ${pose}. ` : ''}
High-quality portrait photography, perfect lighting, professional composition.
${style === 'portrait' ? 'Focus on facial expression and upper body.' : ''}
${style === 'lifestyle' ? 'Natural, candid feeling in real environment.' : ''}
${style === 'professional' ? 'Business-appropriate, confident presentation.' : ''}
${style === 'artistic' ? 'Creative composition with artistic flair.' : ''}
Commercial photography quality, suitable for marketing and social media.`;

    const generationRequest = {
      type: 'product-photo' as const, // Reusing product-photo for model shots
      prompt: enhancedPrompt,
      quality,
      assets: {
        modelUrl: finalModelUrl
      }
    };

    const result = await multiAIRouter.generateContent(generationRequest);

    return NextResponse.json({
      success: true,
      modelShot: {
        imageUrl: result.imageUrl || 'https://placeholder.example.com/model-shot.jpg',
        style,
        setting,
        mood,
        quality,
        provider: result.provider,
        cost: result.cost,
        generatedAt: new Date().toISOString(),
        usedFavoriteModel: !!modelId
      },
      metadata: {
        processingTime: '3-8 seconds',
        resolution: '1024x1024',
        format: 'PNG',
        commercial_use: true
      },
      usage: {
        totalCost: result.cost,
        provider: result.provider,
        modelSource: modelId ? 'favorite_bank' : 'custom_url'
      }
    });

  } catch (error) {
    console.error('❌ External model shot generation failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Model shot generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for API documentation
export async function GET() {
  return NextResponse.json({
    name: 'Model Shot Generation API',
    description: 'Generate professional model photography using AI',
    version: '1.0.0',
    endpoint: '/api/external/generate-model-shot',
    method: 'POST',
    authentication: 'API key (optional for demo)',
    parameters: {
      modelImageUrl: 'string (optional) - URL to model image',
      modelId: 'string (optional) - ID of favorite model from bank',
      style: 'enum (optional) - portrait|lifestyle|professional|casual|artistic',
      setting: 'enum (optional) - studio|outdoor|home|office|urban|nature',
      mood: 'enum (optional) - confident|friendly|professional|relaxed|energetic',
      quality: 'enum (optional) - budget|standard|premium',
      clothing: 'string (optional) - Clothing description',
      pose: 'string (optional) - Pose description',
      apiKey: 'string (optional) - Your API key'
    },
    pricing: {
      budget: '$0.02-0.05 per image',
      standard: '$0.08-0.15 per image', 
      premium: '$0.15-0.30 per image'
    },
    favoriteModels: {
      info: 'Use predefined favorite models from your asset bank',
      endpoint: '/api/assets/favorites/models',
      usage: 'Pass modelId instead of modelImageUrl to use favorite'
    },
    example: {
      modelId: 'favorite-model-123',
      style: 'lifestyle',
      setting: 'home',
      mood: 'relaxed',
      quality: 'standard',
      clothing: 'casual sweater',
      pose: 'sitting naturally'
    }
  });
}
