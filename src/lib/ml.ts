import { db } from './db';

export interface VideoFeatures {
  avgBrightness: number;
  avgContrast: number;
  motionLevel: number;
  colorVariance: number;
  textCoverage: number;
  hookStrength: number;
  contentLength: number;
  duration: number;
  toneScore: number;
}

export interface TrainingData {
  features: VideoFeatures;
  engagement: number;
  views: number;
  completionRate: number;
}

export class MLService {
  private modelWeights: Record<string, number> = {
    avgBrightness: 0.15,
    avgContrast: 0.12,
    motionLevel: 0.18,
    colorVariance: 0.10,
    textCoverage: 0.08,
    hookStrength: 0.20,
    contentLength: 0.05,
    duration: 0.07,
    toneScore: 0.05
  };

  /**
   * Predict engagement score for a video based on its features
   */
  async predictEngagement(features: VideoFeatures): Promise<{
    predictedScore: number;
    confidence: number;
    featureImportance: Record<string, number>;
  }> {
    // Normalize features (0-100 scale)
    const normalizedFeatures = this.normalizeFeatures(features);
    
    // Calculate weighted score
    let predictedScore = 0;
    const featureImportance: Record<string, number> = {};

    Object.entries(this.modelWeights).forEach(([feature, weight]) => {
      const normalizedValue = normalizedFeatures[feature as keyof VideoFeatures] || 0;
      const contribution = normalizedValue * weight;
      predictedScore += contribution;
      featureImportance[feature] = contribution;
    });

    // Apply sigmoid function to get 0-100 score
    predictedScore = this.sigmoid(predictedScore) * 100;

    // Calculate confidence based on feature completeness and model certainty
    const featureCompleteness = Object.values(normalizedFeatures).filter(v => v > 0).length / Object.keys(normalizedFeatures).length;
    const confidence = featureCompleteness * 0.8 + 0.2; // Base confidence of 20%

    return {
      predictedScore: Math.round(predictedScore * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      featureImportance
    };
  }

  /**
   * Train/update the model with new data
   */
  async retrainModel(): Promise<{
    modelVersion: string;
    performance: {
      accuracy: number;
      meanError: number;
      trainingSamples: number;
    };
    newWeights: Record<string, number>;
  }> {
    // Get training data from videos with metrics
    const trainingData = await this.getTrainingData();

    if (trainingData.length < 10) {
      throw new Error('Insufficient training data. Need at least 10 videos with metrics.');
    }

    console.log(`Training model with ${trainingData.length} samples`);

    // Simple linear regression approach
    const newWeights = this.calculateWeights(trainingData);
    
    // Evaluate model performance
    const performance = this.evaluateModel(trainingData, newWeights);

    // Update model weights if performance is better
    if (performance.accuracy > 0.6) { // Only update if reasonably accurate
      this.modelWeights = newWeights;
      
      // Save model to database
      const modelVersion = `v${Date.now()}`;
      await db.mLModel.create({
        data: {
          name: 'engagement_predictor',
          version: modelVersion,
          modelPath: `models/engagement_predictor_${modelVersion}.json`,
          performance: {
            accuracy: performance.accuracy,
            meanError: performance.meanError,
            trainingSamples: performance.trainingSamples,
            weights: newWeights,
            trainedAt: new Date().toISOString()
          },
          isActive: true
        }
      });

      // Deactivate old models
      await db.mLModel.updateMany({
        where: {
          name: 'engagement_predictor',
          version: { not: modelVersion }
        },
        data: { isActive: false }
      });
    }

    return {
      modelVersion: `v${Date.now()}`,
      performance,
      newWeights
    };
  }

  /**
   * Get training data from database
   */
  private async getTrainingData(): Promise<TrainingData[]> {
    const videos = await db.video.findMany({
      include: { metrics: true },
      where: {
        AND: [
          { metrics: { isNot: null } },
          { features: { not: { equals: null } } }
        ]
      }
    });

    return videos.map(video => ({
      features: this.extractFeaturesFromVideo(video),
      engagement: video.metrics?.engagement || 0,
      views: video.metrics?.views || 0,
      completionRate: video.metrics?.completionRate || 0
    }));
  }

  /**
   * Extract features from video record
   */
  private extractFeaturesFromVideo(video: Record<string, unknown>): VideoFeatures {
    const features = (video.features as Record<string, unknown>) || {};
    
    return {
      avgBrightness: (features.avgBrightness as number) || 50,
      avgContrast: (features.avgContrast as number) || 50,
      motionLevel: (features.motionLevel as number) || 50,
      colorVariance: (features.colorVariance as number) || 50,
      textCoverage: (features.textCoverage as number) || 20,
      hookStrength: (features.hookStrength as number) || 0.5,
      contentLength: Math.min((features.contentLength as number) || 100, 500) / 5, // Normalize to 0-100
      duration: (video.duration as number) || 10,
      toneScore: this.calculateToneScore((video.tone as string) || 'energetic')
    };
  }

  /**
   * Calculate tone effectiveness score
   */
  private calculateToneScore(tone: string): number {
    const toneScores: Record<string, number> = {
      energetic: 85,
      funny: 80,
      inspiring: 75,
      educational: 70,
      mysterious: 65,
      calm: 60
    };

    return toneScores[tone] || 50;
  }

  /**
   * Normalize features to 0-1 scale
   */
  private normalizeFeatures(features: VideoFeatures): VideoFeatures {
    return {
      avgBrightness: features.avgBrightness / 100,
      avgContrast: features.avgContrast / 100,
      motionLevel: features.motionLevel / 100,
      colorVariance: features.colorVariance / 100,
      textCoverage: features.textCoverage / 100,
      hookStrength: features.hookStrength,
      contentLength: Math.min(features.contentLength, 500) / 500,
      duration: Math.min(features.duration, 30) / 30,
      toneScore: features.toneScore / 100
    };
  }

  /**
   * Calculate new weights using simple linear regression
   */
  private calculateWeights(trainingData: TrainingData[]): Record<string, number> {
    const features = Object.keys(this.modelWeights);
    const newWeights: Record<string, number> = {};

    // Simple correlation-based weight calculation
    features.forEach(feature => {
      let correlation = 0;
      const featureValues = trainingData.map(d => d.features[feature as keyof VideoFeatures]);
      const engagementValues = trainingData.map(d => d.engagement);

      // Calculate Pearson correlation coefficient
      const meanFeature = featureValues.reduce((a, b) => a + b, 0) / featureValues.length;
      const meanEngagement = engagementValues.reduce((a, b) => a + b, 0) / engagementValues.length;

      let numerator = 0;
      let denomFeature = 0;
      let denomEngagement = 0;

      for (let i = 0; i < featureValues.length; i++) {
        const featureDiff = featureValues[i] - meanFeature;
        const engagementDiff = engagementValues[i] - meanEngagement;
        
        numerator += featureDiff * engagementDiff;
        denomFeature += featureDiff * featureDiff;
        denomEngagement += engagementDiff * engagementDiff;
      }

      if (denomFeature > 0 && denomEngagement > 0) {
        correlation = numerator / Math.sqrt(denomFeature * denomEngagement);
      }

      // Convert correlation to weight (absolute value, normalized)
      newWeights[feature] = Math.abs(correlation);
    });

    // Normalize weights to sum to 1
    const totalWeight = Object.values(newWeights).reduce((a, b) => a + b, 0);
    if (totalWeight > 0) {
      Object.keys(newWeights).forEach(feature => {
        newWeights[feature] = newWeights[feature] / totalWeight;
      });
    }

    return newWeights;
  }

  /**
   * Evaluate model performance
   */
  private evaluateModel(trainingData: TrainingData[], weights: Record<string, number>): {
    accuracy: number;
    meanError: number;
    trainingSamples: number;
  } {
    let totalError = 0;
    let correctPredictions = 0;

    trainingData.forEach(sample => {
      const normalizedFeatures = this.normalizeFeatures(sample.features);
      
      let predictedScore = 0;
      Object.entries(weights).forEach(([feature, weight]) => {
        predictedScore += (normalizedFeatures[feature as keyof VideoFeatures] || 0) * weight;
      });
      
      predictedScore = this.sigmoid(predictedScore) * 100;
      
      const error = Math.abs(predictedScore - sample.engagement);
      totalError += error;
      
      // Consider prediction correct if within 20% of actual
      if (error <= 20) {
        correctPredictions++;
      }
    });

    return {
      accuracy: correctPredictions / trainingData.length,
      meanError: totalError / trainingData.length,
      trainingSamples: trainingData.length
    };
  }

  /**
   * Sigmoid activation function
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * Get feature importance analysis
   */
  async getFeatureImportance(): Promise<Record<string, number>> {
    return { ...this.modelWeights };
  }

  /**
   * Auto-adjust video parameters based on predicted performance
   */
  async suggestImprovements(features: VideoFeatures, targetScore: number = 75): Promise<{
    suggestions: Array<{
      feature: string;
      currentValue: number;
      suggestedValue: number;
      impact: number;
      description: string;
    }>;
    potentialImprovement: number;
  }> {
    const prediction = await this.predictEngagement(features);
    
    if (prediction.predictedScore >= targetScore) {
      return {
        suggestions: [],
        potentialImprovement: 0
      };
    }

    const suggestions: Array<{
      feature: string;
      currentValue: number;
      suggestedValue: number;
      impact: number;
      description: string;
    }> = [];
    const featureDescriptions: Record<string, string> = {
      avgBrightness: 'Increase video brightness for better visibility',
      avgContrast: 'Enhance contrast to make content pop',
      motionLevel: 'Add more dynamic movement or transitions',
      colorVariance: 'Use more vibrant and varied colors',
      textCoverage: 'Optimize text overlay size and positioning',
      hookStrength: 'Strengthen the opening hook',
      contentLength: 'Adjust content length for optimal engagement',
      duration: 'Optimize video duration',
      toneScore: 'Consider adjusting the content tone'
    };

    // Find features with highest weights that can be improved
    Object.entries(this.modelWeights)
      .sort(([,a], [,b]) => b - a) // Sort by weight importance
      .slice(0, 3) // Top 3 most important features
      .forEach(([feature, weight]) => {
        const currentValue = features[feature as keyof VideoFeatures];
        let suggestedValue = currentValue;
        let impact = 0;

        // Suggest improvements based on feature type
        switch (feature) {
          case 'avgBrightness':
          case 'avgContrast':
          case 'motionLevel':
          case 'colorVariance':
            if (currentValue < 70) {
              suggestedValue = Math.min(85, currentValue + 15);
              impact = weight * (suggestedValue - currentValue) / 100;
            }
            break;
          case 'hookStrength':
            if (currentValue < 0.8) {
              suggestedValue = 0.9;
              impact = weight * (suggestedValue - currentValue);
            }
            break;
          case 'textCoverage':
            if (currentValue < 15 || currentValue > 35) {
              suggestedValue = 25; // Optimal text coverage
              impact = weight * Math.abs(suggestedValue - currentValue) / 100;
            }
            break;
          case 'duration':
            if (currentValue < 8 || currentValue > 12) {
              suggestedValue = 10; // Optimal duration
              impact = weight * Math.abs(suggestedValue - currentValue) / 30;
            }
            break;
        }

        if (suggestedValue !== currentValue) {
          suggestions.push({
            feature,
            currentValue,
            suggestedValue,
            impact,
            description: featureDescriptions[feature]
          });
        }
      });

    const potentialImprovement = suggestions.reduce((sum, s) => sum + s.impact * 100, 0);

    return {
      suggestions,
      potentialImprovement: Math.round(potentialImprovement * 100) / 100
    };
  }
}

export const mlService = new MLService();
