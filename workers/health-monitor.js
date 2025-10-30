/**
 * Cloudflare Worker for Health Monitoring
 * Runs every hour to check system health and performance
 */

const HealthMonitorWorker = {
  async scheduled(_controller, env, _ctx) {
    console.log('🏥 Starting health check...');
    
    try {
      // Check main health endpoint
      const healthResponse = await fetch(`${env.VERCEL_URL}/api/health`, {
        headers: {
          'User-Agent': 'Cloudflare-Worker-Health-Monitor'
        }
      });

      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
      }

      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', {
        status: healthData.status,
        totalVideos: healthData.stats?.totalVideos,
        totalTemplates: healthData.stats?.totalTemplates,
        recentTrends: healthData.stats?.recentTrends
      });

      // Check critical endpoints
      const criticalEndpoints = [
        '/api/generate',
        '/api/templates',
        '/api/trends',
        '/api/metrics/sync'
      ];

      const endpointChecks = await Promise.allSettled(
        criticalEndpoints.map(async (endpoint) => {
          const response = await fetch(`${env.VERCEL_URL}${endpoint}`, {
            method: 'GET',
            headers: {
              'User-Agent': 'Cloudflare-Worker-Health-Monitor'
            }
          });
          return { endpoint, status: response.status, ok: response.ok };
        })
      );

      const failedEndpoints = endpointChecks
        .filter(result => result.status === 'fulfilled' && !result.value.ok)
        .map(result => result.value);

      if (failedEndpoints.length > 0) {
        console.warn('⚠️ Some endpoints are unhealthy:', failedEndpoints);
        // Could send alerts here for failed endpoints
      } else {
        console.log('✅ All critical endpoints healthy');
      }

      // Check database connectivity (via health endpoint stats)
      if (!healthData.stats || Object.keys(healthData.stats).length === 0) {
        console.warn('⚠️ Database connectivity issues detected');
      }

    } catch (error) {
      console.error('❌ Health check failed:', error);
      
      // Send critical alert for complete system failure
      // await sendCriticalAlert('System health check failed', error.message, env);
    }
  },

  async fetch(request, env, ctx) {
    if (request.method === 'POST') {
      return this.scheduled(null, env, ctx);
    }
    
    return new Response('Health Monitor Worker - Use POST to trigger manually', {
      status: 200
    });
  }
};

export default HealthMonitorWorker;
