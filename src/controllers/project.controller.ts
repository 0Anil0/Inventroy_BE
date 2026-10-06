import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';

export class ProjectController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search ? String(req.query.search) : undefined;
      const category = req.query.category ? (String(req.query.category) as 'ALL' | 'MAIN' | 'SUB') : undefined;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const plant_id = (req as any).plantId;

      const result = await ProjectService.getAll({ search, category, page, limit, plant_id });
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, code, location, description, parent_id } = req.body;
      const plant_id = (req as any).plantId;
      if (!name || !code) {
        res.status(400).json({ success: false, message: 'Name and Code are required' });
        return;
      }
      const project = await ProjectService.create({ name, code, location, description, parent_id, plant_id });
      res.status(201).json({ success: true, project });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const project = await ProjectService.update(id, req.body);
      res.json({ success: true, project });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await ProjectService.delete(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
