import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePersona } from '@/lib/persona-context';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get('personaId') || undefined;

    await requirePersona(personaId);

    console.log('📊 Checking AI provider status for persona:', personaId);

    const environmentProviders = [
      { key: 'replicate', env: !!process.env.REPLICATE_API_TOKEN, baselineCost: 0.05 },
      { key: 'nano-banana', env: !!process.env.NANO_BANANA_API_KEY, baselineCost: 0.08 },
      { key: 'stability-ai', env: !!process.env.STABILITY_AI_API_KEY, baselineCost: 0.02 },
      { key: 'dalle-3', env: !!process.env.OPENAI_API_KEY, baselineCost: 0.08 },
      { key: 'runway-ml', env: !!process.env.RUNWAY_ML_API_KEY, baselineCost: 1.2 }
    ] as const;

    const usageRecords = await db.aiUsage.findMany({
      where: { personaId },
      orderBy: { createdAt: 'desc' }
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const providerStats = new Map<string, {
      totalCost: number;
      totalRequests: number;
      successfulRequests: number;
      responseTimes: number[];
      monthlyCost: number;
      monthlyRequests: number;
      lastUsed?: Date;
    }>();

    for (const record of usageRecords) {
      const bucket = providerStats.get(record.provider) || {
        totalCost: 0,
        totalRequests: 0,
        successfulRequests: 0,
        responseTimes: [],
        monthlyCost: 0,
        monthlyRequests: 0,
        lastUsed: undefined
      };

      bucket.totalCost += record.cost;
      bucket.totalRequests += 1;
      if (record.success) bucket.successfulRequests += 1;
      if (record.responseTime) bucket.responseTimes.push(record.responseTime);
      if (!bucket.lastUsed || record.createdAt > bucket.lastUsed) bucket.lastUsed = record.createdAt;

      if (record.createdAt >= thirtyDaysAgo) {
        bucket.monthlyCost += record.cost;
        bucket.monthlyRequests += 1;
      }

      providerStats.set(record.provider, bucket);
    }

    const providers = environmentProviders.map((provider) => {
      const stats = providerStats.get(provider.key);
      const avgResponse =
        stats && stats.responseTimes.length > 0
          ? stats.responseTimes.reduce((sum, t) => sum + t, 0) / stats.responseTimes.length
          : undefined;

      const avgCost =
        stats && stats.totalRequests > 0 ? stats.totalCost / stats.totalRequests : provider.baselineCost;

      const successRate =
        stats && stats.totalRequests > 0 ? (stats.successfulRequests / stats.totalRequests) * 100 : 0;

      return {
        provider: provider.key,
        isConnected: provider.env,
        monthlyUsage: stats?.monthlyRequests ?? 0,
        monthlySpend: Number((stats?.monthlyCost ?? 0).toFixed(2)),
        avgCostPerRequest: Number(avgCost.toFixed(2)),
        successRate: Number(successRate.toFixed(1)),
        avgResponseTime: avgResponse ? Number(avgResponse.toFixed(1)) : undefined,
        needsAttention: !provider.env,
        alertMessage: !provider.env ? 'API key missing' : undefined,
        lastUsedAt: stats?.lastUsed?.toISOString()
      };
    });

    const totalMonthlySpend = providers.reduce((sum, provider) => sum + provider.monthlySpend, 0);
    const totalRequests = usageRecords.length;
    const totalSuccess = usageRecords.filter((record) => record.success).length;
    const personaSuccessRate = totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 0;

    return NextResponse.json({
      success: true,
      providers,
      summary: {
        connectedProviders: providers.filter(p => p.isConnected).length,
        totalProviders: providers.length,
        totalMonthlySpend: Number(totalMonthlySpend.toFixed(2)),
        needsAttention: providers.filter(p => p.needsAttention).length,
        personaRequests: totalRequests,
        personaSuccessRate: Number(personaSuccessRate.toFixed(1))
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
