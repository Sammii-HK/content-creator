import { db } from './db';

export interface BrollSegmentData {
  name: string;
  startTime: number;
  endTime: number;
  quality: number; // 1-10 rating
  mood?: string;
  description?: string;
  tags: string[];
  isUsable: boolean;
}

export interface SegmentSelectionCriteria {
  mood?: string;
  minQuality?: number;
  tags?: string[];
  duration?: number; // Desired segment duration
  excludeOverused?: boolean; // Avoid segments used too many times
}

export class BrollSegmentService {
  /**
   * Add segments to a B-roll video with timestamps and quality ratings
   */
  async addSegments(brollId: string, segments: BrollSegmentData[]) {
    const createdSegments = [];
    
    for (const segment of segments) {
      const created = await db.brollSegment.create({
        data: {
          brollId,
          ...segment
        }
      });
      createdSegments.push(created);
    }
    
    return createdSegments;
  }

  /**
   * Find the best segment for video generation based on criteria
   */
  async findBestSegment(criteria: SegmentSelectionCriteria) {
    const {
      mood,
      minQuality = 6,
      tags = [],
      duration,
      excludeOverused = true
    } = criteria;

    const where: any = {
      isUsable: true,
      quality: { gte: minQuality }
    };

    // Filter by mood if specified
    if (mood) {
      where.mood = mood;
    }

    // Filter by tags if specified
    if (tags.length > 0) {
      where.tags = {
        hasSome: tags
      };
    }

    // Exclude overused segments
    if (excludeOverused) {
      where.usageCount = { lt: 5 }; // Used less than 5 times
    }

    // Filter by duration if specified
    if (duration) {
      const tolerance = 2; // ±2 seconds tolerance
      where.AND = [
        { 
          OR: [
            { 
              // Segment duration matches desired duration
              AND: [
                { endTime: { lte: duration + tolerance } },
                { endTime: { gte: duration - tolerance } }
              ]
            },
            {
              // Segment is longer than desired (can be trimmed)
              endTime: { gte: duration + tolerance }
            }
          ]
        }
      ];
    }

    // Get segments with their parent B-roll info
    const segments = await db.brollSegment.findMany({
      where,
      include: {
        broll: true
      },
      orderBy: [
        { quality: 'desc' },     // Highest quality first
        { usageCount: 'asc' },   // Least used first
        { endTime: 'desc' }      // Longer segments first
      ],
      take: 10 // Get top 10 candidates
    });

    if (segments.length === 0) {
      return null;
    }

    // Score each segment based on criteria
    const scoredSegments = segments.map(segment => {
      let score = segment.quality * 10; // Base score from quality

      // Bonus for exact mood match
      if (mood && segment.mood === mood) {
        score += 20;
      }

      // Bonus for tag matches
      const tagMatches = tags.filter(tag => segment.tags.includes(tag)).length;
      score += tagMatches * 5;

      // Penalty for overuse
      score -= segment.usageCount * 2;

      // Duration bonus/penalty
      if (duration) {
        const segmentDuration = segment.endTime - segment.startTime;
        const durationDiff = Math.abs(segmentDuration - duration);
        score -= durationDiff * 2; // Penalty for duration mismatch
      }

      return {
        ...segment,
        score,
        segmentDuration: segment.endTime - segment.startTime
      };
    });

    // Return the highest scoring segment
    return scoredSegments.sort((a, b) => b.score - a.score)[0];
  }

  /**
   * Mark a segment as used (increment usage count)
   */
  async markSegmentUsed(segmentId: string) {
    return await db.brollSegment.update({
      where: { id: segmentId },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });
  }

  /**
   * Rate a segment's quality and usability
   */
  async rateSegment(segmentId: string, quality: number, isUsable: boolean, notes?: string) {
    return await db.brollSegment.update({
      where: { id: segmentId },
      data: {
        quality,
        isUsable,
        description: notes ? `${notes} (Updated rating)` : undefined
      }
    });
  }

  /**
   * Get all segments for a B-roll video
   */
  async getSegmentsForBroll(brollId: string) {
    return await db.brollSegment.findMany({
      where: { brollId },
      orderBy: [
        { startTime: 'asc' }
      ]
    });
  }

  /**
   * Get segment analytics
   */
  async getSegmentAnalytics(segmentId: string) {
    const segment = await db.brollSegment.findUnique({
      where: { id: segmentId },
      include: {
        videos: {
          include: {
            metrics: true
          }
        }
      }
    });

    if (!segment) {
      throw new Error('Segment not found');
    }

    const videosUsingSegment = segment.videos.filter(v => v.metrics);
    const avgEngagement = videosUsingSegment.length > 0 
      ? videosUsingSegment.reduce((sum, v) => sum + (v.metrics?.engagement || 0), 0) / videosUsingSegment.length
      : 0;

    return {
      segment,
      usage: {
        timesUsed: segment.usageCount,
        videosGenerated: videosUsingSegment.length,
        avgEngagement,
        bestPerforming: videosUsingSegment
          .sort((a, b) => (b.metrics?.engagement || 0) - (a.metrics?.engagement || 0))
          .slice(0, 3)
      }
    };
  }

  /**
   * Suggest segments based on template and content
   */
  async suggestSegments(templateName: string, contentTheme: string, contentMood: string) {
    // Template-based suggestions
    const templateMoods: Record<string, string[]> = {
      'Hook + Facts': ['energetic', 'dynamic', 'attention-grabbing'],
      'Question + Answer': ['curious', 'thoughtful', 'engaging'],
      'Countdown List': ['fast', 'exciting', 'rhythmic']
    };

    // Content theme to mood mapping
    const themeMoods: Record<string, string[]> = {
      'productivity': ['focused', 'clean', 'modern'],
      'technology': ['sleek', 'futuristic', 'dynamic'],
      'lifestyle': ['relaxed', 'natural', 'warm'],
      'education': ['clear', 'professional', 'calm']
    };

    const suggestedMoods = [
      ...(templateMoods[templateName] || []),
      ...(themeMoods[contentTheme] || []),
      contentMood
    ].filter(Boolean);

    // Find segments matching the criteria
    const suggestions = await Promise.all(
      suggestedMoods.map(mood => 
        this.findBestSegment({
          mood,
          minQuality: 6,
          excludeOverused: true
        })
      )
    );

    return suggestions.filter(Boolean).slice(0, 3); // Top 3 suggestions
  }
}

export const brollSegmentService = new BrollSegmentService();
