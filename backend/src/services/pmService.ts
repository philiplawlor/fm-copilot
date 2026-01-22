import { executeQuery, executeInsert, executeUpdate } from '../config/database';
import { cacheGet, cacheSet, cacheDel, cacheInvalidatePattern } from '../config/redis';
import { logger } from '../utils/logger';

interface PMTemplateRequest {
  asset_id: number;
  asset_type?: string;
  manufacturer?: string;
  model?: string;
  organization_id: number;
}

interface PMTemplateSuggestion {
  id?: number;
  name: string;
  description?: string;
  frequency_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom';
  frequency_interval: number;
  estimated_duration_minutes: number;
  task_list: string[];
  required_tools: string[];
  confidence_score: number;
  reasoning: string;
}

interface PMScheduleCreate {
  asset_id: number;
  pm_template_id: number;
  organization_id: number;
  next_due_date: string;
}

export class PMService {
  async suggestPMTemplate(request: PMTemplateRequest): Promise<PMTemplateSuggestion[]> {
    const { asset_id, asset_type, manufacturer, model, organization_id } = request;

    try {
      // Get asset details if asset_id provided
      let assetDetails = null;
      if (asset_id) {
        assetDetails = await this.getAssetDetails(asset_id, organization_id);
      }

      // Get base templates
      const baseTemplates = await this.getBaseTemplates(organization_id, {
        asset_type: asset_type || assetDetails?.category_name,
        manufacturer: manufacturer || assetDetails?.manufacturer,
        model: model || assetDetails?.model
      });

      // Get similar assets with PM schedules
      const similarAssets = await this.getSimilarAssetsWithPM(organization_id, assetDetails);

      // Generate suggestions combining templates and similar assets
      const suggestions = await this.generatePMSuggestions(
        baseTemplates,
        similarAssets,
        assetDetails,
        { asset_type, manufacturer, model }
      );

      return suggestions;
    } catch (error) {
      logger.error('Error suggesting PM template:', error);
      throw error;
    }
  }

  async createPMSchedule(scheduleData: PMScheduleCreate): Promise<any> {
    const { asset_id, pm_template_id, organization_id, next_due_date } = scheduleData;

    try {
      // Verify asset and template belong to organization
      const asset = await this.verifyAsset(asset_id, organization_id);
      const template = await this.verifyTemplate(pm_template_id, organization_id);

      if (!asset || !template) {
        throw new Error('Invalid asset or template');
      }

      // Check if PM schedule already exists
      const existingSchedule = await executeQuery(
        'SELECT id FROM pm_schedules WHERE asset_id = ? AND pm_template_id = ? AND organization_id = ?',
        [asset_id, pm_template_id, organization_id]
      );

      if (existingSchedule.length > 0) {
        throw new Error('PM schedule already exists for this asset and template');
      }

      // Create PM schedule
      const scheduleId = await executeInsert(
        'INSERT INTO pm_schedules (organization_id, asset_id, pm_template_id, next_due_date, created_at) VALUES (?, ?, ?, ?, NOW())',
        [organization_id, asset_id, pm_template_id, next_due_date]
      );

      // Clear cache
      await cacheInvalidatePMSchedules(organization_id);

      return await this.getPMScheduleById(scheduleId, organization_id);
    } catch (error) {
      logger.error('Error creating PM schedule:', error);
      throw error;
    }
  }

