import { NextRequest, NextResponse } from 'next/server';
import { mlService } from '@/lib/ml';

export async function POST(_request: NextRequest) {
  try {
    console.log('Starting model retraining...');
    
    const result = await mlService.retrainModel();
    
    console.log('Model retraining completed:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Model retrained successfully',
      ...result
    });

  } catch (error) {
    console.error('Model retraining failed:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Model retraining failed',
        success: false
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const featureImportance = await mlService.getFeatureImportance();
    
    return NextResponse.json({
      featureImportance,
      message: 'Current model feature importance weights'
    });

  } catch (error) {
    console.error('Failed to get model info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
