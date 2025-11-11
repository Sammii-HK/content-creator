import { NextRequest, NextResponse } from 'next/server';
import { multiAIRouter } from '@/lib/multi-ai-router';
import { db } from '@/lib/db';
import { requirePersona } from '@/lib/persona-context';
import { z } from 'zod';

// External API for product + wall art combinations
const WallArtProductSchema = z.object({
  productImageUrl: z.string().url('Valid product image URL required').optional(),
  productId: z.string().optional(), // Use predefined favorite product
  wallArtId: z.string().optional(), // Use predefined favorite wall art
  wallArtStyle: z.enum(['gallery', 'modern', 'vintage', 'minimalist', 'eclectic']).default('modern'),
  productPlacement: z.enum(['on-table', 'hanging', 'shelf', 'floor', 'floating']).default('on-table'),
  roomStyle: z.enum(['modern', 'scandinavian', 'industrial', 'bohemian', 'minimalist']).default('modern'),
  lighting: z.enum(['natural', 'warm', 'bright', 'moody', 'soft']).default('natural'),
  quality: z.enum(['budget', 'standard', 'premium']).default('standard'),
  apiKey: z.string().optional(),
  personaId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    console.log('🖼️ External API: Generating wall art + product shot...');

    const body = await request.json();
    const { 
      productImageUrl, 
      productId,
      wallArtId,
      wallArtStyle, 
      productPlacement, 
      roomStyle,
      lighting,
      quality,
      apiKey,
      personaId
    } = WallArtProductSchema.parse(body);

    // API key check
    const validApiKey = process.env.EXTERNAL_API_KEY || 'demo-key';
    if (apiKey && apiKey !== validApiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    if (personaId) {
      await requirePersona(personaId);
    }

    let finalProductUrl = productImageUrl;
    let wallArtUrl = null;

    // Get predefined favorite product if specified
    if (productId && !productImageUrl) {
      const favoriteProduct = await db.asset.findFirst({
        where: { 
          id: productId, 
          type: 'product',
          isFavorite: true,
          personaId: personaId ?? undefined
        }
      });

      if (favoriteProduct) {
        finalProductUrl = favoriteProduct.imageUrl;
      }
    }

    // Get predefined wall art if specified
    if (wallArtId) {
      const favoriteWallArt = await db.asset.findFirst({
        where: { 
          id: wallArtId, 
          type: 'environment',
          category: 'wall-art',
          isFavorite: true,
          personaId: personaId ?? undefined
        }
      });

      if (favoriteWallArt) {
        wallArtUrl = favoriteWallArt.imageUrl;
      }
    }

    if (!finalProductUrl) {
      return NextResponse.json(
        { error: 'Either productImageUrl or productId is required' },
        { status: 400 }
      );
    }

    // Generate enhanced prompt for wall art + product photography
    const enhancedPrompt = `Professional interior product photography with wall art.
Product placement: ${productPlacement} in ${roomStyle} room.
Wall art style: ${wallArtStyle} gallery wall.
Lighting: ${lighting} lighting.
${wallArtUrl ? 'Include specific wall art from reference. ' : ''}
High-quality interior photography, perfect composition and lighting.
Product should complement the wall art without overwhelming it.
${roomStyle === 'scandinavian' ? 'Clean, bright, minimal Nordic aesthetic.' : ''}
${roomStyle === 'industrial' ? 'Raw materials, exposed brick, metal accents.' : ''}
${roomStyle === 'bohemian' ? 'Eclectic, colorful, textured, artistic.' : ''}
${roomStyle === 'minimalist' ? 'Clean lines, neutral colors, uncluttered.' : ''}
Commercial photography quality, suitable for product listings and marketing.`;

    const generationRequest = {
      type: 'scene-generation' as const,
      prompt: enhancedPrompt,
      quality,
      assets: {
        productUrl: finalProductUrl,
        environmentUrl: wallArtUrl || undefined
      },
      personaId
    };

    const result = await multiAIRouter.generateContent(generationRequest);

    return NextResponse.json({
      success: true,
      wallArtProduct: {
        imageUrl: result.imageUrl || 'https://placeholder.example.com/wall-art-product.jpg',
        wallArtStyle,
        productPlacement,
        roomStyle,
        lighting,
        quality,
        provider: result.provider,
        cost: result.cost,
        generatedAt: new Date().toISOString(),
        usedFavorites: {
          product: !!productId,
          wallArt: !!wallArtId
        }
      },
      metadata: {
        processingTime: '4-10 seconds',
        resolution: '1024x1024',
        format: 'PNG',
        commercial_use: true,
        perfectForEtsy: true
      },
      usage: {
        totalCost: result.cost,
        provider: result.provider,
        assetsUsed: [
          productId ? 'favorite_product' : 'custom_product',
          wallArtId ? 'favorite_wall_art' : 'ai_generated_wall_art'
        ].filter(Boolean)
      }
    });

  } catch (error) {
    console.error('❌ Wall art product generation failed:', error);
    
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
        error: 'Wall art product generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for API documentation and favorite assets
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const showDocs = searchParams.get('docs') === 'true';
  const personaId = searchParams.get('personaId') || undefined;

  if (showDocs) {
    return NextResponse.json({
      name: 'Wall Art + Product Generation API',
      description: 'Generate product photos with wall art backgrounds - perfect for Etsy!',
      version: '1.0.0',
      endpoint: '/api/external/generate-wall-art-product',
      method: 'POST',
      authentication: 'API key (optional for demo)',
      perfectFor: ['Etsy product listings', 'Instagram posts', 'Product catalogs', 'Marketing materials'],
      parameters: {
        productImageUrl: 'string (optional) - URL to product image',
        productId: 'string (optional) - ID of favorite product from bank',
        wallArtId: 'string (optional) - ID of favorite wall art from bank',
        wallArtStyle: 'enum (optional) - gallery|modern|vintage|minimalist|eclectic',
        productPlacement: 'enum (optional) - on-table|hanging|shelf|floor|floating',
        roomStyle: 'enum (optional) - modern|scandinavian|industrial|bohemian|minimalist',
        lighting: 'enum (optional) - natural|warm|bright|moody|soft',
        quality: 'enum (optional) - budget|standard|premium'
      },
      pricing: {
        budget: '$0.05-0.08 per image',
        standard: '$0.10-0.18 per image', 
        premium: '$0.20-0.35 per image'
      },
      example: {
        productId: 'favorite-product-456',
        wallArtId: 'favorite-wall-art-789',
        wallArtStyle: 'gallery',
        productPlacement: 'on-table',
        roomStyle: 'scandinavian',
        lighting: 'natural',
        quality: 'standard'
      }
    });
  }

  // Return favorite assets for external apps
  try {
    if (personaId) {
      await requirePersona(personaId);
    }

    const favorites = await db.asset.findMany({
      where: { isFavorite: true, personaId: personaId ?? undefined },
      select: {
        id: true,
        name: true,
        type: true,
        imageUrl: true,
        category: true,
        style: true
      }
    });

    return NextResponse.json({
      success: true,
      favoriteAssets: {
        models: favorites.filter(a => a.type === 'model'),
        products: favorites.filter(a => a.type === 'product'),
        wallArt: favorites.filter(a => a.type === 'environment' && a.category === 'wall-art'),
        environments: favorites.filter(a => a.type === 'environment' && a.category !== 'wall-art')
      },
      totalFavorites: favorites.length
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}
