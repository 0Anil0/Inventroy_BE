import { Request, Response } from 'express';
import { InventoryLotService } from '../services/inventoryLot.service';

export class InventoryLotController {
  public static async getAvailableLots(req: Request, res: Response): Promise<void> {
    try {
      const project_id = req.query.project_id ? parseInt(String(req.query.project_id), 10) : undefined;
      const item_type_id = req.query.item_type_id ? parseInt(String(req.query.item_type_id), 10) : undefined;
      const plant_id = (req as any).plantId;

      const lots = await InventoryLotService.getAvailableLots({ project_id, item_type_id, plant_id });
      res.json({ success: true, lots });
    } catch (error: any) {
      console.error('Error fetching inventory lots:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch inventory stock lots' });
    }
  }
}
