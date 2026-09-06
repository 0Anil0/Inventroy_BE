import { Request, Response, NextFunction } from 'express';
import { ItemTypeService } from '../services/item-type.service';

export class ItemTypeController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, make, rating, code, cat_no, name } = req.query;
      const result = await ItemTypeService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search ? String(search) : undefined,
        make: make ? String(make) : undefined,
        rating: rating ? String(rating) : undefined,
        code: code ? String(code) : undefined,
        cat_no: cat_no ? String(cat_no) : undefined,
        name: name ? String(name) : undefined,
      });
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }


  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, code, cat_no, make, rating, switchgear_family, full_description, unit, unit_id, total_quantity, description, unit_rate, discount } = req.body;
      if (!name || !code) {
        res.status(400).json({ success: false, message: 'Name and Code are required' });
        return;
      }
      const item = await ItemTypeService.create({
        name,
        code,
        cat_no,
        make,
        rating,
        switchgear_family,
        full_description,
        unit,
        unit_id,
        total_quantity: total_quantity !== undefined ? parseFloat(String(total_quantity)) : 0,
        description,
        unit_rate: unit_rate !== undefined ? parseFloat(String(unit_rate)) : 0,
        discount: discount !== undefined ? parseFloat(String(discount)) : 0,
      });
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
