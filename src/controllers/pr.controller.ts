import { Request, Response, NextFunction } from 'express';
import { PRService } from '../services/pr.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class PRController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { project_id, status, priority, search, page, limit } = req.query;
      const result = await PRService.getAll({
        project_id:
          project_id !== undefined && project_id !== 'undefined' && project_id !== 'null'
            ? Number(project_id)
            : undefined,
        status: status as string,
        priority: priority as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        plant_id: (req as AuthenticatedRequest).plantId,
      });
      res.json({
        success: true,
        count: result.total,
        total: result.total,
        pendingCount: result.pendingCount,
        approvedCount: result.approvedCount,
        convertedCount: result.convertedCount,
        items: result.items,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const pr = await PRService.getById(id);
      res.json({ success: true, requisition: pr });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      const plant_id = authReq.plantId;

      if (!plant_id) {
        res.status(400).json({ success: false, message: 'Plant selection is required' });
        return;
      }

      const pr = await PRService.create({ ...req.body, plant_id }, userId);
      res.status(201).json({ success: true, message: 'Purchase Requisition created successfully', requisition: pr });
    } catch (err) {
      next(err);
    }
  }

  public static async reviewAndApprove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const reviewerId = (req as any).user?.id || (req as any).user?.userId;
      const pr = await PRService.reviewAndApprove(id, req.body, reviewerId);
      res.json({ success: true, message: 'Purchase Requisition reviewed & updated', requisition: pr });
    } catch (err) {
      next(err);
    }
  }

  public static async convertToPO(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.id || (req as any).user?.userId;
      const result = await PRService.convertToPO(id, req.body, userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await PRService.delete(id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
