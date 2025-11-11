import { NextRequest, NextResponse } from 'next/server';
import { multiAIRouter } from '@/lib/multi-ai-router';
import { requirePersona } from '@/lib/persona-context';
import { z } from 'zod';

// External API for generating product shots from other apps (like Etsy tools)
const ExternalProductShotSchema = z.object({
  productImageUrl: z.string().url('Valid product image URL required'),
  productName: z.string().min(1, 'Product name required'),
  productDescription: z.string().optional(),
  style: z.enum(['lifestyle', 'clean', 'artistic', 'minimal', 'luxury']).default('lifestyle'),
  environment: z.enum(['home', 'studio', 'outdoor', 'office', 'gallery']).default('home'),
  quality: z.enum(['budget', 'standard', 'premium']).default('standard'),
  apiKey: z.string().optional(), // For external app authentication
  personaId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 External API: Generating product shot...');

    const body = await request.json();
    const { 
      productImageUrl, 
      productName, 
      productDescription, 
      style, 
      environment, 
      quality,
      apiKey,
      personaId
    } = ExternalProductShotSchema.parse(body);

    // Basic API key check (you'd implement proper authentication)
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

    // Generate enhanced prompt for product photography
    const enhancedPrompt = `Professional product photography of ${productName}. 
${productDescription ? productDescription + '. ' : ''}
Style: ${style}. Environment: ${environment}. 
High-quality, commercial photography, perfect lighting, professional composition.
Product should be the main focus with attractive ${environment} setting.
${style === 'lifestyle' ? 'Show product in natural use context.' : ''}
${style === 'artistic' ? 'Creative composition with artistic flair.' : ''}
${style === 'minimal' ? 'Clean, minimal background with product focus.' : ''}
${style === 'luxury' ? 'Premium, high-end presentation.' : ''}`;

    // Generate product shot using optimal AI provider
    const generationRequest = {
      type: 'product-photo' as const,
      prompt: enhancedPrompt,
      quality,
      assets: {
        productUrl: productImageUrl
      },
      personaId
    };

    const result = await multiAIRouter.generateContent(generationRequest);

    // Return external-app-friendly response
    return NextResponse.json({
      success: true,
      productShot: {
        imageUrl: result.imageUrl || 'https://placeholder.example.com/product-shot.jpg',
        productName,
        style,
        environment,
        quality,
        provider: result.provider,
        cost: result.cost,
        generatedAt: new Date().toISOString()
      },
      metadata: {
        processingTime: '2-5 seconds',
        resolution: '1024x1024',
        format: 'PNG',
        commercial_use: true
      },
      usage: {
        totalCost: result.cost,
        remainingCredits: 'unlimited', // You'd track this
        provider: result.provider
      }
    });

  } catch (error) {
    console.error('❌ External product shot generation failed:', error);
    
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
        error: 'Product shot generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for API documentation
export async function GET() {
  return NextResponse.json({
    name: 'Product Shot Generation API',
    description: 'Generate professional product shots using AI',
    version: '1.0.0',
    endpoint: '/api/external/generate-product-shot',
    method: 'POST',
    authentication: 'API key (optional for demo)',
    parameters: {
      productImageUrl: 'string (required) - URL to product image',
      productName: 'string (required) - Name of the product',
      productDescription: 'string (optional) - Product description',
      style: 'enum (optional) - lifestyle|clean|artistic|minimal|luxury',
      environment: 'enum (optional) - home|studio|outdoor|office|gallery',
      quality: 'enum (optional) - budget|standard|premium',
      apiKey: 'string (optional) - Your API key'
    },
    pricing: {
      budget: '$0.02-0.05 per image',
      standard: '$0.08-0.15 per image', 
      premium: '$0.15-0.25 per image'
    },
    example: {
      productImageUrl: 'https://example.com/my-product.jpg',
      productName: 'Handmade Ceramic Mug',
      productDescription: 'Beautiful handcrafted ceramic mug with unique glaze',
      style: 'lifestyle',
      environment: 'home',
      quality: 'standard'
    },
    response: {
      success: true,
      productShot: {
        imageUrl: 'https://generated-image-url.com/product-shot.jpg',
        cost: 0.12,
        provider: 'Midjourney'
      }
    }
  });
}
