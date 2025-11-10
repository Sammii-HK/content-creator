export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: 'product' | 'lifestyle' | 'portrait' | 'marketing';
  estimatedCost: string;
  bestFor: string[];
  requiredAssets: string[];
}

export const promptTemplates: PromptTemplate[] = [
  // Product Photography
  {
    id: 'etsy-product-hero',
    name: 'Etsy Hero Product Shot',
    description: 'Professional product photography perfect for Etsy main listing images',
    prompt: 'Professional e-commerce product photography, clean white background, soft even lighting, product centered and in sharp focus, high resolution, commercial photography style, perfect for online marketplace listings, no shadows, crisp details, studio lighting setup',
    category: 'product',
    estimatedCost: '$0.08-0.15',
    bestFor: ['Etsy listings', 'Product catalogs', 'E-commerce'],
    requiredAssets: ['product']
  },
  {
    id: 'lifestyle-product-scene',
    name: 'Lifestyle Product in Use',
    description: 'Show your product being used naturally in a real environment',
    prompt: 'Lifestyle product photography showing [PRODUCT] being used naturally in a modern home setting, soft natural lighting from large windows, cozy and inviting atmosphere, person using product authentically, warm color palette, Instagram-worthy composition, professional but not overly staged',
    category: 'lifestyle',
    estimatedCost: '$0.12-0.25',
    bestFor: ['Social media', 'Lifestyle brands', 'Instagram posts'],
    requiredAssets: ['product', 'model', 'environment']
  },
  {
    id: 'flat-lay-collection',
    name: 'Aesthetic Flat Lay',
    description: 'Beautiful overhead shot with multiple products arranged aesthetically',
    prompt: 'Aesthetic flat lay photography, multiple products arranged beautifully from overhead view, neutral background, soft shadows, minimalist composition, Instagram flat lay style, complementary props and textures, natural lighting, clean and organized layout',
    category: 'product',
    estimatedCost: '$0.10-0.20',
    bestFor: ['Instagram', 'Product collections', 'Brand storytelling'],
    requiredAssets: ['multiple products']
  },
  
  // Marketing & Branding
  {
    id: 'brand-story-scene',
    name: 'Brand Story Scene',
    description: 'Tell your brand story with atmospheric product placement',
    prompt: 'Cinematic brand storytelling photography, [PRODUCT] placed in carefully curated environment that reflects brand values, moody atmospheric lighting, depth of field, editorial style, luxury feel, tells a story about the brand and lifestyle, professional commercial photography',
    category: 'marketing',
    estimatedCost: '$0.15-0.30',
    bestFor: ['Brand campaigns', 'About us pages', 'Premium positioning'],
    requiredAssets: ['product', 'environment']
  },
  {
    id: 'social-media-hero',
    name: 'Social Media Hero Shot',
    description: 'Eye-catching image designed specifically for social media engagement',
    prompt: 'Social media optimized product photography, vibrant colors, high contrast, eye-catching composition designed for mobile viewing, thumb-stopping visual impact, perfect for Instagram feed, TikTok, and Facebook posts, engaging and shareable',
    category: 'marketing',
    estimatedCost: '$0.12-0.22',
    bestFor: ['Instagram posts', 'TikTok content', 'Facebook ads'],
    requiredAssets: ['product']
  },
  
  // Portrait & Model Photography
  {
    id: 'professional-headshot',
    name: 'Professional Headshot',
    description: 'Clean, professional portrait for business and social profiles',
    prompt: 'Professional headshot photography, clean background, soft professional lighting, confident expression, business appropriate, high resolution, suitable for LinkedIn profiles, company websites, and professional social media, modern and approachable',
    category: 'portrait',
    estimatedCost: '$0.15-0.25',
    bestFor: ['LinkedIn', 'Business profiles', 'About pages'],
    requiredAssets: ['model']
  },
  {
    id: 'lifestyle-portrait',
    name: 'Lifestyle Portrait',
    description: 'Natural, authentic portrait in a lifestyle setting',
    prompt: 'Lifestyle portrait photography, natural environment, authentic expression, soft natural lighting, relaxed and approachable mood, suitable for personal branding and social media, genuine and warm feeling, professional but not stiff',
    category: 'portrait',
    estimatedCost: '$0.18-0.35',
    bestFor: ['Personal branding', 'Social media', 'Content creator profiles'],
    requiredAssets: ['model', 'environment']
  },
  
  // Advanced Compositions
  {
    id: 'product-wall-art-gallery',
    name: 'Gallery Wall Product Display',
    description: 'Sophisticated product display with curated wall art background',
    prompt: 'Sophisticated product photography with gallery wall background, curated art collection on wall, modern interior design, [PRODUCT] elegantly placed on clean surface, museum-quality lighting, high-end aesthetic, perfect for luxury brands and artistic products',
    category: 'lifestyle',
    estimatedCost: '$0.20-0.40',
    bestFor: ['Luxury products', 'Art-related items', 'Home decor'],
    requiredAssets: ['product', 'wall art environment']
  },
  {
    id: 'model-product-interaction',
    name: 'Model Product Interaction',
    description: 'Natural interaction between model and product showing authentic use',
    prompt: 'Authentic lifestyle photography showing model naturally interacting with [PRODUCT], genuine expressions and body language, soft natural lighting, real environment setting, demonstrates product benefits and use case, relatable and aspirational',
    category: 'lifestyle',
    estimatedCost: '$0.25-0.45',
    bestFor: ['Product demonstrations', 'Lifestyle marketing', 'Social proof'],
    requiredAssets: ['model', 'product', 'environment']
  },
  
  // Seasonal & Contextual
  {
    id: 'cozy-home-scene',
    name: 'Cozy Home Scene',
    description: 'Warm, inviting home environment perfect for lifestyle products',
    prompt: 'Cozy home lifestyle photography, warm lighting, comfortable and inviting atmosphere, [PRODUCT] naturally integrated into daily life scene, hygge aesthetic, soft textures and warm colors, feels like home and comfort',
    category: 'lifestyle',
    estimatedCost: '$0.15-0.30',
    bestFor: ['Home products', 'Comfort items', 'Lifestyle brands'],
    requiredAssets: ['product', 'home environment']
  },
  {
    id: 'workspace-productivity',
    name: 'Modern Workspace Setup',
    description: 'Clean, productive workspace perfect for tech and business products',
    prompt: 'Modern workspace photography, clean and organized desk setup, natural lighting, minimalist aesthetic, [PRODUCT] integrated into productive work environment, inspiring and aspirational, perfect for productivity and tech products',
    category: 'lifestyle',
    estimatedCost: '$0.12-0.25',
    bestFor: ['Tech products', 'Productivity tools', 'Business items'],
    requiredAssets: ['product', 'workspace environment']
  }
];

export const getPromptsByCategory = (category: string) => {
  return promptTemplates.filter(template => template.category === category);
};

export const getPromptById = (id: string) => {
  return promptTemplates.find(template => template.id === id);
};

export const replaceProductPlaceholder = (prompt: string, productName: string) => {
  return prompt.replace(/\[PRODUCT\]/g, productName);
};
