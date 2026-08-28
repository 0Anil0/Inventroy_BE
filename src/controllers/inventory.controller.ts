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
      const { project_id, item_type_id, amount, quantity, min_quantity, adjustment_type, notes } = req.body;
      const userId = (req as any).user?.id;

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
        adjustment_type,
        user_id: userId,
        notes,
      });

      res.json({ success: true, inventoryItem: updatedRecord });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async batchAdjustQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_id, items, notes } = req.body;
      const userId = (req as any).user?.id;

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
        user_id: userId,
        notes,
      });

      res.json({ success: true, inventoryItems });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async transferStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from_project_id, to_project_id, item_type_id, quantity, notes } = req.body;
      const userId = (req as any).user?.id;

      if (!from_project_id || !to_project_id || !item_type_id || !quantity) {
        res.status(400).json({
          success: false,
          message: 'from_project_id, to_project_id, item_type_id, and quantity are required',
        });
        return;
      }

      const result = await InventoryService.transferStock({
        from_project_id: parseInt(String(from_project_id), 10),
        to_project_id: parseInt(String(to_project_id), 10),
        item_type_id: parseInt(String(item_type_id), 10),
        quantity: parseFloat(String(quantity)),
        user_id: userId,
        notes,
      });

      res.json({ success: true, message: 'Stock transferred successfully', data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
