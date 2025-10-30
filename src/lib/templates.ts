import { db } from './db';
import { llmService } from './llm';
import type { VideoTemplate } from './video';

export interface TemplatePerformance {
  totalVideos: number;
  avgViews: number;
  avgLikes: number;
  avgEngagement: number;
  avgCompletionRate: number;
  score: number; // Calculated performance score
}

export class TemplateService {
  /**
   * Get all active templates with performance data
   */
  async getAllTemplates() {
    const templates = await db.template.findMany({
      where: { isActive: true },
      include: {
        videos: {
          include: {
            metrics: true
          }
        }
      },
      orderBy: { performance: 'desc' }
    });

    return templates.map(template => ({
      ...template,
      performanceData: this.calculatePerformance(template.videos)
    }));
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string) {
    return await db.template.findUnique({
      where: { id },
      include: {
        videos: {
          include: {
            metrics: true
          }
        }
      }
    });
  }

  /**
   * Get best performing templates for a specific category
   */
  async getBestTemplates(limit: number = 5) {
    return await db.template.findMany({
      where: { 
        isActive: true,
        performance: { not: null }
      },
      orderBy: { performance: 'desc' },
      take: limit,
      include: {
        videos: {
          include: {
            metrics: true
          },
          orderBy: { createdAt: 'desc' },
          take: 3 // Recent videos for context
        }
      }
    });
  }

  /**
   * Create a new template
   */
  async createTemplate(name: string, templateJson: VideoTemplate, parentId?: string) {
    return await db.template.create({
      data: {
        name,
        json: JSON.parse(JSON.stringify(templateJson)),
        parentId,
        isActive: true
      }
    });
  }

  /**
   * Update template performance based on video metrics
   */
  async updateTemplatePerformance(templateId: string) {
    const template = await db.template.findUnique({
      where: { id: templateId },
      include: {
        videos: {
          include: {
            metrics: true
          }
        }
      }
    });

    if (!template) {
      throw new Error('Template not found');
    }

    const performance = this.calculatePerformance(template.videos);
    
    await db.template.update({
      where: { id: templateId },
      data: { performance: performance.score }
    });

    return performance;
  }

