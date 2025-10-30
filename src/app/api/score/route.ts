import { NextRequest, NextResponse } from 'next/server';
import { mlService } from '@/lib/ml';
import { z } from 'zod';

const ScoreRequestSchema = z.object({
  features: z.object({
    avgBrightness: z.number(),
    avgContrast: z.number(),
    motionLevel: z.number(),
    colorVariance: z.number(),
    textCoverage: z.number(),
    hookStrength: z.number(),
    contentLength: z.number(),
    duration: z.number(),
    toneScore: z.number()
  }),
  targetScore: z.number().optional().default(75)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { features, targetScore } = ScoreRequestSchema.parse(body);

    // Predict engagement score
    const prediction = await mlService.predictEngagement(features);

    // Get improvement suggestions if score is below target
    const improvements = await mlService.suggestImprovements(features, targetScore);

    return NextResponse.json({
      success: true,
      prediction,
      improvements,
      threshold: targetScore
    });

  } catch (error) {
    console.error('Scoring failed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid feature data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'feature-importance') {
      const featureImportance = await mlService.getFeatureImportance();
      return NextResponse.json({ featureImportance });
    }

    return NextResponse.json({
      message: 'ML scoring service is active',
      endpoints: {
        predict: 'POST /api/score - Predict engagement score for video features',
        featureImportance: 'GET /api/score?action=feature-importance - Get feature importance weights'
      }
    });

  } catch (error) {
    console.error('Failed to get ML service info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
