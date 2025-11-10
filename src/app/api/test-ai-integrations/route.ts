import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing AI integrations...');

    const results = [];

    // Test environment variables
    const envTests = [
      { name: 'Replicate', key: 'REPLICATE_API_TOKEN', cost: 0.05 },
      { name: 'Nano Banana', key: 'NANO_BANANA_API_KEY', cost: 0.08 },
      { name: 'Stability AI', key: 'STABILITY_AI_API_KEY', cost: 0.02 },
      { name: 'DALL-E 3', key: 'OPENAI_API_KEY', cost: 0.08 },
      { name: 'Runway ML', key: 'RUNWAY_ML_API_KEY', cost: 1.20 }
    ];

    for (const test of envTests) {
      const hasKey = !!process.env[test.key];
      results.push({
        provider: test.name,
        status: hasKey ? 'configured' : 'missing_key',
        cost: test.cost,
        envKey: test.key,
        configured: hasKey
      });
    }

    const configuredCount = results.filter(r => r.configured).length;
    const totalEstimatedCost = results.filter(r => r.configured).reduce((sum, r) => sum + r.cost, 0);

    return NextResponse.json({
      success: configuredCount > 0,
      results,
      summary: {
        totalProviders: envTests.length,
        configured: configuredCount,
        missing: envTests.length - configuredCount,
        estimatedCostForFullTest: totalEstimatedCost.toFixed(2)
      },
      recommendations: [
        configuredCount === 0 ? '❌ No AI providers configured - add API keys to environment variables' : `✅ ${configuredCount} AI providers configured`,
        configuredCount >= 2 ? '🚀 Multiple providers available - smart cost routing enabled' : '⚠️ Add more providers for better cost optimization',
        'Add missing API keys to Vercel environment variables to enable all features'
      ],
      nextSteps: [
        'Add missing API keys to Vercel environment variables',
        'Test image generation in /dashboard/create-images',
        'Set up asset banks with favorite models/products',
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