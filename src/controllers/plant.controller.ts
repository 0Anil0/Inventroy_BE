import { Request, Response, NextFunction } from 'express';
import { PlantService } from '../services/plant.service';

export class PlantController {
  public static async getPlants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, status } = req.query;
      const result = await PlantService.getAllPlants({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search ? String(search) : undefined,
        status: status as 'active' | 'inactive' | undefined,
      });
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch plants' });
    }
  }

  public static async getPlantById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const plant = await PlantService.getPlantById(id);
      res.json({ success: true, plant });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Plant not found' });
    }
  }

  public static async createPlant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, code, address, status } = req.body;
      if (!name || !code) {
        res.status(400).json({ success: false, message: 'Plant name and code are required' });
        return;
      }
      const plant = await PlantService.createPlant({ name, code, address, status });
      res.status(201).json({ success: true, plant });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create plant' });
    }
  }

  public static async updatePlant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { name, code, address, status } = req.body;
      const plant = await PlantService.updatePlant(id, { name, code, address, status });
      res.json({ success: true, plant });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to update plant' });
    }
  }

  public static async deletePlant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await PlantService.deletePlant(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to delete plant' });
    }
  }
}
