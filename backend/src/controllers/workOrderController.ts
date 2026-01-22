import { Response } from 'express';
import { WorkOrderService } from '../services/workOrderService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

export class WorkOrderController {
  private workOrderService: WorkOrderService;

  constructor() {
    this.workOrderService = new WorkOrderService();
  }

  async getWorkOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const organizationId = req.user!.organizationId;
    const role = req.user!.role;

    const filters = {
      status: req.query.status as string,
      priority: req.query.priority as string,
      site_id: req.query.site_id ? parseInt(req.query.site_id as string) : undefined,
      assigned_technician_id: req.query.assigned_technician_id ? 
        parseInt(req.query.assigned_technician_id as string) : undefined,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    try {
      const result = await this.workOrderService.getWorkOrders(organizationId, filters, role, userId);

      res.json({
        success: true,
        data: result.workOrders,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching work orders:', error);
      throw error;
    }
  }

  async getWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    try {
      const workOrder = await this.workOrderService.getWorkOrderById(parseInt(id), organizationId);

      if (!workOrder) {
        res.status(404).json({
          success: false,
          error: 'Work order not found'
        });
        return;
      }

      res.json({
        success: true,
        data: workOrder
      });
    } catch (error) {
      logger.error('Error fetching work order:', error);
      throw error;
    }
  }

  async createWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const workOrderData = {
      ...req.body,
      organization_id: req.user!.organizationId,
      requested_by_user_id: req.user!.userId,
      status: 'open',
      ai_processed: !!req.body.ai_processed,
      ai_confidence_score: req.body.ai_confidence_score
    };

    try {
      const workOrder = await this.workOrderService.createWorkOrder(workOrderData);

      res.status(201).json({
        success: true,
        data: workOrder
      });
    } catch (error) {
      logger.error('Error creating work order:', error);
      throw error;
    }
  }

  async updateWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;

    try {
      const workOrder = await this.workOrderService.updateWorkOrder(
        parseInt(id),
        req.body,
        organizationId,
        userId
      );

      res.json({
        success: true,
        data: workOrder
      });
    } catch (error) {
      logger.error('Error updating work order:', error);
      throw error;
    }
  }

  async deleteWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;

    try {
      await this.workOrderService.deleteWorkOrder(parseInt(id), organizationId, userId);

      res.json({
        success: true,
        message: 'Work order deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting work order:', error);
      throw error;
    }
  }

  async assignWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { technician_id, vendor_id, notes } = req.body;
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;

    try {
      const workOrder = await this.workOrderService.assignWorkOrder(
        parseInt(id),
        { technician_id, vendor_id, notes },
        organizationId,
        userId
      );

      res.json({
        success: true,
        data: workOrder
      });
    } catch (error) {
      logger.error('Error assigning work order:', error);
      throw error;
    }
  }

  async completeWorkOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { resolution_notes, actual_duration_minutes, parts_used } = req.body;
    const organizationId = req.user!.organizationId;
    const userId = req.user!.userId;

    try {
      const workOrder = await this.workOrderService.completeWorkOrder(
        parseInt(id),
        { resolution_notes, actual_duration_minutes, parts_used },
        organizationId,
        userId
      );

      res.json({
        success: true,
        data: workOrder
      });
    } catch (error) {
      logger.error('Error completing work order:', error);
      throw error;
    }
  }

  async getWorkOrderHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    try {
      const history = await this.workOrderService.getWorkOrderHistory(
        parseInt(id),
        organizationId
      );

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error fetching work order history:', error);
      throw error;
    }
  }
}