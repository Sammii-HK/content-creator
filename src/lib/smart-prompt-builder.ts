import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export interface SmartPromptContext {
  baseImage?: {
    description: string;
    lighting: string;
    angle: string;
    pose: string;
    environment: string;
    style: string;
  };
  productChange?: {
    type: 'design' | 'color' | 'pattern' | 'style';
    description: string;
  };
  consistency?: {
    maintainPose: boolean;
    maintainLighting: boolean;
    maintainAngle: boolean;
    maintainEnvironment: boolean;
  };
  purpose: 'etsy-listing' | 'social-media' | 'brand-catalog' | 'lifestyle-content';
}

export class SmartPromptBuilder {
  private model = openai('gpt-4o-mini');

  /**
   * Generate smart, contextual prompts for consistent product imagery
   */
  async buildConsistentPrompt(context: SmartPromptContext): Promise<string> {
    const result = await generateText({
      model: this.model,
      prompt: `Create a detailed, professional photography prompt for consistent product imagery.

Context:
${context.baseImage ? `Base Image: ${JSON.stringify(context.baseImage, null, 2)}` : 'No base image reference'}
${context.productChange ? `Product Change: ${JSON.stringify(context.productChange, null, 2)}` : 'No product changes'}
${context.consistency ? `Consistency Requirements: ${JSON.stringify(context.consistency, null, 2)}` : 'Standard consistency'}
Purpose: ${context.purpose}

Requirements:
1. Generate a detailed photography prompt that ensures visual consistency
2. Include specific lighting, angle, pose, and composition instructions
3. Ensure the new product integrates seamlessly with the existing scene
4. Maintain the same aesthetic and mood
5. Include technical photography details for AI generation

${this.getPurposeGuidelines(context.purpose)}

The prompt should be detailed enough that an AI can recreate the exact same scene with the new product variation.`
    });

    return result.text;
  }

  /**
   * Create variation prompts for the same scene
   */
  generateVariationPrompts(basePrompt: string, variations: string[]): string[] {
    return variations.map(variation => {
      return `${basePrompt}

VARIATION: ${variation}

Maintain all other elements exactly the same: same lighting, same angle, same pose, same environment, same composition. Only change: ${variation}`;
    });
  }

  /**
   * Build prompt for exact scene recreation with product swap
   */
  buildProductSwapPrompt(
    originalScene: string,
    newProductDescription: string,
    maintainElements: string[] = ['pose', 'lighting', 'angle', 'environment']
  ): string {
    return `Recreate this exact scene with a new product:

ORIGINAL SCENE: ${originalScene}

NEW PRODUCT: ${newProductDescription}

MAINTAIN EXACTLY:
${maintainElements.map(element => `- Same ${element}`).join('\n')}

CHANGE ONLY: Replace the product with ${newProductDescription}

Keep everything else identical: same model pose, same camera angle, same lighting setup, same background, same composition, same mood and aesthetic. The new product should fit naturally into the existing scene as if it was always meant to be there.`;
  }

  /**
   * Generate smart prompts based on product type and use case
   */
  getSmartPrompts(productType: string, useCase: string): string[] {
    const prompts = {
      'clothing': {
        'etsy-listing': [
          'Professional fashion photography, model wearing [PRODUCT], clean studio lighting, neutral background, model facing slightly towards camera, confident pose, fabric details visible, commercial fashion photography style',
          'Lifestyle fashion photography, model wearing [PRODUCT] in natural environment, soft natural lighting, authentic pose and expression, lifestyle brand aesthetic, relatable and aspirational',
          'Detail shot of [PRODUCT], focus on fabric texture, quality, and design details, professional product photography, clean background, perfect for showcasing craftsmanship'
        ],
        'social-media': [
          'Instagram-worthy fashion content, model wearing [PRODUCT], trendy pose, good lighting, mobile-optimized composition, engaging and shareable, lifestyle aesthetic',
          'TikTok-style fashion content, dynamic pose, vibrant colors, eye-catching composition, model showcasing [PRODUCT] with energy and personality'
        ]
      },
      'accessories': {
        'etsy-listing': [
          'Professional jewelry photography, [PRODUCT] on clean white background, perfect lighting to show details, no shadows, commercial product photography',
          'Lifestyle accessory photography, model wearing [PRODUCT], natural pose, soft lighting, shows how the accessory looks when worn',
          'Flat lay accessory photography, [PRODUCT] arranged aesthetically with complementary props, overhead view, Instagram flat lay style'
        ]
      },
      'home-decor': {
        'etsy-listing': [
          'Professional home decor photography, [PRODUCT] in styled room setting, natural lighting, shows product in context of modern home, aspirational lifestyle aesthetic',
          'Clean product photography of [PRODUCT], neutral background, perfect for e-commerce, shows all product details clearly'
        ]
      }
    };

    const productPrompts = prompts[productType as keyof typeof prompts];
  if (!productPrompts) return [];
  
  return (productPrompts as any)[useCase] || [];
  }

