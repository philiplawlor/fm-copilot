import { executeQuery, executeInsert, executeUpdate, executeQuerySingle } from '../config/database';
import { cacheGet, cacheSet, cacheDel, cacheInvalidatePattern } from '../config/redis';
import { logger } from '../utils/logger';

interface WorkOrderFilters {
  status?: string;
  priority?: string;
  site_id?: number;
  assigned_technician_id?: number;
  date_from?: string;
  date_to?: string;
  page: number;
  limit: number;
}

interface WorkOrderCreate {
  organization_id: number;
  site_id: number;
  asset_id?: number;
  title: string;
  description?: string;
  priority: string;
  type: string;
  requested_by_user_id: number;
  scheduled_date?: string;
  estimated_duration_minutes?: number;
  ai_processed?: boolean;
  ai_confidence_score?: number;
  status?: string;
}

export class WorkOrderService {
  async getWorkOrders(
    organizationId: number,
    filters: WorkOrderFilters,
    userRole: string,
    userId: number
  ): Promise<{
    workOrders: any[];
    page: number;
    limit: number;
    total: number;
  }> {
    const cacheKey = `work_orders:${organizationId}:${JSON.stringify(filters)}:${userRole}:${userId}`;
    
    // Try cache first
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    let query = `
      SELECT wo.*, 
             s.name as site_name,
             a.name as asset_name, a.asset_tag,
             u.first_name as requested_by_first_name, u.last_name as requested_by_last_name,
             t.first_name as tech_first_name, t.last_name as tech_last_name,
             v.name as vendor_name
      FROM work_orders wo
      LEFT JOIN sites s ON wo.site_id = s.id
      LEFT JOIN assets a ON wo.asset_id = a.id
      LEFT JOIN users u ON wo.requested_by_user_id = u.id
      LEFT JOIN technicians t ON wo.assigned_technician_id = t.id
      LEFT JOIN users tech_user ON t.user_id = tech_user.id
      LEFT JOIN vendors v ON wo.assigned_vendor_id = v.id
      WHERE wo.organization_id = ?
    `;

    const params: any[] = [organizationId];

    // Apply filters
    if (filters.status) {
      query += ' AND wo.status = ?';
      params.push(filters.status);
    }

    if (filters.priority) {
      query += ' AND wo.priority = ?';
      params.push(filters.priority);
    }

    if (filters.site_id) {
      query += ' AND wo.site_id = ?';
      params.push(filters.site_id);
    }

    if (filters.assigned_technician_id) {
      query += ' AND wo.assigned_technician_id = ?';
      params.push(filters.assigned_technician_id);
    }

    if (filters.date_from) {
      query += ' AND wo.created_at >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND wo.created_at <= ?';
      params.push(filters.date_to);
    }

    // Role-based filtering
    if (userRole === 'technician') {
      query += ' AND (wo.assigned_technician_id = ? OR wo.assigned_technician_id IS NULL)';
      params.push(userId);
    }

    // Get total count
    const countQuery = query.replace('SELECT wo.*,', 'SELECT COUNT(*) as total,');
    const countResult = await executeQuerySingle<{ total: number }>(countQuery, params);
    const total = countResult?.total || 0;

    // Apply pagination
    query += ' ORDER BY wo.created_at DESC LIMIT ? OFFSET ?';
    params.push(filters.limit, (filters.page - 1) * filters.limit);

    const workOrders = await executeQuery(query, params);

    const result = {
      workOrders,
      page: filters.page,
      limit: filters.limit,
      total
    };

    // Cache for 5 minutes
    await cacheSet(cacheKey, result, 300);

    return result;
  }

  async getWorkOrderById(id: number, organizationId: number): Promise<any | null> {
    const query = `
      SELECT wo.*, 
             s.name as site_name, s.address as site_address,
             a.name as asset_name, a.asset_tag, a.manufacturer, a.model,
             u.first_name as requested_by_first_name, u.last_name as requested_by_last_name, u.email as requested_by_email,
             t.first_name as tech_first_name, t.last_name as tech_last_name, t.phone as tech_phone,
             v.name as vendor_name, v.phone as vendor_phone, v.email as vendor_email
      FROM work_orders wo
      LEFT JOIN sites s ON wo.site_id = s.id
      LEFT JOIN assets a ON wo.asset_id = a.id
      LEFT JOIN users u ON wo.requested_by_user_id = u.id
      LEFT JOIN technicians t ON wo.assigned_technician_id = t.id
      LEFT JOIN users tech_user ON t.user_id = tech_user.id
      LEFT JOIN vendors v ON wo.assigned_vendor_id = v.id
      WHERE wo.id = ? AND wo.organization_id = ?
    `;

    return await executeQuerySingle(query, [id, organizationId]);
  }

