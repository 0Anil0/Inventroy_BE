import { Op } from 'sequelize';
import { Make } from '../models/Make';

export interface MakeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  name?: string;
  code?: string;
}

export class MakeService {
  public static async getAll(params: MakeQueryParams = {}) {
    const page = params.page && Number(params.page) > 0 ? Number(params.page) : 1;
    const limit = params.limit && Number(params.limit) > 0 ? Number(params.limit) : 1000;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      const q = `%${params.search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: q } },
        { code: { [Op.iLike]: q } },
        { description: { [Op.iLike]: q } },
      ];
    }

    if (params.name) {
      where.name = { [Op.iLike]: `%${params.name.trim()}%` };
    }

    if (params.code) {
      where.code = { [Op.iLike]: `%${params.code.trim()}%` };
    }

    const { count, rows } = await Make.findAndCountAll({
      where,
      limit,
      offset,
      order: [['name', 'ASC']],
    });

    return {
      makes: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }


  public static async create(data: { name: string; code?: string; description?: string }) {
    const existing = await Make.findOne({ where: { name: data.name } });
    if (existing) return existing;

    return await Make.create({
      name: data.name.toUpperCase(),
      code: data.code || null,
      description: data.description || null,
    });
  }

  public static async update(id: number, data: { name?: string; code?: string; description?: string }) {
    const make = await Make.findByPk(id);
    if (!make) throw new Error('Make not found');

    if (data.name) data.name = data.name.toUpperCase();
    await make.update(data);
    return make;
  }

  public static async delete(id: number) {
    const make = await Make.findByPk(id);
    if (!make) throw new Error('Make not found');
    await make.destroy();
    return { success: true, message: 'Make deleted successfully' };
  }

  public static async seedDefaultMakes() {
    const defaults = [
      'ABB',
      'SCHNEIDER',
      'SOCOMEC',
      'SIEMENS',
      'ESBEE',
      'PECOX',
      'LAPP',
      'ELMEASURE',
      'MULTISPAN',
      'E91E GRADE',
      'CONECTWELL',
    ];

    for (const name of defaults) {
      await Make.findOrCreate({
        where: { name },
        defaults: { name },
      });
    }
    console.log('Default Makes (Brands) verified in database.');
  }
}
