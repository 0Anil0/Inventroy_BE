import { Request, Response, NextFunction } from 'express';
import { MaterialIssueService } from '../services/material-issue.service';

export class MaterialIssueController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_id } = req.query;
      const issues = await MaterialIssueService.getAll({
        project_id: project_id ? parseInt(String(project_id), 10) : undefined,
      });
      res.json({ success: true, issues });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const issue = await MaterialIssueService.getById(id);
      res.json({ success: true, issue });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_id, issued_to, notes, items } = req.body;
      const userId = (req as any).user?.id;

      if (!project_id || !issued_to || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'project_id, issued_to, and a non-empty array of items are required',
        });
        return;
      }

      const issue = await MaterialIssueService.create({
        project_id: parseInt(String(project_id), 10),
        issued_to,
        issued_by_user_id: userId,
        notes,
        items,
      });

      res.status(201).json({ success: true, issue });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
