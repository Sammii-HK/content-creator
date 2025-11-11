import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { aiUsageTracker } from './ai-usage-tracker';

// AI Provider configurations with costs and capabilities
export interface AIProvider {
  id: string;
  name: string;
  type: 'text-to-image' | 'image-editing' | 'text-generation' | 'video-generation';
  costPerUnit: number;
  quality: 'budget' | 'standard' | 'premium';
  strengths: string[];
  apiEndpoint?: string;
  apiKey?: string;
}

export interface GenerationRequest {
  type: 'product-photo' | 'avatar-video' | 'text-content' | 'scene-generation';
  prompt: string;
  quality: 'budget' | 'standard' | 'premium';
  budget?: number;
  assets?: {
    modelUrl?: string;
    productUrl?: string;
    environmentUrl?: string;
  };
  personaId?: string;
}

export class MultiAIRouter {
  private providers: AIProvider[] = [
    {
      id: 'replicate',
      name: 'Replicate',
      type: 'text-to-image',
      costPerUnit: 0.05,
      quality: 'premium',
      strengths: ['artistic', 'high-quality', 'midjourney-style', 'auto-billing'],
      apiEndpoint: 'https://api.replicate.com/v1',
      apiKey: process.env.REPLICATE_API_TOKEN
    },
    {
      id: 'nano-banana',
      name: 'Nano Banana',
      type: 'text-to-image',
      costPerUnit: 0.08,
      quality: 'standard',
      strengths: ['product-placement', 'realistic', 'cost-effective', 'batch-processing'],
      apiEndpoint: 'https://api.nanobanana.ai/v1',
      apiKey: process.env.NANO_BANANA_API_KEY
    },
    {
      id: 'dalle-3',
      name: 'DALL-E 3',
      type: 'text-to-image',
      costPerUnit: 0.08,
      quality: 'premium',
      strengths: ['prompt-following', 'precise', 'text-in-images', 'brand-safe'],
      apiEndpoint: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY
    },
    {
      id: 'stability-ai',
      name: 'Stability AI',
      type: 'text-to-image',
      costPerUnit: 0.02,
      quality: 'budget',
      strengths: ['open-source', 'customizable', 'volume', 'fast'],
      apiEndpoint: 'https://api.stability.ai/v1',
      apiKey: process.env.STABILITY_AI_API_KEY
    }
  ];

  /**
   * Select optimal AI provider based on request and budget
   */
  selectOptimalProvider(request: GenerationRequest): AIProvider {
    console.log('🤖 Selecting optimal AI provider for:', request.type, request.quality);

    // Filter providers by type and quality
    const compatibleProviders = this.providers.filter(provider => {
      // Type compatibility
      const typeMatch = this.isTypeCompatible(provider.type, request.type);
      
      // Quality compatibility
      const qualityMatch = request.quality === provider.quality || 
        (request.quality === 'standard' && provider.quality === 'premium') ||
        (request.quality === 'budget' && provider.quality === 'standard');

      // Budget compatibility
      const budgetMatch = !request.budget || provider.costPerUnit <= request.budget;

      return typeMatch && qualityMatch && budgetMatch;
    });

    if (compatibleProviders.length === 0) {
      // Fallback to cheapest option
      return this.providers.reduce((cheapest, current) => 
        current.costPerUnit < cheapest.costPerUnit ? current : cheapest
      );
    }

    // Select best provider based on strengths and cost
    return this.selectByStrengthsAndCost(compatibleProviders, request);
  }

