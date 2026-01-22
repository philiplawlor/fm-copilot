import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { CMMSIntegrationManager, CMMSWebhookHandler } from '../services/cmmsIntegration';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/integrations - Get available integrations
router.get('/', 
  roleMiddleware(['admin', 'facility_manager']),
  asyncHandler(async (req: any, res: any) => {
    const organizationId = req.user.organizationId;
    const manager = new CMMSIntegrationManager(organizationId);
    
    const activeIntegrations = manager.getActiveIntegrations();
    
    res.json({
      success: true,
      data: {
        active_integrations: activeIntegrations,
        total_integrations: activeIntegrations.length
      }
    });
  })
);

// POST /api/integrations/sync/work-orders - Sync work orders from all CMMS
router.post('/sync/work-orders',
  roleMiddleware(['admin', 'facility_manager']),
  asyncHandler(async (req: any, res: any) => {
    const organizationId = req.user.organizationId;
    const manager = new CMMSIntegrationManager(organizationId);
    
    const results = await manager.syncAllWorkOrders();
    
    // Convert Map to object for JSON serialization
    const resultsObj: any = {};
    let totalWorkOrders = 0;
    
    for (const [cmms, workOrders] of results) {
      resultsObj[cmms] = workOrders;
      totalWorkOrders += workOrders.length;
    }
    
    res.json({
      success: true,
      data: {
        results: resultsObj,
        summary: {
          total_integrations: results.size,
          total_work_orders: totalWorkOrders,
          integrations_with_work_orders: Array.from(results.values()).filter(wo => wo.length > 0).length
        }
      }
    });
  })
);

// POST /api/integrations/sync/assets - Sync assets from all CMMS
router.post('/sync/assets',
  roleMiddleware(['admin', 'facility_manager']),
  asyncHandler(async (req: any, res: any) => {
    const organizationId = req.user.organizationId;
    const manager = new CMMSIntegrationManager(organizationId);
    
    const results = await manager.syncAllAssets();
    
    const resultsObj: any = {};
    let totalAssets = 0;
    
    for (const [cmms, assets] of results) {
      resultsObj[cmms] = assets;
      totalAssets += assets.length;
    }
    
    res.json({
      success: true,
      data: {
        results: resultsObj,
        summary: {
          total_integrations: results.size,
          total_assets: totalAssets,
          integrations_with_assets: Array.from(results.values()).filter(assets => assets.length > 0).length
        }
      }
    });
  })
);

// POST /api/integrations/webhook/:cmmsType - Handle webhooks from CMMS systems
router.post('/webhook/:cmmsType', 
  asyncHandler(async (req: any, res: any) => {
    const { cmmsType } = req.params;
    const payload = req.body;
    
    // Verify webhook signature (implementation depends on CMMS)
    const signature = req.headers['x-signature'] as string;
    // const isValid = await this.verifyWebhookSignature(cmmsType, payload, signature);
    const isValid = true; // TODO: Implement signature verification
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }
    
    await CMMSWebhookHandler.handleWebhook(cmmsType, payload);
    
    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  })
);

// Helper function to verify webhook signatures (CMMS-specific)
async function verifyWebhookSignature(cmmsType: string, payload: any, signature: string): Promise<boolean> {
  // In production, implement signature verification for each CMMS
  // For now, we'll accept all signatures for demo purposes
  
  switch (cmmsType) {
    case 'fiix':
      // Implement Fiix signature verification
      return true; // Placeholder
    case 'upkeep':
      // Implement UpKeep signature verification
      return true; // Placeholder
    default:
      return false;
  }
}

export default router;