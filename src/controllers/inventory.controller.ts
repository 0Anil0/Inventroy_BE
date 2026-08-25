import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';

export class InventoryController {
  public static async getByProjectId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = parseInt(String(req.params.projectId), 10);
      const inventory = await InventoryService.getByProjectId(projectId);
      res.json({ success: true, inventory });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async adjustQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_id, item_type_id, amount, quantity, min_quantity } = req.body;

      const qtyVal = amount !== undefined ? amount : quantity;

      if (!project_id || !item_type_id || qtyVal === undefined) {
        res.status(400).json({
          success: false,
          message: 'project_id, item_type_id, and quantity are required',
        });
        return;
      }

      const updatedRecord = await InventoryService.adjustQuantity({
        project_id: parseInt(String(project_id), 10),
        item_type_id: parseInt(String(item_type_id), 10),
        amount: parseFloat(String(qtyVal)),
        min_quantity: min_quantity !== undefined ? parseFloat(String(min_quantity)) : undefined,
      });

      res.json({ success: true, inventoryItem: updatedRecord });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async batchAdjustQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_id, items } = req.body;

      if (!project_id || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'project_id and a non-empty array of items are required',
        });
        return;
      }

      const inventoryItems = await InventoryService.batchAdjustQuantity({
        project_id: parseInt(String(project_id), 10),
        items: items.map((i: any) => ({
          item_type_id: parseInt(String(i.item_type_id), 10),
          quantity: parseFloat(String(i.quantity !== undefined ? i.quantity : i.initial_quantity || 0)),
          min_quantity: i.min_quantity !== undefined ? parseFloat(String(i.min_quantity)) : undefined,
        })),
      });

      res.json({ success: true, inventoryItems });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
