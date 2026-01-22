import { logger } from '../utils/logger';

// Base CMMS integration interface
export interface CMMSIntegration {
  name: string;
  syncWorkOrders(): Promise<WorkOrder[]>;
  createWorkOrder(workOrder: WorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: string, updates: Partial<WorkOrder>): Promise<WorkOrder>;
  getAssets(): Promise<Asset[]>;
  syncAssets(assets: Asset[]): Promise<Asset[]>;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  asset_id?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  name: string;
  asset_tag: string;
  location?: string;
  category?: string;
  manufacturer?: string;
  model?: string;
  status: string;
}

// Mock Fiix CMMS Integration
export class FiixIntegration implements CMMSIntegration {
  name = 'Fiix CMMS';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.fiixsoftware.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async syncWorkOrders(): Promise<WorkOrder[]> {
    logger.info('Syncing work orders from Fiix CMMS');
    
    // Mock implementation - in production, this would make actual API calls
    return this.generateMockWorkOrders();
  }

  async createWorkOrder(workOrder: WorkOrder): Promise<WorkOrder> {
    logger.info('Creating work order in Fiix CMMS', { title: workOrder.title });
    
    // Mock implementation
    const newWorkOrder = {
      ...workOrder,
      id: `fiix_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    logger.info('Work order created in Fiix', { id: newWorkOrder.id });
    return newWorkOrder;
  }

  async updateWorkOrder(id: string, updates: Partial<WorkOrder>): Promise<WorkOrder> {
    logger.info('Updating work order in Fiix CMMS', { id, updates });
    
    // Mock implementation
    const updatedWorkOrder = {
      id,
      ...updates,
      updated_at: new Date().toISOString()
    };

    logger.info('Work order updated in Fiix', { id });
    return updatedWorkOrder as WorkOrder;
  }

  async getAssets(): Promise<Asset[]> {
    logger.info('Fetching assets from Fiix CMMS');
    
    // Mock implementation
    return this.generateMockAssets();
  }

  async syncAssets(assets: Asset[]): Promise<Asset[]> {
    logger.info(`Syncing ${assets.length} assets to Fiix CMMS`);
    
    // Mock implementation - in production, this would sync with actual Fiix API
    return assets.map(asset => ({
      ...asset,
      id: `fiix_${asset.id}`,
      updated_at: new Date().toISOString()
    }));
  }

  private generateMockWorkOrders(): WorkOrder[] {
    return [
      {
        id: 'fiix_wo_001',
        title: 'HVAC Unit Not Cooling',
        description: 'The main HVAC unit in Building A is not cooling properly',
        status: 'open',
        priority: 'high',
        asset_id: 'fiix_asset_001',
        assigned_to: 'tech_john',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'fiix_wo_002',
        title: 'Preventive Maintenance - Chiller',
        description: 'Quarterly preventive maintenance for main chiller',
        status: 'assigned',
        priority: 'medium',
        asset_id: 'fiix_asset_002',
        assigned_to: 'tech_maria',
        created_at: '2024-01-14T09:00:00Z',
        updated_at: '2024-01-15T08:00:00Z'
      }
    ];
  }

  private generateMockAssets(): Asset[] {
    return [
      {
        id: 'fiix_asset_001',
        name: 'Main HVAC Unit',
        asset_tag: 'HVAC-001',
        location: 'Building A - Mechanical Room',
        category: 'HVAC',
        manufacturer: 'Carrier',
        model: '50TC-12',
        status: 'active'
      },
      {
        id: 'fiix_asset_002',
        name: 'Central Chiller',
        asset_tag: 'CHILL-001',
        location: 'Building A - Rooftop',
        category: 'HVAC',
        manufacturer: 'Trane',
        model: 'RTWD-120',
        status: 'active'
      }
    ];
  }
}

// Mock UpKeep Integration
export class UpKeepIntegration implements CMMSIntegration {
  name = 'UpKeep';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.onupkeep.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async syncWorkOrders(): Promise<WorkOrder[]> {
    logger.info('Syncing work orders from UpKeep');
    
    // Mock implementation with UpKeep-specific data
    return this.generateMockWorkOrders();
  }

  async createWorkOrder(workOrder: WorkOrder): Promise<WorkOrder> {
    logger.info('Creating work order in UpKeep', { title: workOrder.title });
    
    const newWorkOrder = {
      ...workOrder,
      id: `upkeep_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return newWorkOrder;
  }

  async updateWorkOrder(id: string, updates: Partial<WorkOrder>): Promise<WorkOrder> {
    logger.info('Updating work order in UpKeep', { id, updates });
    
    const updatedWorkOrder = {
      id,
      ...updates,
      updated_at: new Date().toISOString()
    };

    return updatedWorkOrder as WorkOrder;
  }

  async getAssets(): Promise<Asset[]> {
    logger.info('Fetching assets from UpKeep');
    return this.generateMockAssets();
  }

  async syncAssets(assets: Asset[]): Promise<Asset[]> {
    logger.info(`Syncing ${assets.length} assets to UpKeep`);
    
    return assets.map(asset => ({
      ...asset,
      id: `upkeep_${asset.id}`,
      updated_at: new Date().toISOString()
    }));
  }

  private generateMockWorkOrders(): WorkOrder[] {
    return [
      {
        id: 'upkeep_wo_001',
        title: 'Electrical Panel Inspection',
        description: 'Monthly inspection of main electrical panel',
        status: 'open',
        priority: 'medium',
        asset_id: 'upkeep_asset_003',
        created_at: '2024-01-15T11:00:00Z',
        updated_at: '2024-01-15T11:00:00Z'
      }
    ];
  }

  private generateMockAssets(): Asset[] {
    return [
      {
        id: 'upkeep_asset_003',
        name: 'Main Electrical Panel',
        asset_tag: 'ELEC-001',
        location: 'Building B - Electrical Room',
        category: 'Electrical',
        manufacturer: 'Square D',
        model: 'QO-42',
        status: 'active'
      }
    ];
  }
}

// CMMS Integration Manager
export class CMMSIntegrationManager {
  private integrations: Map<string, CMMSIntegration> = new Map();
  private organizationId: number;

