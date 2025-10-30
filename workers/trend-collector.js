/**
 * Cloudflare Worker for Trend Collection
 * Runs every 6 hours to collect trending topics
 */

const TrendCollectorWorker = {
  async scheduled(_controller, env, _ctx) {
    console.log('🔍 Starting trend collection...');
    
    try {
      const response = await fetch(`${env.VERCEL_URL}/api/trends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.CRON_SECRET}`,
          'User-Agent': 'Cloudflare-Worker-Trend-Collector'
        }
      });

      if (!response.ok) {
        throw new Error(`Trend collection failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Trend collection completed:', result);

    } catch (error) {
      console.error('❌ Trend collection failed:', error);
      
      // Optional: Send alert to monitoring service
      // await sendAlert('Trend collection failed', error.message, env);
    }
  },

  async fetch(request, env, ctx) {
    // Handle manual triggers via HTTP
    if (request.method === 'POST') {
      return this.scheduled(null, env, ctx);
    }
    
    return new Response('Trend Collector Worker - Use POST to trigger manually', {
      status: 200
    });
  }
};

export default TrendCollectorWorker;
