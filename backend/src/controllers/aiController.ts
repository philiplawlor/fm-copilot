import { Response } from 'express';
import { AIProcessingService } from '../services/aiProcessingService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

export class AIController {
  private aiService: AIProcessingService;

  constructor() {
    this.aiService = new AIProcessingService();
  }

  async processWorkOrderIntake(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { description, site_id } = req.body;
    const organizationId = req.user!.organizationId;

    try {
      // Process natural language description
      const processedData = await this.aiService.processWorkOrderDescription(
        description,
        organizationId,
        site_id
      );

      res.json({
        success: true,
        data: {
          extracted_info: processedData.extractedInfo,
          confidence_score: processedData.confidenceScore,
          suggested_work_order: processedData.suggestedWorkOrder,
          similar_work_orders: processedData.similarWorkOrders
        }
      });
    } catch (error) {
      logger.error('Error processing work order intake:', error);
      throw error;
    }
  }

  async getDispatchRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { work_order_id } = req.body;
    const organizationId = req.user!.organizationId;

    try {
      const recommendations = await this.aiService.getDispatchRecommendations(
        work_order_id,
        organizationId
      );

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      logger.error('Error getting dispatch recommendations:', error);
      throw error;
    }
  }

  async suggestPMTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { asset_id, asset_type, manufacturer, model } = req.body;
    const organizationId = req.user!.organizationId;

    try {
      const suggestions = await this.aiService.suggestPMTemplate({
        assetId: asset_id,
        assetType: asset_type,
        manufacturer,
        model,
        organizationId
      });

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      logger.error('Error suggesting PM template:', error);
      throw error;
    }
  }

  async suggestPriority(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { description, asset_id, issue_type } = req.body;
    const organizationId = req.user!.organizationId;

    try {
      const prioritySuggestion = await this.aiService.suggestPriority({
        description,
        assetId: asset_id,
        issueType: issue_type,
        organizationId
      });

      res.json({
        success: true,
        data: prioritySuggestion
      });
    } catch (error) {
      logger.error('Error suggesting priority:', error);
      throw error;
    }
  }

  async submitFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { processing_log_id, feedback, corrections } = req.body;
    const userId = req.user!.userId;

    try {
      await this.aiService.recordFeedback(
        processing_log_id,
        userId,
        feedback,
        corrections
      );

      res.json({
        success: true,
        message: 'Feedback recorded successfully'
      });
    } catch (error) {
      logger.error('Error recording feedback:', error);
      throw error;
    }
  }
}