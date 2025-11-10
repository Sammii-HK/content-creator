# AI Content Creator - Production Setup Guide

## 🚀 Quick Start (Minimum Required)

### 1. Core Platform (Required)
```bash
# Add to Vercel Environment Variables:
OPENAI_API_KEY=sk-your-openai-key
DATABASE_URL=your-neon-postgres-url
CLOUDFLARE_R2_ACCOUNT_ID=your-r2-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
CLOUDFLARE_R2_PUBLIC_URL=https://pub-your-bucket.r2.dev
```

### 2. External API Access (For Etsy Tools)
```bash
EXTERNAL_API_KEY=your-custom-api-key-for-external-apps
```

## 🎨 AI Image Generation Options

### Option A: DALL-E 3 (Easiest - Auto Billing)
```bash
# Already included in OPENAI_API_KEY above
# Cost: $0.04-0.08 per image
# Quality: High, precise prompt following
```

### Option B: Stability AI (Manual Credits)
```bash
STABILITY_AI_API_KEY=sk-your-stability-key
# Setup: Go to stability.ai → Add $10+ credits manually
# Cost: $0.02-0.05 per image (cheapest option)
# Quality: Good, open-source
```

### Option C: Replicate (Midjourney Alternative)
```bash
REPLICATE_API_TOKEN=r8-your-replicate-token
# Cost: $0.01-0.05 per image
# Quality: Very high (SDXL, Midjourney-style models)
# Auto-billing: Yes
```

## 🌱 Social Media Integration

### Succulent Integration
```bash
SUCCULENT_API_KEY=your-succulent-api-key
SUCCULENT_API_URL=https://api.succulent.app/v1
# Get from: Succulent dashboard → API settings
```

## 🎬 Video Generation (Advanced)

### Runway ML (Premium)
```bash
RUNWAY_ML_API_KEY=rw-your-runway-key
# Cost: $1.20 per 4s video
# Quality: Professional video generation
```

### HeyGen (AI Avatars)
```bash
HEYGEN_API_KEY=your-heygen-key
# Cost: $0.20-1.00 per video
# Feature: Videos of "you" talking
```

## 📋 Recommended Minimal Setup

For a working platform with image generation:

1. **OpenAI** (required) - Text + DALL-E 3 images
2. **Cloudflare R2** (required) - Video storage  
3. **Database** (required) - Neon PostgreSQL
4. **Replicate** (recommended) - Best image quality/cost ratio
5. **Succulent** (optional) - Social media posting

## 🔗 External API Usage

Your platform provides these APIs for other tools:

### For Etsy Product Listings:
```bash
curl -X POST https://your-app.vercel.app/api/external/generate-product-shot \
  -H "Content-Type: application/json" \
  -d '{
    "productImageUrl": "https://your-product-image.jpg",
    "productName": "Handmade Ceramic Mug",
    "style": "lifestyle",
    "quality": "standard"
  }'
```

### For Wall Art Product Shots:
```bash
curl -X POST https://your-app.vercel.app/api/external/generate-wall-art-product \
  -H "Content-Type: application/json" \
  -d '{
    "productImageUrl": "https://your-product.jpg",
    "wallArtStyle": "gallery",
    "roomStyle": "scandinavian",
    "quality": "standard"
  }'
```

## 💰 Cost Breakdown

### Monthly Costs (Estimated):
- **OpenAI**: $5-15/month (text + images)
- **Replicate**: $10-30/month (premium images)
- **Stability AI**: $10 credits (lasts 200-500 images)
- **R2 Storage**: $1-5/month (video storage)
- **Database**: Free (Neon free tier)

**Total: $25-65/month** for full AI content creation platform

## 🎯 What You Get

- ✅ Unlimited video uploads and storage
- ✅ AI-powered video segmentation  
- ✅ Professional image generation
- ✅ Multi-persona content creation
- ✅ External APIs for other tools
- ✅ Social media integration
- ✅ Cost-optimized AI routing

Your platform is production-ready with just the core setup!
