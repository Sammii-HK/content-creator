import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

// Schema for asset analysis and tagging
const AssetAnalysisSchema = z.object({
  tags: z.array(z.string()).describe('Descriptive tags for the asset'),
  category: z.string().describe('Main category'),
  subcategory: z.string().describe('Specific subcategory'),
  style: z.string().describe('Visual style or aesthetic'),
  mood: z.string().describe('Mood or vibe'),
  useCases: z.array(z.string()).describe('Potential use cases for content creation'),
  compatibleAssets: z.array(z.string()).describe('What this asset works well with')
});

const SceneGenerationSchema = z.object({
  scenes: z.array(z.object({
    description: z.string(),
    modelPose: z.string(),
    productPlacement: z.string(),
    environment: z.string(),
    lighting: z.string(),
    mood: z.string(),
    estimatedCost: z.string()
  }))
});

export interface Asset {
  id: string;
  name: string;
  type: 'model' | 'product' | 'environment';
  imageUrl: string;
  tags: string[];
  category: string;
  subcategory: string;
  style: string;
  mood: string;
  useCases: string[];
  metadata: {
    uploadedAt: Date;
    fileSize?: number;
    dimensions?: { width: number; height: number };
    aiGenerated?: boolean;
  };
}

export interface SceneTemplate {
  id: string;
  name: string;
  description: string;
  requiredAssets: {
    models: number;
    products: number;
    environments: number;
  };
  tags: string[];
  estimatedCost: string;
  popularity: number;
}

export class AssetBankManager {
  private model = openai('gpt-4o-mini');

  /**
   * Analyze uploaded asset and generate tags/metadata
   */
  async analyzeAsset(
    imageUrl: string, 
    assetType: 'model' | 'product' | 'environment',
    userDescription?: string
  ): Promise<any> {
    console.log('🔍 Analyzing asset:', assetType, imageUrl);

    const result = await generateObject({
      model: this.model,
      schema: AssetAnalysisSchema,
      prompt: `Analyze this ${assetType} image for content creation purposes.

Image URL: ${imageUrl}
Asset Type: ${assetType}
${userDescription ? `User Description: ${userDescription}` : ''}

For this ${assetType}, identify:
1. Descriptive tags for searchability
2. Category and subcategory
3. Visual style and aesthetic
4. Mood and vibe it conveys
5. Potential use cases for content creation
6. What other assets it would work well with

Be specific and practical for content creators who need to find and combine assets effectively.

${this.getAssetTypeGuidelines(assetType)}`
    });

    return result.object;
  }

  /**
   * Suggest asset combinations for content creation
   */
  async suggestAssetCombinations(
    availableAssets: Asset[],
    contentGoal: string,
    budget: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<any> {
    console.log('🎨 Suggesting asset combinations for:', contentGoal);

    const assetSummary = availableAssets.map(asset => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      tags: asset.tags.slice(0, 5),
      style: asset.style,
      mood: asset.mood
    }));

    const result = await generateText({
      model: this.model,
      prompt: `Suggest optimal asset combinations for content creation.

Content Goal: ${contentGoal}
Budget Level: ${budget}

Available Assets:
${JSON.stringify(assetSummary, null, 2)}

Suggest 3-5 combinations that:
1. Work well together aesthetically
2. Achieve the content goal effectively
3. Fit within the budget constraints
4. Create engaging, professional content
5. Are practical to execute

For each combination, include:
- Which specific assets to use
- How to arrange/compose them
- Expected visual impact
- Estimated generation cost
- Potential variations

Focus on realistic, achievable combinations that will create high-quality content.`
    });

