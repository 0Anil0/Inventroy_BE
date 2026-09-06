import { Make } from '../models/Make';

export class MakeService {
  public static async getAll() {
    return await Make.findAll({
      order: [['name', 'ASC']],
    });
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
