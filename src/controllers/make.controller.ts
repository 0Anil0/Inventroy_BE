import { Request, Response, NextFunction } from 'express';
import { MakeService } from '../services/make.service';

export class MakeController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, name, code } = req.query;
      const result = await MakeService.getAll({
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


  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, code, description } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'Make name is required' });
        return;
      }
      const make = await MakeService.create({ name, code, description });
      res.status(201).json({ success: true, make });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const make = await MakeService.update(id, req.body);
      res.json({ success: true, make });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await MakeService.delete(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
