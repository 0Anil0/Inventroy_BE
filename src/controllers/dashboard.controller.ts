import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class DashboardController {
  public static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plant_id = (req as AuthenticatedRequest).plantId;
      const stats = await InventoryService.getDashboardStats(plant_id);
      res.json({ success: true, stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
