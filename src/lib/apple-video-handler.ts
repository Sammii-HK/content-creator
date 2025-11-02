/**
 * Apple Video Handler - Production-ready support for all iPhone/iPad video formats
 * Handles MOV, HEVC, H.264, and other Apple formats without requiring user conversion
 */

export interface AppleVideoInfo {
  duration: number;
  width: number;
  height: number;
  format: string;
  codec: string;
  fileSize: number;
}

export class AppleVideoHandler {
  /**
   * Detect if this is an Apple video format
   */
  static isAppleVideo(file: File): boolean {
    const appleFormats = [
      'video/quicktime',      // .MOV files
      'video/mp4',            // iPhone MP4
      'video/x-m4v',          // M4V files
      'video/hevc',           // HEVC codec
      'video/h264',           // H.264 codec
    ];

    const appleExtensions = ['.mov', '.mp4', '.m4v', '.hevc'];
    
    return (
      appleFormats.includes(file.type) ||
      appleExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) ||
      file.name.match(/^IMG_\d+\.(MOV|mp4|m4v)$/i) !== null // iPhone naming pattern
    );
  }

  /**
   * Get video information without conversion (production-safe)
   */
  static async getVideoInfo(file: File): Promise<AppleVideoInfo> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        const info: AppleVideoInfo = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          format: file.type || 'unknown',
          codec: 'unknown', // Would need deeper analysis
          fileSize: file.size
        };
        
        URL.revokeObjectURL(url);
        resolve(info);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      };

      video.src = url;
    });
  }

  /**
   * Validate Apple video for upload (very permissive)
   */
  static validateAppleVideo(file: File): { valid: boolean; error?: string } {
    // Size check (500MB max for Apple videos)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Video too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum is 500MB.`
      };
    }

    // Empty file check
    if (file.size === 0) {
      return {
        valid: false,
        error: 'Video file appears to be empty.'
      };
    }

    // Apple format check
    if (!this.isAppleVideo(file)) {
      return {
        valid: false,
        error: `Unsupported format: ${file.type}. Expected iPhone/iPad video formats.`
      };
    }

    return { valid: true };
  }

  /**
   * Prepare Apple video for Vercel Blob upload
   */
  static async prepareForUpload(file: File, metadata: {
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
  }) {
    console.log('Preparing Apple video for upload:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)}MB`
    });

    // Get video information
    let videoInfo: AppleVideoInfo;
    try {
      videoInfo = await this.getVideoInfo(file);
      console.log('Video info detected:', videoInfo);
    } catch (error) {
      console.warn('Could not read video metadata, using defaults:', error);
      videoInfo = {
        duration: Math.max(5, Math.min(300, Math.round(file.size / (1024 * 1024) * 8))),
        width: 1920,
        height: 1080,
        format: file.type || 'video/quicktime',
        codec: 'unknown',
        fileSize: file.size
      };
    }

    // Auto-categorize Apple videos
    const autoCategory = this.categorizeAppleVideo(file.name, metadata.description || '');
    
    // Generate basic tags
    const autoTags = this.generateAppleTags(file.name, metadata.description || '', videoInfo);

    return {
      videoInfo,
      uploadData: {
        name: metadata.name || file.name.replace(/\.[^/.]+$/, ""),
        description: metadata.description || `iPhone video: ${file.name}`,
        duration: Math.round(videoInfo.duration),
        category: metadata.category || autoCategory,
        tags: [...(metadata.tags || []), ...autoTags],
        format: videoInfo.format,
        resolution: `${videoInfo.width}x${videoInfo.height}`
      }
    };
  }

  /**
   * Smart categorization for Apple videos
   */
  private static categorizeAppleVideo(fileName: string, description: string): string {
    const text = `${fileName} ${description}`.toLowerCase();
    
    // iPhone naming patterns and content analysis
    if (text.match(/\b(selfie|face|me|myself|talking|speaking|portrait)\b/)) {
      return 'personal';
    }
    
    if (text.match(/\b(desk|computer|laptop|workspace|office|coding|work|setup)\b/)) {
      return 'workspace';
    }
    
    if (text.match(/\b(coffee|food|cooking|kitchen|home|morning|routine|lifestyle|daily)\b/)) {
      return 'lifestyle';
    }
    
    if (text.match(/\b(outside|nature|sky|tree|water|beach|park|outdoor|sunset|sunrise)\b/)) {
      return 'nature';
    }
    
    if (text.match(/\b(city|street|building|urban|downtown|traffic|lights)\b/)) {
      return 'urban';
    }
    
    // Default for iPhone videos
    return 'personal';
  }

  /**
   * Generate relevant tags for Apple videos
   */
  private static generateAppleTags(fileName: string, description: string, videoInfo: AppleVideoInfo): string[] {
    const tags = ['apple', 'iphone'];
    
    // Add format-specific tags
    if (fileName.toLowerCase().endsWith('.mov')) {
      tags.push('mov', 'quicktime');
    }
    
    // Add orientation tags
    if (videoInfo.height > videoInfo.width) {
      tags.push('vertical', 'portrait');
    } else {
      tags.push('horizontal', 'landscape');
    }
    
    // Add duration tags
    if (videoInfo.duration < 10) {
      tags.push('short');
    } else if (videoInfo.duration > 60) {
      tags.push('long');
    }
    
    // Add quality tags based on resolution
    if (videoInfo.width >= 1920 || videoInfo.height >= 1920) {
      tags.push('high-quality', 'hd');
    }
    
    return tags;
  }
}

export const appleVideoHandler = AppleVideoHandler;
