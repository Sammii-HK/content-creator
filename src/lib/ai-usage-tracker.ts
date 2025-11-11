import { db } from '@/lib/db';

export interface AIUsageRecord {
  id: string;
  provider: string;
  requestType: string;
  cost: number;
  success: boolean;
  prompt: string;
  quality: string;
  responseTime: number;
  errorMessage?: string;
  metadata: any;
  createdAt: Date;
}

export interface ProviderStatus {
  provider: string;
  isConnected: boolean;
  creditsRemaining?: number;
  monthlyUsage: number;
  monthlySpend: number;
  avgCostPerRequest: number;
  successRate: number;
  avgResponseTime: number;
  lastUsed?: Date;
  needsAttention: boolean;
  alertMessage?: string;
}

export class AIUsageTracker {
  /**
   * Record AI usage for tracking and billing
   */
  async recordUsage(
    provider: string,
    requestType: string,
    cost: number,
    success: boolean,
    prompt: string,
    quality: string,
    responseTime: number,
    errorMessage?: string,
    metadata: any = {},
    personaId?: string
  ): Promise<void> {
    try {
      await db.aiUsage.create({
        data: {
          provider,
          requestType,
          cost,
          success,
          prompt: prompt.slice(0, 500), // Truncate for storage
          quality,
          responseTime,
          errorMessage,
          metadata,
          personaId
        }
      });
    } catch (error) {
      console.error('Failed to record AI usage:', error);
    }
  }

