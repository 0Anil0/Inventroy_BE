import { Request, Response, NextFunction } from 'express';
import { ItemTypeService } from '../services/item-type.service';

export class ItemTypeController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await ItemTypeService.getAll();
      res.json({ success: true, items });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, code, unit, description } = req.body;
      if (!name || !code) {
        res.status(400).json({ success: false, message: 'Name and Code are required' });
        return;
      }
      const item = await ItemTypeService.create({ name, code, unit, description });
      res.status(201).json({ success: true, item });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const item = await ItemTypeService.update(id, req.body);
      res.json({ success: true, item });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await ItemTypeService.delete(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
