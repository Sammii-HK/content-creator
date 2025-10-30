/**
 * Cloudflare Worker for Automated Content Generation
 * Runs every 12 hours to generate new content batches
 */

const ContentGeneratorWorker = {
  async scheduled(_controller, env, _ctx) {
    console.log('🎬 Starting automated content generation...');
    
    try {
      // Generate content with trending topics
      const response = await fetch(`${env.VERCEL_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.CRON_SECRET}`,
          'User-Agent': 'Cloudflare-Worker-Content-Generator'
        },
        body: JSON.stringify({
          theme: 'trending topic',
          generateVariants: 2,
          includeTrends: true,
          duration: 10
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Content generation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Content generation completed:', {
        videosGenerated: result.results?.length || 0,
        trendsUsed: result.trendsUsed?.length || 0,
        templateUsed: result.templateUsed
      });

      // Log successful generations
      if (result.results) {
        result.results.forEach((video, index) => {
          if (video.videoUrl) {
            console.log(`📹 Generated video ${index + 1}: ${video.videoUrl}`);
          }
        });
      }

    } catch (error) {
      console.error('❌ Content generation failed:', error);
      
      // Could integrate with monitoring service here
      // await sendAlert('Automated content generation failed', error.message, env);
    }
  },

  async fetch(request, env, ctx) {
    if (request.method === 'POST') {
      return this.scheduled(null, env, ctx);
    }
    
    return new Response('Content Generator Worker - Use POST to trigger manually', {
      status: 200
    });
  }
};

export default ContentGeneratorWorker;
