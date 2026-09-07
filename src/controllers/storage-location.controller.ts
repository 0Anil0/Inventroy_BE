import { Request, Response, NextFunction } from 'express';
import { StorageLocationService } from '../services/storage-location.service';

export class StorageLocationController {
  public static async getAllShelves(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shelves = await StorageLocationService.getAllShelves();
      res.json({ success: true, shelves });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async createShelf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, name, zone, description } = req.body;
      if (!code || !name) {
        res.status(400).json({ success: false, message: 'Shelf code and name are required' });
        return;
      }

      const shelf = await StorageLocationService.createShelf({ code, name, zone, description });
      res.status(201).json({ success: true, shelf });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async updateShelf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { code, name, zone, description } = req.body;

      const shelf = await StorageLocationService.updateShelf(id, { code, name, zone, description });
      res.json({ success: true, shelf });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async deleteShelf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await StorageLocationService.deleteShelf(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async createRack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shelf_id, rack_code, name, capacity_notes } = req.body;
      if (!shelf_id || !rack_code || !name) {
        res.status(400).json({ success: false, message: 'shelf_id, rack_code, and name are required' });
        return;
      }

      const rack = await StorageLocationService.createRack({
        shelf_id: parseInt(String(shelf_id), 10),
        rack_code,
        name,
        capacity_notes,
      });

      res.status(201).json({ success: true, rack });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async updateRack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { rack_code, name, capacity_notes } = req.body;

      const rack = await StorageLocationService.updateRack(id, { rack_code, name, capacity_notes });
      res.json({ success: true, rack });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async deleteRack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await StorageLocationService.deleteRack(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
