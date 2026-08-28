import { Request, Response, NextFunction } from 'express';
import { POService } from '../services/po.service';

export class POController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_id, vendor_id } = req.query;
      const purchaseOrders = await POService.getAll({
        project_id: project_id ? parseInt(String(project_id), 10) : undefined,
        vendor_id: vendor_id ? parseInt(String(vendor_id), 10) : undefined,
      });
      res.json({ success: true, purchaseOrders });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const purchaseOrder = await POService.getById(id);
      res.json({ success: true, purchaseOrder });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vendor_id, project_id, notes, expected_date, items } = req.body;
      if (!vendor_id || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'vendor_id and a non-empty array of items are required',
        });
        return;
      }

      const purchaseOrder = await POService.create({
        vendor_id: parseInt(String(vendor_id), 10),
        project_id: project_id ? parseInt(String(project_id), 10) : undefined,
        notes,
        expected_date,
        items,
      });

      res.status(201).json({ success: true, purchaseOrder });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async receiveStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const userId = (req as any).user?.id;
      const purchaseOrder = await POService.receiveStock(id, userId);
      res.json({
        success: true,
        message: 'Stock received and updated in inventory successfully',
        purchaseOrder,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
