import { Request, Response, NextFunction } from 'express';
import { ItemDescriptionService } from '../services/item-description.service';

export class ItemDescriptionController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const descriptions = await ItemDescriptionService.getAll();
      res.json({ success: true, itemDescriptions: descriptions });
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, code, description } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Name is required' });
      }
      const itemDesc = await ItemDescriptionService.create({ name, code, description });
      res.status(201).json({ success: true, itemDescription: itemDesc });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const itemDesc = await ItemDescriptionService.update(Number(id), req.body);
      res.json({ success: true, itemDescription: itemDesc });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await ItemDescriptionService.delete(Number(id));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