    return {
      suggestions: result.text,
      budget,
      contentGoal,
      assetCount: availableAssets.length
    };
  }

  /**
   * Generate scene templates for common use cases
   */
  async generateSceneTemplates(
    assetTypes: { models: Asset[]; products: Asset[]; environments: Asset[] },
    useCase: string
  ): Promise<any> {
    console.log('🎬 Generating scene templates for:', useCase);

    const result = await generateObject({
      model: this.model,
      schema: SceneGenerationSchema,
      prompt: `Create scene templates for: ${useCase}

Available Assets:
- Models: ${assetTypes.models.length} (${assetTypes.models.map(m => m.style).join(', ')})
- Products: ${assetTypes.products.length} (${assetTypes.products.map(p => p.category).join(', ')})
- Environments: ${assetTypes.environments.length} (${assetTypes.environments.map(e => e.mood).join(', ')})

Generate 5 scene templates that:
1. Use available assets effectively
2. Create professional, engaging content
3. Are cost-effective to produce
4. Work well for social media
5. Can be easily replicated with variations

For each scene, specify:
- Detailed description
- Model pose and styling
- Product placement and angle
- Environment setup and mood
- Lighting requirements
- Overall aesthetic
- Estimated AI generation cost`
    });

    return result.object;
  }

  /**
   * Smart asset search with AI-powered matching
   */
  async searchAssets(
    query: string,
    assetType?: 'model' | 'product' | 'environment',
    availableAssets: Asset[] = []
  ): Promise<Asset[]> {
    console.log('🔍 AI-powered asset search:', query);

    if (availableAssets.length === 0) {
      return [];
    }

    // Filter by type if specified
    let filteredAssets = assetType 
      ? availableAssets.filter(asset => asset.type === assetType)
      : availableAssets;

    // Simple search for now - in production, use vector similarity
    const searchTerms = query.toLowerCase().split(' ');
    
    const scoredAssets = filteredAssets.map(asset => {
      const searchableText = [
        asset.name,
        asset.category,
        asset.style,
        asset.mood,
        ...asset.tags,
        ...asset.useCases
      ].join(' ').toLowerCase();

      const score = searchTerms.reduce((acc, term) => {
        return acc + (searchableText.includes(term) ? 1 : 0);
      }, 0);

      return { asset, score };
    });

    return scoredAssets
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.asset)
      .slice(0, 20);
  }

  /**
   * Create pre-built scene templates
   */
  getPopularSceneTemplates(): SceneTemplate[] {
    return [
      {
        id: 'lifestyle-product',
        name: 'Lifestyle Product Showcase',
        description: 'Model using product in natural environment',
        requiredAssets: { models: 1, products: 1, environments: 1 },
        tags: ['lifestyle', 'authentic', 'product-demo'],
        estimatedCost: '$0.15-0.40',
        popularity: 95
      },
      {
        id: 'artwork-wall',
        name: 'Product with Wall Art',
        description: 'Product displayed with artwork/gallery wall background',
        requiredAssets: { models: 0, products: 1, environments: 1 },
        tags: ['artistic', 'gallery', 'sophisticated'],
        estimatedCost: '$0.10-0.25',
        popularity: 85
      },
      {
        id: 'model-portrait',
        name: 'Professional Model Portrait',
        description: 'Clean model shot for avatar/profile content',
        requiredAssets: { models: 1, products: 0, environments: 1 },
        tags: ['portrait', 'professional', 'avatar'],
        estimatedCost: '$0.20-0.50',
        popularity: 90
      },
      {
        id: 'product-flat-lay',
        name: 'Product Flat Lay',
        description: 'Products arranged aesthetically from above',
        requiredAssets: { models: 0, products: 3, environments: 1 },
        tags: ['flat-lay', 'aesthetic', 'instagram'],
        estimatedCost: '$0.08-0.20',
        popularity: 88
      },
      {
        id: 'lifestyle-scene',
        name: 'Complete Lifestyle Scene',
        description: 'Model with products in lifestyle environment',
        requiredAssets: { models: 1, products: 2, environments: 1 },
        tags: ['lifestyle', 'complete', 'storytelling'],
        estimatedCost: '$0.30-0.80',
        popularity: 92
      }
    ];
  }

  private getAssetTypeGuidelines(assetType: string): string {
    switch (assetType) {
      case 'model':
        return 'For models, focus on: pose, expression, clothing style, age range, ethnicity, hair style, and overall vibe. Consider what types of products or content this model would be good for.';
      case 'product':
        return 'For products, focus on: category, style, color, size, target audience, use cases, and what environments or models would showcase it best.';
      case 'environment':
        return 'For environments, focus on: setting type, mood, lighting, color palette, style aesthetic, and what types of content or products would work well in this environment.';
      default:
        return 'Analyze the visual elements, style, and potential use cases for content creation.';
    }
  }
}

export const assetBankManager = new AssetBankManager();
