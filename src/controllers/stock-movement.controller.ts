import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';

export class StockMovementController {
  public static async getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_id, item_type_id, limit } = req.query;

      const movements = await InventoryService.getStockMovements({
        project_id: project_id ? parseInt(String(project_id), 10) : undefined,
        item_type_id: item_type_id ? parseInt(String(item_type_id), 10) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 50,
      });

      res.json({ success: true, movements });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
