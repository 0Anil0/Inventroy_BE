import { Request, Response, NextFunction } from 'express';
import { VendorService } from '../services/vendor.service';

export class VendorController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, name, contact_person, phone, email } = req.query;
      const result = await VendorService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search ? String(search) : undefined,
        name: name ? String(name) : undefined,
        contact_person: contact_person ? String(contact_person) : undefined,
        phone: phone ? String(phone) : undefined,
        email: email ? String(email) : undefined,
      });
      res.json({ success: true, ...result });
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
