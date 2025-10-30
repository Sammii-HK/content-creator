# Smart Content Studio

A self-learning, AI-driven system that generates, analyses, and optimises short-form social videos automatically. It combines LLM-based script generation, ffmpeg video rendering, visual analysis, engagement prediction, and trend awareness to continually improve content performance.

## Features

- 🤖 **AI Content Generation**: Uses OpenAI GPT-4-mini with Vercel AI SDK for script and caption generation
- 🎬 **Video Rendering**: FFmpeg-based video composition with customizable templates
- 📊 **Analytics Integration**: Webhook-based metrics collection from your social media scheduler
- 🧠 **Machine Learning**: Engagement prediction and automatic content optimization
- 📈 **A/B Testing**: Automated variant generation and performance comparison
- 🔍 **Trend Awareness**: Real-time trending topic integration
- 📋 **Template System**: JSON-based video templates with performance tracking
- 🎯 **Content Management**: B-roll video library with tagging and categorization

## Tech Stack

- **Frontend**: Next.js 14 + TailwindCSS + Chart.js
- **Backend**: Next.js App Router APIs
- **Database**: Prisma ORM + PostgreSQL (Neon)
- **Storage**: Vercel Blob for video assets
- **Video**: ffmpeg-static + fluent-ffmpeg
- **AI**: Vercel AI SDK + OpenAI GPT-4-mini
- **Scheduler**: GitHub Actions + Vercel Cron Jobs

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- OpenAI API key
- Vercel account (for deployment)

### Installation

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd content-creator
   npm install
   ```

2. **Environment setup**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   DATABASE_URL=your_postgresql_url
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   ANALYTICS_API_KEY=your_analytics_api_key
   RAPIDAPI_KEY=your_rapidapi_key
   ```

3. **Database setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. **Development**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` to see the application.

## Usage

### Dashboard

Access the main dashboard at `/dashboard` to:
- View analytics and performance metrics
- Generate new content batches
- Manage templates and B-roll content
- Monitor A/B test results
- Retrain ML models

### API Endpoints

- `POST /api/generate` - Generate new video content
- `GET /api/templates` - List video templates
- `POST /api/templates/{id}/refine` - AI-powered template refinement
- `POST /api/metrics/sync` - Webhook for analytics data
- `POST /api/score` - ML-based engagement prediction
- `POST /api/abtest` - Create A/B tests
- `GET /api/trends` - Current trending topics

### Content Generation

1. **Manual Generation**: Use the dashboard to create content with specific themes and parameters
2. **Automated Generation**: Scheduled jobs automatically create content based on trending topics
3. **A/B Testing**: Generate multiple variants to test different approaches

### Analytics Integration

Set up webhooks from your social media scheduler to send performance data:

```javascript
// Webhook payload example
{
  "videoId": "video_id_from_database",
  "platform": "tiktok",
  "postId": "platform_post_id",
  "metrics": {
    "views": 1000,
    "likes": 50,
    "shares": 5,
    "comments": 10,
    "completionRate": 75.5,
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "apiKey": "your_analytics_api_key"
}
```

## Learning Cycle

The system continuously improves through:

1. **Content Generation**: Create videos using AI and templates
2. **Performance Prediction**: ML models predict engagement before posting
3. **Analytics Collection**: Gather real performance data via webhooks
4. **Model Retraining**: Update ML models with new performance data
5. **Template Refinement**: AI suggests improvements to templates
6. **A/B Testing**: Test variations to find optimal approaches

## Deployment

### Vercel (Recommended)

1. **Deploy to Vercel**
   ```bash
   npm run build
   vercel --prod
   ```

2. **Set environment variables** in Vercel dashboard

3. **Configure webhooks** in your social media scheduler to point to your deployed API

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## Configuration

### Templates

Templates are stored in the database and define:
- Video duration and timing
- Text overlay positions and styling
- Visual filters and effects
- Scene transitions

### B-roll Content

Manage video assets through the content management interface:
- Upload or reference video files
- Tag and categorize content
- Set duration and usage preferences

### ML Model

The engagement prediction model learns from:
- Visual features (brightness, contrast, motion)
- Content features (hook strength, length, tone)
- Performance metrics (views, likes, completion rate)

## API Reference

### Generate Content

```bash
curl -X POST /api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "productivity tips",
    "tone": "energetic",
    "duration": 10,
    "generateVariants": 3,
    "includeTrends": true
  }'
```

### Webhook Integration

```bash
curl -X POST /api/metrics/sync \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "video_123",
    "platform": "tiktok",
    "postId": "post_456",
    "metrics": {
      "views": 1000,
      "likes": 50,
      "engagement": 75.5
    },
    "apiKey": "your_api_key"
  }'
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Check the GitHub issues
- Review the API documentation
- Check the health endpoint: `/api/health`