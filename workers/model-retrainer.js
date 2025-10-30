/**
 * Cloudflare Worker for ML Model Retraining
 * Runs daily at 2 AM UTC to retrain the engagement prediction model
 */

const ModelRetrainerWorker = {
  async scheduled(_controller, env, _ctx) {
    console.log('🧠 Starting ML model retraining...');
    
    try {
      const response = await fetch(`${env.VERCEL_URL}/api/ml/retrain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.CRON_SECRET}`,
          'User-Agent': 'Cloudflare-Worker-Model-Retrainer'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Model retraining failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Model retraining completed:', result);

      // Log performance improvements
      if (result.performance) {
        console.log(`📊 Model Performance: ${result.performance.accuracy * 100}% accuracy with ${result.performance.trainingSamples} samples`);
      }

    } catch (error) {
      console.error('❌ Model retraining failed:', error);
      
      // Could integrate with monitoring service here
      // await sendAlert('ML Model retraining failed', error.message, env);
    }
  },

  async fetch(request, env, ctx) {
    if (request.method === 'POST') {
      return this.scheduled(null, env, ctx);
    }
    
    return new Response('Model Retrainer Worker - Use POST to trigger manually', {
      status: 200
    });
  }
};

export default ModelRetrainerWorker;