  constructor(organizationId: number) {
    this.organizationId = organizationId;
    this.initializeIntegrations();
  }

  private async initializeIntegrations(): Promise<void> {
    // In production, these would be loaded from database based on organization settings
    const integrations = await this.getOrganizationIntegrations();
    
    integrations.forEach(integration => {
      const cmmsIntegration = this.createIntegration(integration);
      if (cmmsIntegration) {
        this.integrations.set(integration.type, cmmsIntegration);
      }
    });

    logger.info(`Initialized ${this.integrations.size} CMMS integrations for organization ${this.organizationId}`);
  }

  private createIntegration(integration: any): CMMSIntegration | null {
    switch (integration.type) {
      case 'fiix':
        return new FiixIntegration(integration.api_key, integration.base_url);
      case 'upkeep':
        return new UpKeepIntegration(integration.api_key, integration.base_url);
      default:
        logger.warn(`Unknown CMMS integration type: ${integration.type}`);
        return null;
    }
  }

  private async getOrganizationIntegrations(): Promise<any[]> {
    // Mock implementation - in production, this would query the database
    return [
      {
        type: 'fiix',
        api_key: process.env.CMMS_FIIX_API_KEY || 'mock_fiix_key',
        base_url: 'https://api.fiixsoftware.com',
        is_active: true
      }
    ];
  }

  async syncAllWorkOrders(): Promise<Map<string, WorkOrder[]>> {
    const results = new Map<string, WorkOrder[]>();
    
    for (const [name, integration] of this.integrations) {
      try {
        const workOrders = await integration.syncWorkOrders();
        results.set(name, workOrders);
        logger.info(`Synced ${workOrders.length} work orders from ${name}`);
      } catch (error) {
        logger.error(`Failed to sync work orders from ${name}:`, error);
        results.set(name, []);
      }
    }

    return results;
  }

  async createWorkOrderInAllCMMS(workOrder: WorkOrder): Promise<Map<string, WorkOrder>> {
    const results = new Map<string, WorkOrder>();
    
    for (const [name, integration] of this.integrations) {
      try {
        const createdWorkOrder = await integration.createWorkOrder(workOrder);
        results.set(name, createdWorkOrder);
        logger.info(`Created work order ${createdWorkOrder.id} in ${name}`);
      } catch (error) {
        logger.error(`Failed to create work order in ${name}:`, error);
      }
    }

    return results;
  }

  async syncAllAssets(): Promise<Map<string, Asset[]>> {
    const results = new Map<string, Asset[]>();
    
    for (const [name, integration] of this.integrations) {
      try {
        const assets = await integration.getAssets();
        results.set(name, assets);
        logger.info(`Synced ${assets.length} assets from ${name}`);
      } catch (error) {
        logger.error(`Failed to sync assets from ${name}:`, error);
        results.set(name, []);
      }
    }

    return results;
  }

  getActiveIntegrations(): string[] {
    return Array.from(this.integrations.keys());
  }

  hasIntegration(type: string): boolean {
    return this.integrations.has(type);
  }

  getIntegration(type: string): CMMSIntegration | undefined {
    return this.integrations.get(type);
  }
}

// Webhook handler for CMMS integrations
export class CMMSWebhookHandler {
  static async handleWebhook(cmmsType: string, payload: any): Promise<void> {
    logger.info(`Received webhook from ${cmmsType}`, { payload });

    try {
      switch (cmmsType) {
        case 'fiix':
          await this.handleFiixWebhook(payload);
          break;
        case 'upkeep':
          await this.handleUpKeepWebhook(payload);
          break;
        default:
          logger.warn(`Unknown webhook source: ${cmmsType}`);
      }
    } catch (error) {
      logger.error(`Error handling webhook from ${cmmsType}:`, error);
      throw error;
    }
  }

  private static async handleFiixWebhook(payload: any): Promise<void> {
    // Handle Fiix-specific webhook events
    const eventType = payload.event_type;
    
    switch (eventType) {
      case 'work_order.created':
        logger.info('New work order created in Fiix', { workOrderId: payload.work_order_id });
        // Trigger sync or processing
        break;
      case 'work_order.updated':
        logger.info('Work order updated in Fiix', { workOrderId: payload.work_order_id });
        // Trigger sync or update
        break;
      default:
        logger.info(`Unhandled Fiix webhook event: ${eventType}`);
    }
  }

  private static async handleUpKeepWebhook(payload: any): Promise<void> {
    // Handle UpKeep-specific webhook events
    const eventType = payload.event;
    
    switch (eventType) {
      case 'workorder.created':
        logger.info('New work order created in UpKeep', { workOrderId: payload.id });
        break;
      case 'workorder.updated':
        logger.info('Work order updated in UpKeep', { workOrderId: payload.id });
        break;
      default:
        logger.info(`Unhandled UpKeep webhook event: ${eventType}`);
    }
  }
}