  private getPurposeGuidelines(purpose: string): string {
    switch (purpose) {
      case 'etsy-listing':
        return `For Etsy listings, focus on:
- Clear product visibility and details
- Professional but approachable aesthetic
- Shows product quality and craftsmanship
- Appeals to target customer demographic
- Optimized for marketplace browsing`;
        
      case 'social-media':
        return `For social media, focus on:
- Eye-catching and thumb-stopping
- Mobile-optimized composition
- Engaging and shareable aesthetic
- Lifestyle and aspirational feel
- Platform-specific optimization`;
        
      case 'brand-catalog':
        return `For brand catalogs, focus on:
- Consistent brand aesthetic
- Professional commercial quality
- Cohesive visual language
- Premium brand positioning
- Detailed product showcase`;
        
      case 'lifestyle-content':
        return `For lifestyle content, focus on:
- Natural, authentic feeling
- Relatable and aspirational
- Shows product in real-life context
- Emotional connection with viewer
- Storytelling through imagery`;
        
      default:
        return 'Focus on professional, high-quality imagery that showcases the product effectively.';
    }
  }
}

export const smartPromptBuilder = new SmartPromptBuilder();

// Pre-built smart prompts for common scenarios
export const smartPrompts = {
  consistency: {
    sameModelDifferentProduct: (modelPose: string, lighting: string, environment: string) =>
      `Professional product photography, model in ${modelPose}, ${lighting} lighting setup, ${environment} background. Maintain exact same pose, angle, and composition. Only change the product being showcased. Same camera angle, same model expression, same lighting setup, same background elements.`,
      
    sameSceneDifferentDesign: (sceneDescription: string) =>
      `Recreate this exact scene: ${sceneDescription}. Keep everything identical - same model pose, same camera angle, same lighting, same environment, same composition. Only change: the product design/pattern/color. Everything else must remain exactly the same for brand consistency.`,
      
    brandConsistency: (brandAesthetic: string, productCategory: string) =>
      `${brandAesthetic} brand aesthetic, ${productCategory} product photography. Maintain consistent brand visual language: same lighting style, same composition approach, same color palette, same mood and feeling. Professional commercial photography that reinforces brand identity.`
  },
  
  productTypes: {
    tshirt: {
      designFocus: 'Professional t-shirt photography focusing on design details, fabric drape, fit and style. Model wearing t-shirt naturally, design clearly visible, soft lighting to show fabric texture, lifestyle brand aesthetic.',
      lifestyle: 'Casual lifestyle photography, model wearing t-shirt in natural environment, relaxed authentic pose, shows how t-shirt fits into everyday life, aspirational but relatable.',
      ecommerce: 'Clean e-commerce t-shirt photography, model facing forward, t-shirt fit and design clearly visible, neutral background, professional lighting, perfect for online store listings.'
    },
    
    accessories: {
      worn: 'Lifestyle accessory photography, model wearing accessory naturally, shows how it looks when worn, soft natural lighting, authentic pose and expression.',
      detail: 'Macro product photography focusing on accessory details, craftsmanship, materials, and quality. Perfect lighting to show texture and finish.',
      styled: 'Styled accessory photography, accessory arranged with complementary props and environment, aesthetic flat lay or lifestyle setup.'
    },
    
    homeDecor: {
      inSitu: 'Home decor photography showing product in styled room environment, natural lighting, shows how product fits into modern home aesthetic.',
      clean: 'Clean product photography of home decor item, neutral background, focuses on design details and quality.',
      lifestyle: 'Lifestyle home photography, product naturally integrated into lived-in space, cozy and inviting atmosphere.'
    }
  }
};

export const getSmartSuggestions = (
  productType: string, 
  currentPrompt: string, 
  userGoal: string
): string[] => {
  const suggestions = [];
  
  // Consistency suggestions
  if (currentPrompt.includes('model') && userGoal.includes('same')) {
    suggestions.push(smartPrompts.consistency.sameModelDifferentProduct(
      'natural relaxed pose', 
      'soft natural', 
      'clean modern'
    ));
  }
  
  // Product-specific suggestions
  if (productType === 'clothing') {
    suggestions.push(...Object.values(smartPrompts.productTypes.tshirt));
  } else if (productType === 'accessories') {
    suggestions.push(...Object.values(smartPrompts.productTypes.accessories));
  } else if (productType === 'home-decor') {
    suggestions.push(...Object.values(smartPrompts.productTypes.homeDecor));
  }
  
  return suggestions.slice(0, 5); // Limit to 5 suggestions
};