  async getPMSchedules(organizationId: number, filters: {
    site_id?: number;
    asset_id?: number;
    status?: string;
    due_date_from?: string;
    due_date_to?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ schedules: any[], total: number }> {
    const cacheKey = `pm_schedules:${organizationId}:${JSON.stringify(filters)}`;
    
    // Try cache first
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    let query = `
      SELECT pms.*, 
             a.name as asset_name, a.asset_tag,
             s.name as site_name,
             pmt.name as template_name, pmt.description as template_description,
             pmt.frequency_type, pmt.frequency_interval
      FROM pm_schedules pms
      JOIN assets a ON pms.asset_id = a.id
      JOIN sites s ON a.site_id = s.id
      JOIN pm_templates pmt ON pms.pm_template_id = pmt.id
      WHERE pms.organization_id = ?
    `;

    const params: any[] = [organizationId];

    // Apply filters
    if (filters.site_id) {
      query += ' AND a.site_id = ?';
      params.push(filters.site_id);
    }

    if (filters.asset_id) {
      query += ' AND pms.asset_id = ?';
      params.push(filters.asset_id);
    }

    if (filters.status === 'active') {
      query += ' AND pms.is_active = TRUE';
    } else if (filters.status === 'inactive') {
      query += ' AND pms.is_active = FALSE';
    }

    if (filters.due_date_from) {
      query += ' AND pms.next_due_date >= ?';
      params.push(filters.due_date_from);
    }

    if (filters.due_date_to) {
      query += ' AND pms.next_due_date <= ?';
      params.push(filters.due_date_to);
    }

    // Get total count
    const countQuery = query.replace('SELECT pms.*,', 'SELECT COUNT(*) as total,');
    const countResult = await executeQuery<{ total: number }>(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    query += ' ORDER BY pms.next_due_date ASC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const schedules = await executeQuery(query, params);

    const result = {
      schedules,
      total
    };

    // Cache for 10 minutes
    await cacheSet(cacheKey, result, 600);

    return result;
  }

  async getUpcomingPM(organizationId: number, daysAhead: number = 30): Promise<any[]> {
    const query = `
      SELECT pms.*, 
             a.name as asset_name, a.asset_tag,
             s.name as site_name,
             pmt.name as template_name,
             DATEDIFF(pms.next_due_date, CURDATE()) as days_until_due
      FROM pm_schedules pms
      JOIN assets a ON pms.asset_id = a.id
      JOIN sites s ON a.site_id = s.id
      JOIN pm_templates pmt ON pms.pm_template_id = pmt.id
      WHERE pms.organization_id = ? 
        AND pms.is_active = TRUE
        AND pms.next_due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY pms.next_due_date ASC
    `;

    return await executeQuery(query, [organizationId, daysAhead]);
  }

  async completePM(
    scheduleId: number, 
    organizationId: number, 
    completionData: {
      notes?: string;
      actual_duration_minutes?: number;
      next_due_date?: string;
    }
  ): Promise<any> {
    try {
      // Get current schedule
      const currentSchedule = await this.getPMScheduleById(scheduleId, organizationId);
      if (!currentSchedule) {
        throw new Error('PM schedule not found');
      }

      // Update schedule
      const updateData = {
        last_completed_date: new Date().toISOString().split('T')[0],
        next_due_date: completionData.next_due_date || this.calculateNextDueDate(
          currentSchedule.frequency_type, 
          currentSchedule.frequency_interval
        )
      };

      await executeUpdate(
        'UPDATE pm_schedules SET last_completed_date = ?, next_due_date = ?, updated_at = NOW() WHERE id = ?',
        [updateData.last_completed_date, updateData.next_due_date, scheduleId]
      );

      // Create work order record if needed
      if (completionData.notes || completionData.actual_duration_minutes) {
        await this.createPMWorkOrder(
          currentSchedule,
          organizationId,
          completionData
        );
      }

      // Clear cache
      await cacheInvalidatePMSchedules(organizationId);

      return await this.getPMScheduleById(scheduleId, organizationId);
    } catch (error) {
      logger.error('Error completing PM:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getAssetDetails(assetId: number, organizationId: number): Promise<any> {
    const query = `
      SELECT a.*, ac.name as category_name, ac.required_skills
      FROM assets a
      LEFT JOIN asset_categories ac ON a.asset_category_id = ac.id
      WHERE a.id = ? AND a.organization_id = ?
    `;

    return await executeQuery(query, [assetId, organizationId]).then(results => results[0]);
  }

  private async getBaseTemplates(organizationId: number, filters: {
    asset_type?: string;
    manufacturer?: string;
    model?: string;
  }): Promise<any[]> {
    let query = `
      SELECT * FROM pm_templates 
      WHERE organization_id = ? AND is_active = TRUE
    `;
    const params: any[] = [organizationId];

    // Add search conditions if filters provided
    if (filters.asset_type || filters.manufacturer || filters.model) {
      const searchTerms = [];
      
      if (filters.asset_type) {
        searchTerms.push('name LIKE ?');
        params.push(`%${filters.asset_type}%`);
      }
      
      if (filters.manufacturer) {
        searchTerms.push('name LIKE ?');
        params.push(`%${filters.manufacturer}%`);
      }
      
      if (filters.model) {
        searchTerms.push('name LIKE ?');
        params.push(`%${filters.model}%`);
      }

      if (searchTerms.length > 0) {
        query += ' AND (' + searchTerms.join(' OR ') + ')';
      }
    }

    query += ' ORDER BY name ASC LIMIT 10';

    return await executeQuery(query, params);
  }

  private async getSimilarAssetsWithPM(organizationId: number, assetDetails: any): Promise<any[]> {
    if (!assetDetails) {
      return [];
    }

    const query = `
      SELECT a.*, pms.next_due_date, pms.last_completed_date,
             pmt.name as template_name, pmt.frequency_type, pmt.frequency_interval,
             pmt.task_list, pmt.required_tools
      FROM assets a
      JOIN pm_schedules pms ON a.id = pms.asset_id
      JOIN pm_templates pmt ON pms.pm_template_id = pmt.id
      WHERE a.organization_id = ? 
        AND a.asset_category_id = ?
        AND a.id != ?
        AND a.status = 'active'
        AND pms.is_active = TRUE
      ORDER BY a.manufacturer = ? DESC, a.model = ? DESC
      LIMIT 5
    `;

    return await executeQuery(query, [
      organizationId, 
      assetDetails.asset_category_id, 
      assetDetails.id,
      assetDetails.manufacturer || '',
      assetDetails.model || ''
    ]);
  }

  private async generatePMSuggestions(
    templates: any[],
    similarAssets: any[],
    assetDetails: any,
    requestFilters: any
  ): Promise<PMTemplateSuggestion[]> {
    const suggestions: PMTemplateSuggestion[] = [];

    // Process template suggestions
    templates.forEach(template => {
      const confidenceScore = this.calculateTemplateConfidence(
        template, 
        assetDetails, 
        requestFilters
      );

      suggestions.push({
        id: template.id,
        name: template.name,
        description: template.description,
        frequency_type: template.frequency_type,
        frequency_interval: template.frequency_interval,
        estimated_duration_minutes: template.estimated_duration_minutes,
        task_list: Array.isArray(template.task_list) ? template.task_list : JSON.parse(template.task_list || '[]'),
        required_tools: Array.isArray(template.required_tools) ? template.required_tools : JSON.parse(template.required_tools || '[]'),
        confidence_score: confidenceScore,
        reasoning: this.generateTemplateReasoning(template, assetDetails, confidenceScore)
      });
    });

    // Process similar asset suggestions
    similarAssets.forEach(asset => {
      const confidenceScore = this.calculateSimilarAssetConfidence(asset, assetDetails);
      
      suggestions.push({
        name: `${asset.template_name} (Based on similar asset: ${asset.name})`,
        description: `Template used for similar ${asset.manufacturer} ${asset.model}`,
        frequency_type: asset.frequency_type,
        frequency_interval: asset.frequency_interval,
        estimated_duration_minutes: 180, // Default estimate
        task_list: Array.isArray(asset.task_list) ? asset.task_list : JSON.parse(asset.task_list || '[]'),
        required_tools: Array.isArray(asset.required_tools) ? asset.required_tools : JSON.parse(asset.required_tools || '[]'),
        confidence_score: confidenceScore,
        reasoning: `Based on similar asset ${asset.name} at same facility`
      });
    });

    // Sort by confidence score and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 5);
  }

  private calculateTemplateConfidence(
    template: any, 
    assetDetails: any, 
    requestFilters: any
  ): number {
    let confidence = 0.3; // Base confidence

    const templateName = template.name.toLowerCase();
    
    // Check asset type match
    const assetType = requestFilters.asset_type || assetDetails?.category_name;
    if (assetType && templateName.includes(assetType.toLowerCase())) {
      confidence += 0.3;
    }

    // Check manufacturer match
    const manufacturer = requestFilters.manufacturer || assetDetails?.manufacturer;
    if (manufacturer && templateName.includes(manufacturer.toLowerCase())) {
      confidence += 0.2;
    }

    // Check model match
    const model = requestFilters.model || assetDetails?.model;
    if (model && templateName.includes(model.toLowerCase())) {
      confidence += 0.1;
    }

    // Boost confidence for templates with good task lists
    const taskList = Array.isArray(template.task_list) ? template.task_list : JSON.parse(template.task_list || '[]');
    if (taskList.length > 3) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95);
  }

  private calculateSimilarAssetConfidence(similarAsset: any, assetDetails: any): number {
    let confidence = 0.4; // Base confidence for similar asset type

    // Same manufacturer
    if (similarAsset.manufacturer === assetDetails.manufacturer) {
      confidence += 0.3;
    }

    // Same model
    if (similarAsset.model === assetDetails.model) {
      confidence += 0.2;
    }

    // Active PM schedule
    if (similarAsset.last_completed_date) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.9);
  }

  private generateTemplateReasoning(template: any, assetDetails: any, confidenceScore: number): string {
    const reasons = [];
    
    if (confidenceScore >= 0.8) {
      reasons.push('Excellent match for asset type and specifications');
    } else if (confidenceScore >= 0.6) {
      reasons.push('Good match for asset type');
    } else {
      reasons.push('General template for this asset category');
    }

    if (template.name.toLowerCase().includes('manufacturer')) {
      reasons.push('Manufacturer-recommended');
    }

    return reasons.join(', ');
  }

  private async getPMScheduleById(scheduleId: number, organizationId: number): Promise<any> {
    const query = `
      SELECT pms.*, 
             a.name as asset_name, a.asset_tag,
             s.name as site_name,
             pmt.name as template_name, pmt.description as template_description,
             pmt.frequency_type, pmt.frequency_interval,
             pmt.task_list, pmt.required_tools
      FROM pm_schedules pms
      JOIN assets a ON pms.asset_id = a.id
      JOIN sites s ON a.site_id = s.id
      JOIN pm_templates pmt ON pms.pm_template_id = pmt.id
      WHERE pms.id = ? AND pms.organization_id = ?
    `;

    return await executeQuery(query, [scheduleId, organizationId]).then(results => results[0]);
  }

  private async verifyAsset(assetId: number, organizationId: number): Promise<boolean> {
    const result = await executeQuery(
      'SELECT id FROM assets WHERE id = ? AND organization_id = ?',
      [assetId, organizationId]
    );
    return result.length > 0;
  }

  private async verifyTemplate(templateId: number, organizationId: number): Promise<boolean> {
    const result = await executeQuery(
      'SELECT id FROM pm_templates WHERE id = ? AND organization_id = ? AND is_active = TRUE',
      [templateId, organizationId]
    );
    return result.length > 0;
  }

  private calculateNextDueDate(frequencyType: string, frequencyInterval: number): string {
    const now = new Date();
    const nextDue = new Date(now);

    switch (frequencyType) {
      case 'daily':
        nextDue.setDate(nextDue.getDate() + frequencyInterval);
        break;
      case 'weekly':
        nextDue.setDate(nextDue.getDate() + (frequencyInterval * 7));
        break;
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + frequencyInterval);
        break;
      case 'quarterly':
        nextDue.setMonth(nextDue.getMonth() + (frequencyInterval * 3));
        break;
      case 'semi_annual':
        nextDue.setMonth(nextDue.getMonth() + (frequencyInterval * 6));
        break;
      case 'annual':
        nextDue.setFullYear(nextDue.getFullYear() + frequencyInterval);
        break;
      default:
        // Default to monthly
        nextDue.setMonth(nextDue.getMonth() + 1);
    }

    return nextDue.toISOString().split('T')[0];
  }

  private async createPMWorkOrder(
    schedule: any,
    organizationId: number,
    completionData: any
  ): Promise<void> {
    // Create a preventive maintenance work order
    const workOrderData = {
      organization_id: organizationId,
      site_id: schedule.site_id,
      asset_id: schedule.asset_id,
      title: `PM: ${schedule.template_name} for ${schedule.asset_name}`,
      description: completionData.notes || `Preventive maintenance completed`,
      priority: 'medium',
      type: 'preventive',
      requested_by_user_id: 1, // System user - in production, get actual user
      status: 'completed',
      completed_at: new Date(),
      actual_duration_minutes: completionData.actual_duration_minutes,
      ai_processed: false
    };

    await executeInsert(
      `INSERT INTO work_orders (
        organization_id, site_id, asset_id, title, description, priority, type,
        requested_by_user_id, status, completed_at, actual_duration_minutes,
        ai_processed, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        workOrderData.organization_id,
        workOrderData.site_id,
        workOrderData.asset_id,
        workOrderData.title,
        workOrderData.description,
        workOrderData.priority,
        workOrderData.type,
        workOrderData.requested_by_user_id,
        workOrderData.status,
        workOrderData.completed_at,
        workOrderData.actual_duration_minutes,
        workOrderData.ai_processed
      ]
    );
  }
}

// Helper function to invalidate PM schedule cache
async function cacheInvalidatePMSchedules(organizationId: number): Promise<void> {
  await cacheInvalidatePattern(`pm_schedules:${organizationId}:*`);
}