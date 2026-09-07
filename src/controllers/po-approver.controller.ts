import { Request, Response, NextFunction } from 'express';
import { POApproverService } from '../services/po-approver.service';

export class POApproverController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const approvers = await POApproverService.getAll();
      res.json({ success: true, approvers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user_id, min_amount, max_amount } = req.body;
      if (!user_id) {
        res.status(400).json({ success: false, message: 'user_id is required' });
        return;
      }
      const approver = await POApproverService.addApprover({
        user_id: parseInt(String(user_id), 10),
        min_amount: min_amount ? parseFloat(String(min_amount)) : undefined,
        max_amount: max_amount ? parseFloat(String(max_amount)) : undefined,
      });
      res.status(201).json({ success: true, approver });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      await POApproverService.removeApprover(id);
      res.json({ success: true, message: 'Approver removed successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { min_amount, max_amount, is_active } = req.body;
      const approver = await POApproverService.updateApprover(id, {
        min_amount: min_amount !== undefined && min_amount !== null ? parseFloat(String(min_amount)) : undefined,
        max_amount: max_amount !== undefined && max_amount !== null && max_amount !== '' ? parseFloat(String(max_amount)) : null,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined,
      });
      res.json({ success: true, approver });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
