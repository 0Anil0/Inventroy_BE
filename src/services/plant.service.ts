import { Plant } from '../models/Plant';
import { Op } from 'sequelize';

export class PlantService {
  public static async getAllPlants(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive';
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (options?.search) {
      where.name = { [Op.iLike]: `%${options.search}%` };
    }
    if (options?.status) {
      where.status = options.status;
    }

    const { rows, count } = await Plant.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      plants: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  public static async getPlantById(id: number) {
    const plant = await Plant.findByPk(id);
    if (!plant) {
      throw new Error('Plant not found');
    }
    return plant;
  }

  public static async createPlant(data: { name: string; code: string; address?: string; status?: 'active' | 'inactive' }) {
    const existingPlant = await Plant.findOne({ where: { code: data.code } });
    if (existingPlant) {
      throw new Error('Plant code already exists');
    }
    return Plant.create(data as any);
  }

  public static async updatePlant(id: number, data: { name?: string; code?: string; address?: string; status?: 'active' | 'inactive' }) {
    const plant = await this.getPlantById(id);
    if (data.code && data.code !== plant.code) {
      const existingPlant = await Plant.findOne({ where: { code: data.code } });
      if (existingPlant) {
        throw new Error('Plant code already exists');
      }
    }
    return plant.update(data);
  }

  public static async deletePlant(id: number) {
    const plant = await this.getPlantById(id);
    await plant.destroy();
    return { success: true, message: 'Plant deleted successfully' };
  }
}