  async createWorkOrder(workOrderData: WorkOrderCreate): Promise<any> {
    const query = `
      INSERT INTO work_orders (
        organization_id, site_id, asset_id, title, description, priority, type,
        requested_by_user_id, scheduled_date, estimated_duration_minutes,
        ai_processed, ai_confidence_score, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      workOrderData.organization_id,
      workOrderData.site_id,
      workOrderData.asset_id || null,
      workOrderData.title,
      workOrderData.description || null,
      workOrderData.priority,
      workOrderData.type,
      workOrderData.requested_by_user_id,
      workOrderData.scheduled_date || null,
      workOrderData.estimated_duration_minutes || null,
      workOrderData.ai_processed || false,
      workOrderData.ai_confidence_score || null,
      workOrderData.status
    ];

    const workOrderId = await executeInsert(query, params);

    // Clear cache
    await cacheInvalidateWorkOrders(workOrderData.organization_id);

    // Create history entry
    await this.createHistoryEntry(
      workOrderId,
      workOrderData.requested_by_user_id,
      'created',
      null,
      workOrderData
    );

    return await this.getWorkOrderById(workOrderId, workOrderData.organization_id);
  }

  async updateWorkOrder(
    id: number,
    updateData: any,
    organizationId: number,
    userId: number
  ): Promise<any> {
    // Get current work order for history
    const currentWorkOrder = await this.getWorkOrderById(id, organizationId);
    if (!currentWorkOrder) {
      throw new Error('Work order not found');
    }

    // Build dynamic update query
    const updateFields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        updateFields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push('updated_at = NOW()');
    params.push(id, organizationId);

    const query = `UPDATE work_orders SET ${updateFields.join(', ')} WHERE id = ? AND organization_id = ?`;
    
    await executeUpdate(query, params);

    // Clear cache
    await cacheInvalidateWorkOrders(organizationId);

    // Create history entry
    await this.createHistoryEntry(
      id,
      userId,
      'updated',
      currentWorkOrder,
      updateData
    );

    return await this.getWorkOrderById(id, organizationId);
  }

  async deleteWorkOrder(id: number, organizationId: number, userId: number): Promise<void> {
    const currentWorkOrder = await this.getWorkOrderById(id, organizationId);
    if (!currentWorkOrder) {
      throw new Error('Work order not found');
    }

    // Soft delete - update status to cancelled
    await executeUpdate(
      'UPDATE work_orders SET status = ?, updated_at = NOW() WHERE id = ? AND organization_id = ?',
      ['cancelled', id, organizationId]
    );

    // Clear cache
    await cacheInvalidateWorkOrders(organizationId);

    // Create history entry
    await this.createHistoryEntry(
      id,
      userId,
      'cancelled',
      currentWorkOrder,
      { status: 'cancelled' }
    );
  }

  async assignWorkOrder(
    id: number,
    assignmentData: { technician_id?: number; vendor_id?: number; notes?: string },
    organizationId: number,
    userId: number
  ): Promise<any> {
    const currentWorkOrder = await this.getWorkOrderById(id, organizationId);
    if (!currentWorkOrder) {
      throw new Error('Work order not found');
    }

    const updateData = {
      assigned_technician_id: assignmentData.technician_id || null,
      assigned_vendor_id: assignmentData.vendor_id || null,
      status: 'assigned',
      updated_at: new Date()
    };

    await executeUpdate(
      'UPDATE work_orders SET assigned_technician_id = ?, assigned_vendor_id = ?, status = ?, updated_at = NOW() WHERE id = ? AND organization_id = ?',
      [updateData.assigned_technician_id, updateData.assigned_vendor_id, updateData.status, id, organizationId]
    );

    // Clear cache
    await cacheInvalidateWorkOrders(organizationId);

    // Create history entry
    await this.createHistoryEntry(
      id,
      userId,
      'assigned',
      currentWorkOrder,
      updateData,
      assignmentData.notes
    );

    return await this.getWorkOrderById(id, organizationId);
  }

  async completeWorkOrder(
    id: number,
    completionData: { 
      resolution_notes?: string; 
      actual_duration_minutes?: number; 
      parts_used?: any[] 
    },
    organizationId: number,
    userId: number
  ): Promise<any> {
    const currentWorkOrder = await this.getWorkOrderById(id, organizationId);
    if (!currentWorkOrder) {
      throw new Error('Work order not found');
    }

    const updateData = {
      status: 'completed',
      completed_at: new Date(),
      actual_duration_minutes: completionData.actual_duration_minutes,
      updated_at: new Date()
    };

    await executeUpdate(
      'UPDATE work_orders SET status = ?, completed_at = ?, actual_duration_minutes = ?, updated_at = NOW() WHERE id = ? AND organizationId = ?',
      [updateData.status, updateData.completed_at, updateData.actual_duration_minutes, id, organizationId]
    );

    // Clear cache
    await cacheInvalidateWorkOrders(organizationId);

    // Create history entry
    await this.createHistoryEntry(
      id,
      userId,
      'completed',
      currentWorkOrder,
      updateData,
      completionData.resolution_notes
    );

    // Store parts used if provided
    if (completionData.parts_used && completionData.parts_used.length > 0) {
      // This would typically go to a parts_used table
      logger.info('Parts used for work order completion:', { workOrderId: id, parts: completionData.parts_used });
    }

    return await this.getWorkOrderById(id, organizationId);
  }

  async getWorkOrderHistory(id: number, organizationId: number): Promise<any[]> {
    const query = `
      SELECT woh.*, 
             u.first_name, u.last_name
      FROM work_order_history woh
      LEFT JOIN users u ON woh.user_id = u.id
      WHERE woh.work_order_id = ?
      ORDER BY woh.timestamp DESC
    `;

    return await executeQuery(query, [id]);
  }

  private async createHistoryEntry(
    workOrderId: number,
    userId: number,
    action: string,
    oldValues: any,
    newValues: any,
    notes?: string
  ): Promise<void> {
    await executeInsert(
      'INSERT INTO work_order_history (work_order_id, user_id, action, old_values, new_values, notes, timestamp) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [
        workOrderId,
        userId,
        action,
        JSON.stringify(oldValues),
        JSON.stringify(newValues),
        notes || null
      ]
    );
  }
}

// Helper function to invalidate work order cache
async function cacheInvalidateWorkOrders(organizationId: number): Promise<void> {
  await cacheInvalidatePattern(`work_orders:${organizationId}:*`);
}