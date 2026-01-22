import OpenAI from 'openai';
import { executeQuery, executeInsert } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import { logger } from '../utils/logger';

interface WorkOrderIntakeResult {
  extractedInfo: {
    asset?: {
      id?: number;
      name?: string;
      location?: string;
    };
    issue_type?: string;
    urgency?: string;
    components?: string[];
    description?: string;
  };
  confidenceScore: number;
  suggestedWorkOrder: {
    title: string;
    description: string;
    priority: string;
    type: string;
  };
  similarWorkOrders: Array<{
    id: number;
    title: string;
    description: string;
    resolution?: string;
    created_at: string;
  }>;
}

interface DispatchRecommendation {
  technicians: Array<{
    id: number;
    name: string;
    skills: string[];
    current_location: string;
    distance_km: number;
    current_workload: number;
    estimated_arrival: string;
    confidence_score: number;
  }>;
  vendors: Array<{
    id: number;
    name: string;
    specialty: string;
    average_rating: number;
    estimated_cost: number;
    response_time_hours: number;
    confidence_score: number;
  }>;
  recommended_assignment: {
    type: 'technician' | 'vendor';
    id: number;
    name: string;
    reason: string;
  };
}

interface PMTemplateSuggestion {
  templates: Array<{
    name: string;
    frequency_type: string;
    frequency_interval: number;
    estimated_duration_minutes: number;
    task_list: string[];
    required_tools: string[];
    confidence_score: number;
    reasoning: string;
  }>;
  assets_similar: Array<{
    id: number;
    name: string;
    location: string;
    pm_schedule?: string;
  }>;
}

interface PrioritySuggestion {
  priority: string;
  confidence_score: number;
  reasoning: string;
  factors: Array<{
    factor: string;
    weight: number;
    value: string;
  }>;
}

