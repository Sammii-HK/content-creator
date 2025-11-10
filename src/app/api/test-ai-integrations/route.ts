import { NextRequest, NextResponse } from 'next/server';
import { multiAIRouter } from '@/lib/multi-ai-router';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing all AI integrations...');

    const testPrompt = "A beautiful ceramic mug on a wooden table with natural lighting";
    
    const results = [];

    // Test each provider you have
    const providersToTest = [
      { id: 'replicate', name: 'Replicate' },
      { id: 'nano-banana', name: 'Nano Banana' },
      { id: 'stability-ai', name: 'Stability AI' },
      { id: 'dalle-3', name: 'DALL-E 3' }
    ];

    for (const providerInfo of providersToTest) {
      try {
        console.log(`Testing ${providerInfo.name}...`);
        
        const testRequest = {
          type: 'product-photo' as const,
          prompt: testPrompt,
          quality: 'standard' as const
        };

        // Force specific provider
        const provider = multiAIRouter['providers'].find(p => p.id === providerInfo.id);
        
        if (!provider) {
          results.push({
            provider: providerInfo.name,
            status: 'not_configured',
            error: 'Provider not found in configuration'
          });
          continue;
        }

        if (!provider.apiKey) {
          results.push({
            provider: providerInfo.name,
            status: 'missing_api_key',
            error: 'API key not configured'
          });
          continue;
        }

        // Test the generation (with timeout)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 30000)
        );

        const generationPromise = multiAIRouter.generateContent(testRequest);
        
        const result = await Promise.race([generationPromise, timeoutPromise]);

        results.push({
          provider: providerInfo.name,
          status: 'success',
          cost: provider.costPerUnit,
          imageUrl: (result as any).imageUrl,
          quality: provider.quality
        });

      } catch (error) {
        results.push({
          provider: providerInfo.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const totalCost = results
      .filter(r => r.status === 'success')
      .reduce((sum, r) => sum + (r.cost || 0), 0);

    return NextResponse.json({
      success: successCount > 0,
      results,
      summary: {
        totalProviders: providersToTest.length,
        successful: successCount,
        failed: providersToTest.length - successCount,
        totalTestCost: totalCost.toFixed(3)
      },
      recommendations: getRecommendations(results),
      nextSteps: [
        'Add missing API keys to environment variables',
        'Test image generation in /dashboard/create-images',
        'Set up favorites in asset banks',
        'Test external APIs for Etsy integration'
      ]
    });

  } catch (error) {
    console.error('❌ Integration testing failed:', error);
    return NextResponse.json(
      { 
        error: 'Integration testing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getRecommendations(results: any[]): string[] {
  const recommendations = [];
  
  const workingProviders = results.filter(r => r.status === 'success');
  const missingKeys = results.filter(r => r.status === 'missing_api_key');
  
  if (workingProviders.length === 0) {
    recommendations.push('❌ No AI providers working - add API keys to environment variables');
  } else {
    recommendations.push(`✅ ${workingProviders.length} AI providers working successfully`);
  }
  
  if (missingKeys.length > 0) {
    recommendations.push(`⚠️ ${missingKeys.length} providers missing API keys`);
  }
  
  if (workingProviders.some(p => p.provider === 'Nano Banana')) {
    recommendations.push('🎯 Nano Banana working - great for product photography');
  }
  
  if (workingProviders.some(p => p.provider === 'Replicate')) {
    recommendations.push('🎨 Replicate working - excellent Midjourney alternative');
  }
  
  if (workingProviders.length >= 2) {
    recommendations.push('🚀 Multiple providers available - smart cost routing enabled');
  }

  return recommendations;
}
