import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { WorkOrderController } from '../controllers/workOrderController';
import { authMiddleware } from '../middleware/auth';
import { validateWorkOrder } from '../middleware/validation';

const router = express.Router();
const workOrderController = new WorkOrderController();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/work-orders - List work orders with filters
router.get('/', asyncHandler(workOrderController.getWorkOrders.bind(workOrderController)));

// GET /api/work-orders/:id - Get specific work order
router.get('/:id', asyncHandler(workOrderController.getWorkOrder.bind(workOrderController)));

// POST /api/work-orders - Create new work order
router.post('/', 
  validateWorkOrder, 
  asyncHandler(workOrderController.createWorkOrder.bind(workOrderController))
);

// PUT /api/work-orders/:id - Update work order
router.put('/:id', 
  validateWorkOrder, 
  asyncHandler(workOrderController.updateWorkOrder.bind(workOrderController))
);

// DELETE /api/work-orders/:id - Delete work order
router.delete('/:id', asyncHandler(workOrderController.deleteWorkOrder.bind(workOrderController)));

// POST /api/work-orders/:id/assign - Assign work order to technician/vendor
router.post('/:id/assign', asyncHandler(workOrderController.assignWorkOrder.bind(workOrderController)));

// POST /api/work-orders/:id/complete - Mark work order as completed
router.post('/:id/complete', asyncHandler(workOrderController.completeWorkOrder.bind(workOrderController)));

// GET /api/work-orders/:id/history - Get work order history/audit trail
router.get('/:id/history', asyncHandler(workOrderController.getWorkOrderHistory.bind(workOrderController)));

export default router;