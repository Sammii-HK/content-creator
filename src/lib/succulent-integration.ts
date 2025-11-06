/**
 * Succulent Social Media Platform Integration
 * Connect to retrieve account data and post content
 */

import { digitalMeService } from './digitalMe';

export interface SucculentAccount {
  id: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'linkedin';
  username: string;
  displayName: string;
  followerCount: number;
  isActive: boolean;
  persona?: string; // Connected Digital Me persona
}

export interface SucculentPost {
  id: string;
  accountId: string;
  platform: string;
  content: string;
  mediaUrls: string[];
  publishedAt: Date;
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    engagement?: number;
  };
}

export interface PostRequest {
  accountIds: string[]; // Which accounts to post to
  content: {
    caption: string;
    hashtags: string[];
    mediaUrl?: string;
  };
  scheduledAt?: Date;
}

export class SucculentService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.SUCCULENT_API_KEY || '';
    this.baseUrl = process.env.SUCCULENT_API_URL || 'https://api.succulent.app/v1';
  }

  /**
   * Get all connected social accounts from Succulent
   */
  async getConnectedAccounts(): Promise<SucculentAccount[]> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Succulent API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.accounts || [];

    } catch (error) {
      console.error('Failed to fetch Succulent accounts:', error);
      throw error;
    }
  }

  /**
   * Get post history and metrics from specific accounts
   */
  async getPostHistory(
    accountIds: string[], 
    limit: number = 50,
    dateFrom?: Date
  ): Promise<SucculentPost[]> {
    try {
      const params = new URLSearchParams({
        accounts: accountIds.join(','),
        limit: limit.toString()
      });

      if (dateFrom) {
        params.append('from', dateFrom.toISOString());
      }

      const response = await fetch(`${this.baseUrl}/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Succulent API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.posts || [];

    } catch (error) {
      console.error('Failed to fetch post history:', error);
      throw error;
    }
  }

  /**
   * Post content to multiple accounts via Succulent
   */
  async postContent(postRequest: PostRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accounts: postRequest.accountIds,
          content: {
            text: postRequest.content.caption,
            hashtags: postRequest.content.hashtags,
            media: postRequest.content.mediaUrl ? [postRequest.content.mediaUrl] : []
          },
          scheduledAt: postRequest.scheduledAt?.toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Succulent post failed: ${error.error || response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Failed to post via Succulent:', error);
      throw error;
    }
  }

  /**
   * Get account analytics from Succulent
   */
  async getAccountAnalytics(accountId: string, days: number = 30): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/${accountId}/analytics?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Succulent API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.analytics;

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      throw error;
    }
  }

  /**
   * Sync persona performance data with Digital Me
   */
  async syncPersonaPerformance(): Promise<void> {
    console.log('🔄 Syncing persona performance from Succulent...');

    try {
      // Get all accounts
      const accounts = await this.getConnectedAccounts();

      for (const account of accounts) {
        if (!account.persona) continue;

        // Get recent posts for this account
        const posts = await this.getPostHistory([account.id], 20);

        // Convert to voice examples with engagement data
        const engagementData = posts.map(post => ({
          content: post.content,
          tone: 'authentic', // Could be analyzed
          theme: account.platform,
          engagement: post.metrics.engagement || 0
        }));

        // Update the connected persona
        if (engagementData.length > 0) {
          await digitalMeService.updateVoiceProfile(engagementData);
        }
      }

      console.log('✅ Persona performance synced from Succulent');

    } catch (error) {
      console.error('Failed to sync persona performance:', error);
      throw error;
    }
  }
}

export const succulentService = new SucculentService();