  /**
   * Get usage statistics for all providers
   */
  async getProviderStatuses(personaId?: string): Promise<ProviderStatus[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usage = await db.aiUsage.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        ...(personaId ? { personaId } : {})
      }
    });

    const providers = ['replicate', 'nano-banana', 'stability-ai', 'dalle-3', 'runway-ml'];
    const statuses: ProviderStatus[] = [];

    for (const provider of providers) {
      const providerUsage = usage.filter(u => u.provider === provider);
      const successfulUsage = providerUsage.filter(u => u.success);

      const monthlySpend = providerUsage.reduce((sum, u) => sum + u.cost, 0);
      const avgCost = successfulUsage.length > 0 
        ? successfulUsage.reduce((sum, u) => sum + u.cost, 0) / successfulUsage.length 
        : 0;
      const successRate = providerUsage.length > 0 
        ? (successfulUsage.length / providerUsage.length) * 100 
        : 0;
      const avgResponseTime = successfulUsage.length > 0
        ? successfulUsage.reduce((sum, u) => sum + u.responseTime, 0) / successfulUsage.length
        : 0;

      // Check provider connection and credits
      const connectionStatus = await this.checkProviderConnection(provider);

      const status: ProviderStatus = {
        provider,
        isConnected: connectionStatus.connected,
        creditsRemaining: connectionStatus.credits,
        monthlyUsage: providerUsage.length,
        monthlySpend,
        avgCostPerRequest: avgCost,
        successRate,
        avgResponseTime,
        lastUsed: providerUsage[0]?.createdAt,
        needsAttention: false,
        alertMessage: undefined
      };

      // Determine if needs attention
      if (!status.isConnected) {
        status.needsAttention = true;
        status.alertMessage = 'API key missing or invalid';
      } else if (status.creditsRemaining !== undefined && status.creditsRemaining < 10) {
        status.needsAttention = true;
        status.alertMessage = `Low credits: $${status.creditsRemaining.toFixed(2)} remaining`;
      } else if (status.successRate < 80 && status.monthlyUsage > 5) {
        status.needsAttention = true;
        status.alertMessage = `Low success rate: ${status.successRate.toFixed(1)}%`;
      }

      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Check individual provider connection and credit status
   */
  private async checkProviderConnection(provider: string): Promise<{ connected: boolean; credits?: number }> {
    try {
      switch (provider) {
        case 'replicate':
          return await this.checkReplicate();
        case 'nano-banana':
          return await this.checkNanoBanana();
        case 'stability-ai':
          return await this.checkStabilityAI();
        case 'dalle-3':
          return await this.checkDALLE();
        case 'runway-ml':
          return await this.checkRunway();
        default:
          return { connected: false };
      }
    } catch (error) {
      console.error(`Failed to check ${provider}:`, error);
      return { connected: false };
    }
  }

  private async checkReplicate(): Promise<{ connected: boolean; credits?: number }> {
    if (!process.env.REPLICATE_API_TOKEN) return { connected: false };

    try {
      const response = await fetch('https://api.replicate.com/v1/account', {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          connected: true, 
          credits: data.balance ? parseFloat(data.balance) : undefined 
        };
      }
      return { connected: false };
    } catch {
      return { connected: false };
    }
  }

  private async checkNanoBanana(): Promise<{ connected: boolean; credits?: number }> {
    if (!process.env.NANO_BANANA_API_KEY) return { connected: false };

    try {
      const response = await fetch('https://api.nanobanana.ai/v1/account', {
        headers: { 'Authorization': `Bearer ${process.env.NANO_BANANA_API_KEY}` }
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          connected: true, 
          credits: data.credits ? parseFloat(data.credits) : undefined 
        };
      }
      return { connected: false };
    } catch {
      return { connected: false };
    }
  }

  private async checkStabilityAI(): Promise<{ connected: boolean; credits?: number }> {
    if (!process.env.STABILITY_AI_API_KEY) return { connected: false };

    try {
      const response = await fetch('https://api.stability.ai/v1/user/account', {
        headers: { 'Authorization': `Bearer ${process.env.STABILITY_AI_API_KEY}` }
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          connected: true, 
          credits: data.credits ? parseFloat(data.credits) : undefined 
        };
      }
      return { connected: false };
    } catch {
      return { connected: false };
    }
  }

  private async checkDALLE(): Promise<{ connected: boolean; credits?: number }> {
    if (!process.env.OPENAI_API_KEY) return { connected: false };

    try {
      // OpenAI doesn't have a direct credits endpoint, but we can test the key
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
      });

      return { connected: response.ok };
    } catch {
      return { connected: false };
    }
  }

  private async checkRunway(): Promise<{ connected: boolean; credits?: number }> {
    if (!process.env.RUNWAY_ML_API_KEY) return { connected: false };

    try {
      const response = await fetch('https://api.runwayml.com/v1/user', {
        headers: { 'Authorization': `Bearer ${process.env.RUNWAY_ML_API_KEY}` }
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          connected: true, 
          credits: data.credits ? parseFloat(data.credits) : undefined 
        };
      }
      return { connected: false };
    } catch {
      return { connected: false };
    }
  }

  /**
   * Get cost optimization recommendations
   */
  async getCostOptimizationTips(personaId?: string): Promise<string[]> {
    const statuses = await this.getProviderStatuses(personaId);
    const tips = [];

    const cheapest = statuses
      .filter(s => s.isConnected)
      .sort((a, b) => a.avgCostPerRequest - b.avgCostPerRequest)[0];

    if (cheapest) {
      tips.push(`💰 ${cheapest.provider} is your cheapest option at $${cheapest.avgCostPerRequest.toFixed(3)} per image`);
    }

    const fastest = statuses
      .filter(s => s.isConnected && s.avgResponseTime > 0)
      .sort((a, b) => a.avgResponseTime - b.avgResponseTime)[0];

    if (fastest) {
      tips.push(`⚡ ${fastest.provider} is fastest with ${fastest.avgResponseTime.toFixed(1)}s response time`);
    }

    const mostReliable = statuses
      .filter(s => s.isConnected)
      .sort((a, b) => b.successRate - a.successRate)[0];

    if (mostReliable) {
      tips.push(`✅ ${mostReliable.provider} is most reliable with ${mostReliable.successRate.toFixed(1)}% success rate`);
    }

    return tips;
  }

  /**
   * Get spending alerts
   */
  async getSpendingAlerts(personaId?: string): Promise<string[]> {
    const statuses = await this.getProviderStatuses(personaId);
    const alerts = [];

    for (const status of statuses) {
      if (status.needsAttention && status.alertMessage) {
        alerts.push(`⚠️ ${status.provider}: ${status.alertMessage}`);
      }

      if (status.monthlySpend > 50) {
        alerts.push(`💸 ${status.provider}: High monthly spend ($${status.monthlySpend.toFixed(2)})`);
      }
    }

    return alerts;
  }
}

export const aiUsageTracker = new AIUsageTracker();