  /**
   * Refine template using AI based on performance data
   */
  async refineTemplate(templateId: string) {
    const template = await db.template.findUnique({
      where: { id: templateId },
      include: {
        videos: {
          include: {
            metrics: true
          }
        }
      }
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Separate high and low performing videos
    const videosWithMetrics = template.videos.filter(v => v.metrics);
    const avgEngagement = videosWithMetrics.reduce((sum, v) => 
      sum + (v.metrics?.engagement || 0), 0) / videosWithMetrics.length;

    const highPerforming = videosWithMetrics.filter(v => 
      (v.metrics?.engagement || 0) > avgEngagement * 1.2);
    const lowPerforming = videosWithMetrics.filter(v => 
      (v.metrics?.engagement || 0) < avgEngagement * 0.8);

    // Use LLM to suggest improvements
    const refinementSuggestions = await llmService.refineTemplate(
      template.json,
      {
        avgEngagement,
        topPerformingVideos: highPerforming,
        lowPerformingVideos: lowPerforming
      }
    );

    // Apply suggested changes to create new template version
    const refinedTemplate = this.applyRefinements(
      template.json as unknown as VideoTemplate,
      refinementSuggestions.changes
    );

    // Create new template version
    const newTemplate = await this.createTemplate(
      `${template.name} v${await this.getNextVersion(template.name)}`,
      refinedTemplate,
      template.id
    );

    return {
      newTemplate,
      suggestions: refinementSuggestions,
      originalPerformance: this.calculatePerformance(template.videos)
    };
  }

  /**
   * Calculate performance metrics for a template
   */
  private calculatePerformance(videos: unknown[]): TemplatePerformance {
    const videosWithMetrics = videos.filter((v: any) => v.metrics);
    
    if (videosWithMetrics.length === 0) {
      return {
        totalVideos: videos.length,
        avgViews: 0,
        avgLikes: 0,
        avgEngagement: 0,
        avgCompletionRate: 0,
        score: 0
      };
    }

    const metrics = videosWithMetrics.map((v: any) => v.metrics);
    
    const avgViews = metrics.reduce((sum, m) => sum + (m.views || 0), 0) / metrics.length;
    const avgLikes = metrics.reduce((sum, m) => sum + (m.likes || 0), 0) / metrics.length;
    const avgEngagement = metrics.reduce((sum, m) => sum + (m.engagement || 0), 0) / metrics.length;
    const avgCompletionRate = metrics.reduce((sum, m) => sum + (m.completionRate || 0), 0) / metrics.length;

    // Calculate composite score (0-100)
    const score = Math.min(100, Math.max(0, 
      (avgEngagement * 0.4) + 
      (avgCompletionRate * 0.3) + 
      (Math.min(avgLikes / avgViews * 100, 20) * 0.2) + // Likes ratio capped at 20%
      (Math.log10(avgViews + 1) * 0.1 * 10) // View count factor
    ));

    return {
      totalVideos: videos.length,
      avgViews,
      avgLikes,
      avgEngagement,
      avgCompletionRate,
      score
    };
  }

  /**
   * Apply refinement suggestions to template
   */
  private applyRefinements(template: VideoTemplate, changes: unknown[]): VideoTemplate {
    const refined = JSON.parse(JSON.stringify(template)); // Deep clone

    changes.forEach((change: any) => {
      try {
        // Apply changes based on field path
        if (change.field.includes('scenes')) {
          // Handle scene-specific changes
          const pathParts = change.field.split('.');
          const sceneIndex = parseInt(pathParts[1]);
          
          if (refined.scenes[sceneIndex]) {
            if (pathParts[2] === 'text' && pathParts[3] === 'style') {
              refined.scenes[sceneIndex].text.style[pathParts[4]] = change.newValue;
            } else if (pathParts[2] === 'text' && pathParts[3] === 'position') {
              refined.scenes[sceneIndex].text.position[pathParts[4]] = change.newValue;
            } else if (pathParts[2] === 'filters') {
              refined.scenes[sceneIndex].filters = change.newValue;
            }
          }
        } else if (change.field === 'duration') {
          refined.duration = change.newValue;
        }
      } catch (error) {
        console.error('Failed to apply refinement:', change, error);
      }
    });

    return refined;
  }

  /**
   * Get next version number for template name
   */
  private async getNextVersion(baseName: string): Promise<number> {
    const existingTemplates = await db.template.findMany({
      where: {
        name: {
          startsWith: baseName
        }
      }
    });

    const versionNumbers = existingTemplates
      .map(t => {
        const match = t.name.match(/v(\d+)$/);
        return match ? parseInt(match[1]) : 1;
      })
      .filter(v => !isNaN(v));

    return Math.max(...versionNumbers, 1) + 1;
  }

  /**
   * Get template evolution history
   */
  async getTemplateEvolution(templateId: string) {
    const template = await db.template.findUnique({
      where: { id: templateId },
      include: {
        parent: true,
        videos: {
          include: {
            metrics: true
          }
        },
        children: {
          include: {
            videos: {
              include: {
                metrics: true
              }
            }
          }
        }
      }
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Build evolution tree
    const evolution = [];
    let current = template.parent;
    
    // Get ancestors
    while (current) {
      const parentWithVideos = await db.template.findUnique({
        where: { id: current.id },
        include: { 
          parent: true, 
          videos: { include: { metrics: true } } 
        }
      });
      
      if (parentWithVideos) {
        evolution.unshift({
          ...parentWithVideos,
          performanceData: this.calculatePerformance(parentWithVideos.videos || [])
        });
      }
      
      current = parentWithVideos?.parent || null;
    }

    // Add current template
    evolution.push({
      ...template,
      performanceData: this.calculatePerformance(template.videos || [])
    });

    // Add children
    template.children.forEach(child => {
      evolution.push({
        ...child,
        performanceData: this.calculatePerformance(child.videos)
      });
    });

    return evolution;
  }

  /**
   * A/B test templates by creating variants
   */
  async createTemplateVariants(baseTemplateId: string, variantCount: number = 2) {
    const baseTemplate = await this.getTemplate(baseTemplateId);
    
    if (!baseTemplate) {
      throw new Error('Base template not found');
    }

    const variants = [];
    
    for (let i = 0; i < variantCount; i++) {
      // Create slight variations
      const variantTemplate = this.createTemplateVariation(
        baseTemplate.json as unknown as VideoTemplate, 
        i + 1
      );
      
      const variant = await this.createTemplate(
        `${baseTemplate.name} - Variant ${i + 1}`,
        variantTemplate,
        baseTemplate.id
      );
      
      variants.push(variant);
    }

    return variants;
  }

  /**
   * Create a template variation
   */
  private createTemplateVariation(baseTemplate: VideoTemplate, variantNumber: number): VideoTemplate {
    const variant = JSON.parse(JSON.stringify(baseTemplate)); // Deep clone

    // Apply different variations based on variant number
    switch (variantNumber) {
      case 1:
        // Variation 1: Adjust text positioning
        variant.scenes.forEach((scene: Record<string, unknown>) => {
          (scene.text as any).position.y += (Math.random() - 0.5) * 20; // ±10% position change
        });
        break;
        
      case 2:
        // Variation 2: Adjust timing
        variant.scenes.forEach((scene: Record<string, unknown>) => {
          const duration = (scene.end as number) - (scene.start as number);
          (scene as any).start += (Math.random() - 0.5) * 1; // ±0.5s timing change
          (scene as any).end = (scene.start as number) + duration;
        });
        break;
        
      case 3:
        // Variation 3: Adjust text styling
        variant.scenes.forEach((scene: Record<string, unknown>) => {
          (scene.text as any).style.fontSize *= (0.9 + Math.random() * 0.2); // ±10% size change
        });
        break;
    }

    return variant;
  }
}

export const templateService = new TemplateService();
