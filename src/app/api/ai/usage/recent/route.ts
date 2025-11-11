import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePersona } from '@/lib/persona-context';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get('personaId') || undefined;

    await requirePersona(personaId);

    console.log('📝 Fetching recent AI usage for persona:', personaId);

    const usage = await db.aiUsage.findMany({
      where: { personaId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      success: true,
      usage: usage.map(entry => ({
        id: entry.id,
        provider: entry.provider,
        requestType: entry.requestType,
        cost: entry.cost,
        success: entry.success,
        prompt: entry.prompt,
        quality: entry.quality,
        responseTime: entry.responseTime,
        createdAt: entry.createdAt
      })),
      count: usage.length,
      message: usage.length === 0
        ? 'No usage data yet for this persona.'
        : `Found ${usage.length} recent requests`
    });

  } catch (error) {
    console.error('❌ Failed to fetch recent usage:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch recent usage',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
