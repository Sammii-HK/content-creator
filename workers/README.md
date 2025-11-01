# Smart Content Studio - Cloudflare Workers

This directory contains Cloudflare Workers that replace cron jobs for automated tasks.

## Workers Overview

### 🔍 **trend-collector.js**
- **Schedule**: Every 6 hours
- **Purpose**: Collects trending topics from various APIs
- **Endpoint**: `POST /api/trends`

### 🧠 **model-retrainer.js**
- **Schedule**: Daily at 2 AM UTC
- **Purpose**: Retrains the ML engagement prediction model
- **Endpoint**: `POST /api/ml/retrain`

### 🎬 **content-generator.js**
- **Schedule**: Every 12 hours
- **Purpose**: Automatically generates new content batches
- **Endpoint**: `POST /api/generate`

### 📊 **template-optimizer.js**
- **Schedule**: Every 12 hours (offset)
- **Purpose**: Updates template performance and triggers refinements
- **Endpoint**: `POST /api/templates/{id}/update-performance`

### 🏥 **health-monitor.js**
- **Schedule**: Every hour
- **Purpose**: Monitors system health and endpoint availability
- **Endpoint**: `GET /api/health`

## Deployment Instructions

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Set Environment Variables
For each worker, set these variables in Cloudflare dashboard:
- `VERCEL_URL`: Your deployed Vercel app URL
- `CRON_SECRET`: Secret key for authenticating cron requests

### 4. Deploy Workers
```bash
cd workers
wrangler deploy trend-collector.js
wrangler deploy model-retrainer.js
wrangler deploy content-generator.js
wrangler deploy template-optimizer.js
wrangler deploy health-monitor.js
```

### 5. Alternative: Deploy All at Once
```bash
wrangler deploy --config wrangler.toml
```

## Environment Variables Required

Set these in your Cloudflare Workers dashboard:

```
VERCEL_URL=https://your-smart-content-studio.vercel.app
CRON_SECRET=your-secure-cron-secret-key
```

## Manual Triggers

Each worker can be triggered manually by sending a POST request to the worker URL:

```bash
# Trigger trend collection
curl -X POST https://smart-content-trend-collector.your-subdomain.workers.dev

# Trigger model retraining  
curl -X POST https://smart-content-model-retrainer.your-subdomain.workers.dev

# etc.
```

## Monitoring

Workers automatically log their activities. Check the Cloudflare Workers dashboard for:
- Execution logs
- Error reports
- Performance metrics
- Cron trigger history

## Benefits vs GitHub Actions

✅ **Advantages of Cloudflare Workers:**
- No GitHub repository required
- Better global distribution
- Lower latency
- More reliable scheduling
- Built-in monitoring and logging
- No external dependencies

❌ **Removed GitHub Actions:**
- Deleted `.github/workflows/scheduled-tasks.yml`
- Removed Vercel cron jobs from `vercel.json`
- All scheduling now handled by Cloudflare Workers

## Cost

Cloudflare Workers free tier includes:
- 100,000 requests per day
- 10ms CPU time per request
- More than sufficient for these cron jobs

## Security

- Workers authenticate with your Vercel app using `CRON_SECRET`
- No sensitive data stored in worker code
- All environment variables encrypted in Cloudflare