export class AIProcessingService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async processWorkOrderDescription(
    description: string,
    organizationId: number,
    siteId: number
  ): Promise<WorkOrderIntakeResult> {
    try {
      const startTime = Date.now();

      // Get assets at the site to improve context
      const siteAssets = await this.getSiteAssets(organizationId, siteId);
      
      // Get similar work orders for context
      const similarWorkOrders = await this.findSimilarWorkOrders(
        description, 
        organizationId, 
        5
      );

      const systemPrompt = `You are an AI assistant for facilities management work order processing.
Extract key information from natural language maintenance requests.

Response format must be JSON with:
{
  "asset": {
    "name": "identified asset name",
    "location": "identified location",
    "components": ["component1", "component2"]
  },
  "issue_type": "category of issue (e.g., 'Noise', 'Leak', 'Not Working')",
  "urgency": "low/medium/high/critical",
  "description": "cleaned description",
  "confidence_score": 0.85
}

Available assets at site: ${JSON.stringify(siteAssets.map((a: any) => ({
  id: a.id,
  name: a.name,
  asset_tag: a.asset_tag,
  location: a.location_description
})))}`;

      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: description }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

      // Generate suggested work order
      const suggestedWorkOrder = this.generateWorkOrderSuggestion(aiResponse, description);

      const result: WorkOrderIntakeResult = {
        extractedInfo: aiResponse,
        confidenceScore: aiResponse.confidence_score || 0.5,
        suggestedWorkOrder,
        similarWorkOrders: similarWorkOrders.map((wo: any) => ({
          id: wo.id,
          title: wo.title,
          description: wo.description,
          resolution: wo.resolution,
          created_at: wo.created_at
        }))
      };

      // Log the processing for feedback and improvement
      await this.logAIProcessing(
        organizationId,
        'work_order_intake',
        description,
        result,
        Date.now() - startTime
      );

      return result;
    } catch (error) {
      logger.error('Error processing work order description:', error);
      throw new Error('Failed to process work order description');
    }
  }

  async getDispatchRecommendations(
    workOrderId: number,
    organizationId: number
  ): Promise<DispatchRecommendation> {
    try {
      // Get work order details
      const workOrder = await executeQuery<any>(
        'SELECT * FROM work_orders WHERE id = ? AND organization_id = ?',
        [workOrderId, organizationId]
      );

      if (workOrder.length === 0) {
        throw new Error('Work order not found');
      }

      const wo = workOrder[0];

      // Get available technicians
      const technicians = await this.getAvailableTechnicians(organizationId, wo);

      // Get relevant vendors
      const vendors = await this.getRelevantVendors(organizationId, wo);

      // Get recommended assignment
      const recommended = this.determineBestAssignment(technicians, vendors, wo);

      return {
        technicians,
        vendors,
        recommended_assignment: recommended
      };
    } catch (error) {
      logger.error('Error getting dispatch recommendations:', error);
      throw error;
    }
  }

  async suggestPMTemplate(params: {
    assetId?: number;
    assetType?: string;
    manufacturer?: string;
    model?: string;
    organizationId: number;
  }): Promise<PMTemplateSuggestion> {
    try {
      const { assetId, assetType, manufacturer, model, organizationId } = params;

      // Get existing templates for similar assets
      const similarTemplates = await this.getSimilarPMTemplates(organizationId, {
        assetType,
        manufacturer,
        model
      });

      // Get assets similar to this one
      const similarAssets = await this.getSimilarAssets(organizationId, {
        assetId,
        assetType,
        manufacturer,
        model
      });

      return {
        templates: similarTemplates.map((template: any) => ({
          name: template.name,
          frequency_type: template.frequency_type,
          frequency_interval: template.frequency_interval,
          estimated_duration_minutes: template.estimated_duration_minutes,
          task_list: template.task_list,
          required_tools: template.required_tools,
          confidence_score: this.calculateTemplateConfidence(template, params),
          reasoning: template.reasoning || 'Based on similar asset type and manufacturer'
        })),
        assets_similar: similarAssets
      };
    } catch (error) {
      logger.error('Error suggesting PM template:', error);
      throw error;
    }
  }

  async suggestPriority(params: {
    description: string;
    assetId?: number;
    issueType?: string;
    organizationId: number;
  }): Promise<PrioritySuggestion> {
    try {
      const { description, assetId, issueType, organizationId } = params;

      // Get asset criticality if asset specified
      let assetCriticality = 'normal';
      if (assetId) {
        const asset = await executeQuery(
          'SELECT criticality FROM assets WHERE id = ? AND organization_id = ?',
          [assetId, organizationId]
        );
        if (asset.length > 0) {
          assetCriticality = asset[0].criticality;
        }
      }

      // Use AI to analyze and suggest priority
      const systemPrompt = `You are an AI assistant for facilities management priority assignment.
Analyze the maintenance request and suggest an appropriate priority level.

Consider:
- Asset criticality: ${assetCriticality}
- Issue type: ${issueType || 'Unknown'}
- Description urgency indicators

Response format:
{
  "priority": "low/medium/high/critical",
  "confidence_score": 0.85,
  "reasoning": "Explanation for the priority level",
  "factors": [
    {"factor": "Asset Criticality", "weight": 0.4, "value": "critical"},
    {"factor": "Issue Type", "weight": 0.3, "value": "equipment_failure"}
  ]
}`;

      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: description }
        ],
        temperature: 0.2,
        max_tokens: 300
      });

      const suggestion = JSON.parse(completion.choices[0].message.content || '{}');

      return suggestion as PrioritySuggestion;
    } catch (error) {
      logger.error('Error suggesting priority:', error);
      throw error;
    }
  }

  async recordFeedback(
    processingLogId: number,
    userId: number,
    feedback: 'positive' | 'negative' | 'neutral',
    corrections?: any
  ): Promise<void> {
    try {
      await executeQuery(
        'UPDATE ai_processing_logs SET user_feedback = ? WHERE id = ?',
        [feedback, processingLogId]
      );

      // Store corrections if provided for learning
      if (corrections) {
        await executeInsert(
          'INSERT INTO ai_corrections (processing_log_id, user_id, corrections, created_at) VALUES (?, ?, ?, NOW())',
          [processingLogId, userId, JSON.stringify(corrections)]
        );
      }

      logger.info('User feedback recorded', { processingLogId, userId, feedback });
    } catch (error) {
      logger.error('Error recording feedback:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getSiteAssets(organizationId: number, siteId: number): Promise<any[]> {
    return await executeQuery(
      'SELECT id, name, asset_tag, location_description, manufacturer, model FROM assets WHERE organization_id = ? AND site_id = ? AND status = "active"',
      [organizationId, siteId]
    );
  }

  private async findSimilarWorkOrders(
    description: string,
    organizationId: number,
    limit: number = 5
  ): Promise<any[]> {
    // Simple similarity search - in production, this would use vector embeddings
    const keywords = this.extractKeywords(description);
    
    let query = 'SELECT id, title, description, resolution, created_at FROM work_orders WHERE organization_id = ?';
    const params: any[] = [organizationId];

    if (keywords.length > 0) {
      const likeClause = keywords.map(() => 'description LIKE ?').join(' OR ');
      query += ` AND (${likeClause})`;
      params.push(...keywords.map(keyword => `%${keyword}%`));
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    return await executeQuery(query, params);
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'];
    
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 10);
  }

  private generateWorkOrderSuggestion(extractedInfo: any, originalDescription: string) {
    const assetName = extractedInfo.asset?.name || 'Unknown Asset';
    const issueType = extractedInfo.issue_type || 'Issue';
    const priority = this.mapUrgencyToPriority(extractedInfo.urgency);

    return {
      title: `${assetName}: ${issueType}`,
      description: extractedInfo.description || originalDescription,
      priority,
      type: this.mapIssueTypeToType(issueType)
    };
  }

  private mapUrgencyToPriority(urgency?: string): string {
    const mapping: Record<string, string> = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };
    return mapping[urgency?.toLowerCase() || ''] || 'medium';
  }

  private mapIssueTypeToType(issueType?: string): string {
    if (!issueType) return 'corrective';
    
    const lowerType = issueType.toLowerCase();
    if (lowerType.includes('emergency') || lowerType.includes('critical')) return 'emergency';
    if (lowerType.includes('inspection') || lowerType.includes('check')) return 'inspection';
    if (lowerType.includes('maintenance') || lowerType.includes('service')) return 'preventive';
    
    return 'corrective';
  }

  private async getAvailableTechnicians(organizationId: number, workOrder: any): Promise<any[]> {
    return await executeQuery(
      `SELECT t.*, u.first_name, u.last_name, u.email
       FROM technicians t
       JOIN users u ON t.user_id = u.id
       WHERE t.organization_id = ? AND t.is_available = TRUE
       ORDER BY t.current_location ASC`,
      [organizationId]
    );
  }

  private async getRelevantVendors(organizationId: number, workOrder: any): Promise<any[]> {
    // Simple approach - get active vendors. In production, this would match by specialty
    return await executeQuery(
      'SELECT * FROM vendors WHERE organization_id = ? AND is_active = TRUE ORDER BY average_rating DESC LIMIT 10',
      [organizationId]
    );
  }

  private determineBestAssignment(technicians: any[], vendors: any[], workOrder: any): any {
    // Simplified assignment logic - in production, this would be much more sophisticated
    if (technicians.length > 0) {
      const bestTech = technicians[0]; // Would rank by skills, location, workload, etc.
      return {
        type: 'technician',
        id: bestTech.id,
        name: `${bestTech.first_name} ${bestTech.last_name}`,
        reason: 'Available technician with matching skills'
      };
    } else {
      const bestVendor = vendors[0]; // Would rank by rating, cost, response time
      return {
        type: 'vendor',
        id: bestVendor.id,
        name: bestVendor.name,
        reason: 'Highest rated available vendor'
      };
    }
  }

  private async getSimilarPMTemplates(organizationId: number, filters: any): Promise<any[]> {
    let query = 'SELECT * FROM pm_templates WHERE organization_id = ? AND is_active = TRUE';
    const params: any[] = [organizationId];

    // In production, this would use more sophisticated matching
    if (filters.assetType) {
      query += ' ORDER BY created_at DESC LIMIT 5';
    } else {
      query += ' ORDER BY created_at DESC LIMIT 3';
    }

    return await executeQuery(query, params);
  }

  private async getSimilarAssets(organizationId: number, filters: any): Promise<any[]> {
    let query = 'SELECT id, name, location_description FROM assets WHERE organization_id = ? AND status = "active"';
    const params: any[] = [organizationId];

    if (filters.assetType) {
      // Would join with asset_categories
    }

    query += ' LIMIT 5';
    return await executeQuery(query, params);
  }

  private calculateTemplateConfidence(template: any, params: any): number {
    // Simple confidence calculation - in production, this would be more sophisticated
    let confidence = 0.5;

    if (template.asset_category_id) confidence += 0.2;
    if (params.manufacturer && template.name.toLowerCase().includes(params.manufacturer.toLowerCase())) {
      confidence += 0.2;
    }
    if (params.model && template.name.toLowerCase().includes(params.model.toLowerCase())) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95);
  }

  private async logAIProcessing(
    organizationId: number,
    processingType: string,
    inputText: string,
    aiResponse: any,
    processingTimeMs: number
  ): Promise<void> {
    try {
      await executeInsert(
        `INSERT INTO ai_processing_logs 
         (organization_id, processing_type, input_text, ai_response, confidence_score, processing_time_ms, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          organizationId,
          processingType,
          inputText,
          JSON.stringify(aiResponse),
          aiResponse.confidenceScore || 0.5,
          processingTimeMs
        ]
      );
    } catch (error) {
      logger.error('Failed to log AI processing:', error);
    }
  }
}