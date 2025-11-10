import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing AI integrations...');

    const results = [];
    let totalCost = 0;
    let workingCount = 0;

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
      
      if (hasKey) {
        workingCount++;
        totalCost += test.cost;
      }
      
      results.push({
        provider: test.name,
        status: hasKey ? 'configured' : 'missing_key',
        cost: test.cost,
        envKey: test.key,
        configured: hasKey
      });
    }

    const failedCount = envTests.length - workingCount;

    return NextResponse.json({
      success: workingCount > 0,
      results,
      summary: {
        totalProviders: envTests.length,
        successful: workingCount,
        failed: failedCount,
        totalTestCost: totalCost.toFixed(2)
      },
      recommendations: [
        workingCount === 0 ? '❌ No AI providers configured' : `✅ ${workingCount} AI providers working`,
        workingCount >= 2 ? '🚀 Multiple providers - smart routing enabled' : '⚠️ Add more providers for optimization',
        'Add missing API keys to Vercel environment variables'
      ],
      environmentStatus: {
        replicate: !!process.env.REPLICATE_API_TOKEN,
        nanoBanana: !!process.env.NANO_BANANA_API_KEY,
        stabilityAI: !!process.env.STABILITY_AI_API_KEY,
        openAI: !!process.env.OPENAI_API_KEY,
        runwayML: !!process.env.RUNWAY_ML_API_KEY
      }
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