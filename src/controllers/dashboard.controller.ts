import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';

export class DashboardController {
  public static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await InventoryService.getDashboardStats();
      res.json({ success: true, stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
