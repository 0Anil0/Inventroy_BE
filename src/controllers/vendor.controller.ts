import { Request, Response, NextFunction } from 'express';
import { VendorService } from '../services/vendor.service';

export class VendorController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendors = await VendorService.getAll();
      res.json({ success: true, vendors });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, contact_person, phone, email, address, tax_id } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'Vendor name is required' });
        return;
      }
      const vendor = await VendorService.create({
        name,
        contact_person,
        phone,
        email,
        address,
        tax_id,
      });
      res.status(201).json({ success: true, vendor });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const vendor = await VendorService.update(id, req.body);
      res.json({ success: true, vendor });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await VendorService.delete(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