  /**
   * Generate content using optimal AI provider
   */
  async generateContent(request: GenerationRequest): Promise<any> {
    const provider = this.selectOptimalProvider(request);
    const startedAt = Date.now();
    
    console.log('🎨 Generating content with:', provider.name, `($${provider.costPerUnit})`);

    try {
      let result;
      switch (provider.id) {
        case 'replicate':
          result = await this.generateWithReplicate(request, provider);
          break;
        case 'nano-banana':
          result = await this.generateWithNanoBanana(request, provider);
          break;
        case 'stability-ai':
          result = await this.generateWithStableDiffusion(request, provider);
          break;
        case 'dalle-3':
          result = await this.generateWithDallE(request, provider);
          break;
        case 'runway-ml':
          result = await this.generateWithRunway(request, provider);
          break;
        default:
          throw new Error(`Provider ${provider.id} not implemented`);
      }

      await aiUsageTracker.recordUsage(
        provider.id,
        request.type,
        provider.costPerUnit,
        true,
        request.prompt,
        request.quality,
        Date.now() - startedAt,
        undefined,
        { providerId: provider.id },
        request.personaId
      );

      return result;
    } catch (error) {
      console.error(`❌ Generation failed with ${provider.name}:`, error);

      await aiUsageTracker.recordUsage(
        provider.id,
        request.type,
        provider.costPerUnit,
        false,
        request.prompt,
        request.quality,
        Date.now() - startedAt,
        error instanceof Error ? error.message : 'Unknown error',
        { providerId: provider.id },
        request.personaId
      );
      
      // Fallback to next best provider
      const fallbackProviders = this.providers.filter(p => p.id !== provider.id);
      if (fallbackProviders.length > 0) {
        const fallback = fallbackProviders[0];
        console.log('🔄 Falling back to:', fallback.name);
        return await this.generateContent({ ...request, budget: fallback.costPerUnit });
      }
      
      throw error;
    }
  }

  /**
   * Batch generation with cost optimization
   */
  async batchGenerate(
    requests: GenerationRequest[],
    totalBudget?: number
  ): Promise<any> {
    console.log('📦 Batch generating', requests.length, 'items with budget:', totalBudget);

    // Optimize provider selection for batch
    const optimizedRequests = requests.map(request => ({
      ...request,
      provider: this.selectOptimalProvider(request)
    }));

    // Sort by cost-effectiveness
    optimizedRequests.sort((a, b) => a.provider.costPerUnit - b.provider.costPerUnit);

    const results = [];
    let totalCost = 0;

    for (const request of optimizedRequests) {
      if (totalBudget && totalCost + request.provider.costPerUnit > totalBudget) {
        console.warn('🛑 Budget exceeded, stopping batch generation');
        break;
      }

      try {
        const result = await this.generateContent(request);
        results.push({
          ...result,
          provider: request.provider.name,
          cost: request.provider.costPerUnit
        });
        totalCost += request.provider.costPerUnit;
      } catch (error) {
        results.push({
          error: 'Generation failed',
          provider: request.provider.name,
          cost: 0
        });
      }
    }

    return {
      results: results,
      totalCost: totalCost,
      successCount: results.filter((r: any) => !r.error).length,
      failureCount: results.filter((r: any) => r.error).length
    };
  }

  private isTypeCompatible(providerType: string, requestType: string): boolean {
    const compatibility: Record<string, string[]> = {
      'text-to-image': ['product-photo', 'scene-generation'],
      'video-generation': ['avatar-video'],
      'text-generation': ['text-content']
    };

    return compatibility[providerType]?.includes(requestType) || false;
  }

  private selectByStrengthsAndCost(providers: AIProvider[], request: GenerationRequest): AIProvider {
    // Score providers based on strengths matching request needs
    const scoredProviders = providers.map(provider => {
      let score = 0;
      
      // Strength matching
      if (request.type === 'product-photo' && provider.strengths.includes('product-placement')) score += 3;
      if (request.type === 'scene-generation' && provider.strengths.includes('realistic')) score += 3;
      if (request.quality === 'premium' && provider.strengths.includes('high-quality')) score += 2;
      if (request.budget && provider.strengths.includes('cost-effective')) score += 2;

      // Cost factor (lower cost = higher score)
      score += (1 / provider.costPerUnit) * 10;

      return { provider, score };
    });

    return scoredProviders.sort((a, b) => b.score - a.score)[0].provider;
  }

