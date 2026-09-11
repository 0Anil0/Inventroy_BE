import { Request, Response, NextFunction } from 'express';
import { POService } from '../services/po.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class POController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_id, vendor_id } = req.query;
      const user = (req as AuthenticatedRequest).user;
      const currentUser = user ? { userId: user.userId, role: user.role } : undefined;

      const purchaseOrders = await POService.getAll(
        {
          project_id: project_id ? parseInt(String(project_id), 10) : undefined,
          vendor_id: vendor_id ? parseInt(String(vendor_id), 10) : undefined,
        },
        currentUser
      );
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
      const { vendor_id, project_id, terms_and_conditions_id, notes, expected_date, items, po_number } = req.body;
      const user = (req as AuthenticatedRequest).user;
      const createdById = user ? user.userId : undefined;

      if (!vendor_id || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'vendor_id and a non-empty array of items are required',
        });
        return;
      }

      const purchaseOrder = await POService.create(
        {
          po_number,
          vendor_id: parseInt(String(vendor_id), 10),
          project_id: project_id ? parseInt(String(project_id), 10) : undefined,
          terms_and_conditions_id: terms_and_conditions_id ? parseInt(String(terms_and_conditions_id), 10) : undefined,
          notes,
          expected_date,
          items,
        },
        createdById
      );

      res.status(201).json({ success: true, purchaseOrder });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const user = (req as AuthenticatedRequest).user;
      const currentUser = user ? { userId: user.userId, role: user.role } : undefined;

      const { vendor_id, project_id, terms_and_conditions_id, notes, expected_date, items, po_number } = req.body;

      const purchaseOrder = await POService.update(
        id,
        {
          po_number,
          vendor_id: vendor_id ? parseInt(String(vendor_id), 10) : undefined,
          project_id: project_id !== undefined ? (project_id ? parseInt(String(project_id), 10) : undefined) : undefined,
          terms_and_conditions_id: terms_and_conditions_id !== undefined ? (terms_and_conditions_id ? parseInt(String(terms_and_conditions_id), 10) : undefined) : undefined,
          notes,
          expected_date,
          items,
        },
        currentUser
      );

      res.json({ success: true, purchaseOrder, message: 'Purchase Order updated successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const purchaseOrder = await POService.approve(id, user.userId, user.role);
      res.json({ success: true, message: 'Purchase Order approved successfully', purchaseOrder });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const purchaseOrder = await POService.reject(id, user.userId, user.role);
      res.json({ success: true, message: 'Purchase Order rejected successfully', purchaseOrder });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async receiveStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const userId = (req as any).user?.userId;
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

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const user = (req as AuthenticatedRequest).user;
      const currentUser = user ? { userId: user.userId, role: user.role } : undefined;
      const result = await POService.delete(id, currentUser);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getItemTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { item_type_id, vendor_id, project_id, status, search } = req.query;
      const result = await POService.getItemTracking({
        item_type_id: item_type_id ? parseInt(String(item_type_id), 10) : undefined,
        vendor_id: vendor_id ? parseInt(String(vendor_id), 10) : undefined,
        project_id: project_id ? parseInt(String(project_id), 10) : undefined,
        status: status ? String(status) : undefined,
        search: search ? String(search) : undefined,
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
