import { Request, Response, NextFunction } from 'express';
import { UnitService } from '../services/unit.service';

export class UnitController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, name, code } = req.query;
      const result = await UnitService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search ? String(search) : undefined,
        name: name ? String(name) : undefined,
        code: code ? String(code) : undefined,
      });
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }


  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const unit = await UnitService.getById(id);
      if (!unit) {
        res.status(404).json({ success: false, message: 'Unit not found' });
        return;
      }
      res.json({ success: true, unit });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, code, description } = req.body;
      if (!name || !code) {
        res.status(400).json({ success: false, message: 'Name and Code are required' });
        return;
      }

      const unit = await UnitService.create({ name, code, description });
      res.status(201).json({ success: true, message: 'Unit created successfully', unit });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { name, code, description } = req.body;

      const unit = await UnitService.update(id, { name, code, description });
      res.json({ success: true, message: 'Unit updated successfully', unit });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      await UnitService.delete(id);
      res.json({ success: true, message: 'Unit deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