  // Provider-specific generation methods (real implementations)
  private async generateWithReplicate(request: GenerationRequest, provider: AIProvider): Promise<any> {
    if (!provider.apiKey) {
      throw new Error('Replicate API key not configured');
    }

    try {
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e45", // SDXL
          input: {
            prompt: request.prompt,
            width: 1024,
            height: 1024,
            num_outputs: 1,
            scheduler: "K_EULER",
            num_inference_steps: 25,
            guidance_scale: 7.5
          }
        })
      });

      const prediction = await response.json();
      
      if (!response.ok) {
        throw new Error(`Replicate API error: ${prediction.detail || 'Unknown error'}`);
      }

      // Poll for completion
      let result = prediction;
      while (result.status === 'starting' || result.status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
          headers: { 'Authorization': `Token ${provider.apiKey}` }
        });
        result = await pollResponse.json();
      }

      if (result.status === 'succeeded') {
        return {
          imageUrl: result.output[0],
          provider: provider.name,
          cost: provider.costPerUnit,
          quality: 'premium',
          predictionId: result.id
        };
      } else {
        throw new Error(`Generation failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Replicate generation failed:', error);
      throw error;
    }
  }

  private async generateWithNanoBanana(request: GenerationRequest, provider: AIProvider): Promise<any> {
    if (!provider.apiKey) {
      throw new Error('Nano Banana API key not configured');
    }

    try {
      const response = await fetch(`${provider.apiEndpoint}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: request.prompt,
          style: 'realistic',
          quality: request.quality,
          product_url: request.assets?.productUrl,
          model_url: request.assets?.modelUrl
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Nano Banana API error: ${result.error || 'Unknown error'}`);
      }

      return {
        imageUrl: result.image_url,
        provider: provider.name,
        cost: provider.costPerUnit,
        quality: 'standard',
        jobId: result.job_id
      };
    } catch (error) {
      console.error('Nano Banana generation failed:', error);
      throw error;
    }
  }

  private async generateWithStableDiffusion(request: GenerationRequest, provider: AIProvider): Promise<any> {
    if (!provider.apiKey) {
      throw new Error('Stability AI API key not configured');
    }

    try {
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text_prompts: [{ text: request.prompt }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Stability AI error: ${result.message || 'Unknown error'}`);
      }

      return {
        imageUrl: `data:image/png;base64,${result.artifacts[0].base64}`,
        provider: provider.name,
        cost: provider.costPerUnit,
        quality: 'budget',
        seed: result.artifacts[0].seed
      };
    } catch (error) {
      console.error('Stability AI generation failed:', error);
      throw error;
    }
  }

  private async generateWithDallE(request: GenerationRequest, provider: AIProvider): Promise<any> {
    if (!provider.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: request.prompt,
          size: '1024x1024',
          quality: 'standard',
          n: 1
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`DALL-E 3 error: ${result.error?.message || 'Unknown error'}`);
      }

      return {
        imageUrl: result.data[0].url,
        provider: provider.name,
        cost: provider.costPerUnit,
        quality: 'premium',
        revisedPrompt: result.data[0].revised_prompt
      };
    } catch (error) {
      console.error('DALL-E 3 generation failed:', error);
      throw error;
    }
  }

  private async generateWithRunway(request: GenerationRequest, provider: AIProvider): Promise<any> {
    if (!provider.apiKey) {
      throw new Error('Runway ML API key not configured');
    }

    try {
      const response = await fetch('https://api.runwayml.com/v1/image_generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gen2',
          prompt: request.prompt,
          width: 1024,
          height: 1024
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Runway ML error: ${result.error || 'Unknown error'}`);
      }

      return {
        imageUrl: result.data[0].url,
        provider: provider.name,
        cost: provider.costPerUnit,
        quality: 'premium',
        taskId: result.task_id
      };
    } catch (error) {
      console.error('Runway ML generation failed:', error);
      throw error;
    }
  }
}

export const multiAIRouter = new MultiAIRouter();
