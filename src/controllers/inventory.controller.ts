import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';

export class InventoryController {
  public static async clearTransactionalData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InventoryService.clearTransactionalData();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getAllInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inventory = await InventoryService.getAllInventory();
      res.json({ success: true, inventory });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getByProjectId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawParam = req.params.projectId;
      let projectId = 0;
      if (rawParam === 'all' || rawParam === '-1') {
        projectId = -1;
      } else if (rawParam && rawParam !== '0' && rawParam !== 'general') {
        const parsed = parseInt(String(rawParam), 10);
        if (!isNaN(parsed)) projectId = parsed;
      }

      const search = req.query.search ? String(req.query.search) : undefined;
      const filterMode = req.query.filterMode ? (String(req.query.filterMode) as 'ALL' | 'LOW_STOCK') : undefined;
      const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

      const result = await InventoryService.getByProjectId({
        projectId,
        search,
        filterMode,
        startDate,
        endDate,
        page,
        limit,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async adjustQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        project_id,
        item_type_id,
        amount,
        quantity,
        min_quantity,
        unit_price,
        lot_number,
        shelf_id,
        rack_id,
        adjustment_type,
        notes,
      } = req.body;
      const userId = (req as any).user?.id;

      const qtyVal = amount !== undefined ? amount : quantity;

      if (project_id === undefined || project_id === null || !item_type_id || qtyVal === undefined) {
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
        unit_price: unit_price !== undefined ? parseFloat(String(unit_price)) : undefined,
        lot_number: lot_number ? String(lot_number) : undefined,
        shelf_id: shelf_id ? parseInt(String(shelf_id), 10) : undefined,
        rack_id: rack_id ? parseInt(String(rack_id), 10) : undefined,
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

      if (project_id === undefined || project_id === null || !Array.isArray(items) || items.length === 0) {
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
          unit_price: i.unit_price !== undefined ? parseFloat(String(i.unit_price)) : undefined,
          lot_number: i.lot_number ? String(i.lot_number) : undefined,
          shelf_id: i.shelf_id ? parseInt(String(i.shelf_id), 10) : undefined,
          rack_id: i.rack_id ? parseInt(String(i.rack_id), 10) : undefined,
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
      const { from_project_id, to_project_id, item_type_id, quantity, lot_id, notes } = req.body;
      const userId = (req as any).user?.id;

      if (
        from_project_id === undefined ||
        from_project_id === null ||
        to_project_id === undefined ||
        to_project_id === null ||
        !item_type_id ||
        !quantity
      ) {
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
        lot_id: lot_id ? parseInt(String(lot_id), 10) : undefined,
        user_id: userId,
        notes,
      });

      res.json({
        success: true,
        message: `Stock transferred successfully [Ref: ${result.transfer_ref}]`,
        transfer_ref: result.transfer_ref,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
