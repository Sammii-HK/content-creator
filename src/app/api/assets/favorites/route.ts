import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const FavoriteRequestSchema = z.object({
  assetId: z.string(),
  isFavorite: z.boolean()
});

// Get favorite assets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'model' | 'product' | 'environment' | null;

    const whereClause: any = { isFavorite: true };
    if (type) {
      whereClause.type = type;
    }

    const favorites = await db.asset.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      favorites,
      count: favorites.length,
      byType: {
        models: favorites.filter(a => a.type === 'model').length,
        products: favorites.filter(a => a.type === 'product').length,
        environments: favorites.filter(a => a.type === 'environment').length
      }
    });

  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// Toggle favorite status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, isFavorite } = FavoriteRequestSchema.parse(body);

    const updatedAsset = await db.asset.update({
      where: { id: assetId },
      data: { isFavorite }
    });

    return NextResponse.json({
      success: true,
      asset: updatedAsset,
      message: `Asset ${isFavorite ? 'added to' : 'removed from'} favorites`
    });

  } catch (error) {
    console.error('Failed to update favorite:', error);
    return NextResponse.json(
      { error: 'Failed to update favorite' },
      { status: 500 }
    );
  }
}
