import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Checking AI provider status...');

    // Simple status check without database for now
    const providers = [
      {
        provider: 'replicate',
        isConnected: !!process.env.REPLICATE_API_TOKEN,
        monthlyUsage: 0,
        monthlySpend: 0,
        avgCostPerRequest: 0.05,
        successRate: 100,
        avgResponseTime: 3.2,
        needsAttention: !process.env.REPLICATE_API_TOKEN,
        alertMessage: !process.env.REPLICATE_API_TOKEN ? 'API key missing' : undefined
      },
      {
        provider: 'nano-banana',
        isConnected: !!process.env.NANO_BANANA_API_KEY,
        monthlyUsage: 0,
        monthlySpend: 0,
        avgCostPerRequest: 0.08,
        successRate: 100,
        avgResponseTime: 2.8,
        needsAttention: !process.env.NANO_BANANA_API_KEY,
        alertMessage: !process.env.NANO_BANANA_API_KEY ? 'API key missing' : undefined
      },
      {
        provider: 'stability-ai',
        isConnected: !!process.env.STABILITY_AI_API_KEY,
        monthlyUsage: 0,
        monthlySpend: 0,
        avgCostPerRequest: 0.02,
        successRate: 100,
        avgResponseTime: 4.1,
        needsAttention: !process.env.STABILITY_AI_API_KEY,
        alertMessage: !process.env.STABILITY_AI_API_KEY ? 'API key missing' : undefined
      },
      {
        provider: 'dalle-3',
        isConnected: !!process.env.OPENAI_API_KEY,
        monthlyUsage: 0,
        monthlySpend: 0,
        avgCostPerRequest: 0.08,
        successRate: 100,
        avgResponseTime: 5.2,
        needsAttention: !process.env.OPENAI_API_KEY,
        alertMessage: !process.env.OPENAI_API_KEY ? 'API key missing' : undefined
      },
      {
        provider: 'runway-ml',
        isConnected: !!process.env.RUNWAY_ML_API_KEY,
        monthlyUsage: 0,
        monthlySpend: 0,
        avgCostPerRequest: 1.20,
        successRate: 100,
        avgResponseTime: 8.5,
        needsAttention: !process.env.RUNWAY_ML_API_KEY,
        alertMessage: !process.env.RUNWAY_ML_API_KEY ? 'API key missing' : undefined
      }
    ];

    const connectedCount = providers.filter(p => p.isConnected).length;
    const totalMonthlySpend = providers.reduce((sum, p) => sum + p.monthlySpend, 0);

    return NextResponse.json({
      success: true,
      providers,
      summary: {
        connectedProviders: connectedCount,
        totalProviders: providers.length,
        totalMonthlySpend,
        needsAttention: providers.filter(p => p.needsAttention).length
      },
      environmentCheck: {
        replicate: !!process.env.REPLICATE_API_TOKEN,
        nanoBanana: !!process.env.NANO_BANANA_API_KEY,
        stabilityAI: !!process.env.STABILITY_AI_API_KEY,
        openAI: !!process.env.OPENAI_API_KEY,
        runwayML: !!process.env.RUNWAY_ML_API_KEY
      }
    });

  } catch (error) {
    console.error('❌ Failed to check AI status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check AI status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
