/**
 * Cloudflare Worker for Template Performance Updates
 * Runs every 12 hours to update template performance metrics
 */

const TemplateOptimizerWorker = {
  async scheduled(_controller, env, _ctx) {
    console.log('📊 Starting template performance updates...');
    
    try {
      // Get all active templates to update their performance
      const templatesResponse = await fetch(`${env.VERCEL_URL}/api/templates?includePerformance=true`, {
        headers: {
          'Authorization': `Bearer ${env.CRON_SECRET}`,
          'User-Agent': 'Cloudflare-Worker-Template-Optimizer'
        }
      });

      if (!templatesResponse.ok) {
        throw new Error(`Failed to fetch templates: ${templatesResponse.status}`);
      }

      const { templates } = await templatesResponse.json();
      console.log(`📋 Found ${templates.length} templates to update`);

      let updatedCount = 0;
      let refinedCount = 0;

      // Update performance for each template
      for (const template of templates) {
        try {
          // Update performance metrics
          const updateResponse = await fetch(`${env.VERCEL_URL}/api/templates/${template.id}/update-performance`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.CRON_SECRET}`,
              'User-Agent': 'Cloudflare-Worker-Template-Optimizer'
            }
          });

          if (updateResponse.ok) {
            updatedCount++;
            
            // If performance is below threshold, trigger refinement
            const performanceData = await updateResponse.json();
            if (performanceData.score < 60) { // Below 60% performance
              console.log(`🔧 Template "${template.name}" underperforming (${performanceData.score}%), triggering refinement...`);
              
              const refineResponse = await fetch(`${env.VERCEL_URL}/api/templates/${template.id}/refine`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${env.CRON_SECRET}`,
                  'User-Agent': 'Cloudflare-Worker-Template-Optimizer'
                }
              });

              if (refineResponse.ok) {
                refinedCount++;
                const refinementResult = await refineResponse.json();
                console.log(`✨ Template refined with ${refinementResult.suggestions?.changes?.length || 0} improvements`);
              }
            }
          }
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (templateError) {
          console.error(`❌ Failed to update template ${template.id}:`, templateError);
        }
      }

      console.log(`✅ Template optimization completed: ${updatedCount} updated, ${refinedCount} refined`);

    } catch (error) {
      console.error('❌ Template optimization failed:', error);
      
      // Could integrate with monitoring service here
      // await sendAlert('Template optimization failed', error.message, env);
    }
  },

  async fetch(request, env, ctx) {
    if (request.method === 'POST') {
      return this.scheduled(null, env, ctx);
    }
    
    return new Response('Template Optimizer Worker - Use POST to trigger manually', {
      status: 200
    });
  }
};

export default TemplateOptimizerWorker;
