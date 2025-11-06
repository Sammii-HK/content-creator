import { NextRequest, NextResponse } from 'next/server';
import { succulentService } from '@/lib/succulent-integration';
import { digitalMeService } from '@/lib/digitalMe';
import { db } from '@/lib/db';
import { z } from 'zod';

const PostRequestSchema = z.object({
  accountIds: z.array(z.string()).min(1, 'At least one account is required'),
  prompt: z.string().min(1, 'Content prompt is required'),
  videoUrl: z.string().optional(),
  scheduledAt: z.string().optional(),
  usePersona: z.boolean().default(true)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountIds, prompt, videoUrl, scheduledAt, usePersona } = PostRequestSchema.parse(body);

    console.log('📤 Creating content for Succulent accounts:', accountIds.length);

    const results = [];

    for (const accountId of accountIds) {
      try {
        // Get account info from Succulent
        const accounts = await succulentService.getConnectedAccounts();
        const account = accounts.find(a => a.id === accountId);

        if (!account) {
          results.push({
            accountId,
            success: false,
            error: 'Account not found in Succulent'
          });
          continue;
        }

        let content;

        if (usePersona) {
          // Find matching persona for this account's niche
          const persona = await db.voiceProfile.findFirst({
            where: { 
              niche: account.platform,
              isActive: true 
            }
          });

          if (persona) {
            // Generate content using the persona's voice
            content = await digitalMeService.generateAuthenticContent(
              prompt,
              {
                theme: persona.niche,
                platform: account.platform as any
              }
            );
          } else {
            // Fallback to generic content
            content = {
              hook: prompt.split(' ').slice(0, 8).join(' '),
              script: [prompt],
              caption: prompt,
              hashtags: [account.platform, 'content'],
              tone: 'authentic'
            };
          }
        } else {
          // Use generic content
          content = {
            hook: prompt.split(' ').slice(0, 8).join(' '),
            script: [prompt],
            caption: prompt,
            hashtags: [account.platform, 'content'],
            tone: 'authentic'
          };
        }

        // Format for Succulent
        const postData = {
          accountIds: [accountId],
          content: {
            caption: `${content.hook}\n\n${content.script.join(' ')}\n\n${content.caption}`,
            hashtags: content.hashtags,
            mediaUrl: videoUrl
          },
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
        };

        // Post via Succulent
        const postResult = await succulentService.postContent(postData);

        results.push({
          accountId,
          account: account.username,
          platform: account.platform,
          success: true,
          postId: postResult.id,
          content: content,
          scheduledAt: scheduledAt || 'immediate'
        });

      } catch (error) {
        results.push({
          accountId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      results,
      summary: {
        totalAccounts: accountIds.length,
        successful: successCount,
        failed: accountIds.length - successCount
      },
      message: `Posted to ${successCount}/${accountIds.length} accounts via Succulent`
    });

  } catch (error) {
    console.error('❌ Succulent posting failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to post via Succulent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
