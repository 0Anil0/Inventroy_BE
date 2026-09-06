import { ItemDescription } from '../models/ItemDescription';

export class ItemDescriptionService {
  public static async getAll() {
    return await ItemDescription.findAll({
      order: [['name', 'ASC']],
    });
  }

  public static async create(data: { name: string; code?: string; description?: string }) {
    const trimmedName = data.name.trim();
    const existing = await ItemDescription.findOne({ where: { name: trimmedName } });
    if (existing) return existing;

    return await ItemDescription.create({
      name: trimmedName,
      code: data.code || null,
      description: data.description || null,
    });
  }

  public static async update(id: number, data: { name?: string; code?: string; description?: string }) {
    const item = await ItemDescription.findByPk(id);
    if (!item) throw new Error('Item description not found');

    if (data.name) data.name = data.name.trim();
    await item.update(data);
    return item;
  }

  public static async delete(id: number) {
    const item = await ItemDescription.findByPk(id);
    if (!item) throw new Error('Item description not found');
    await item.destroy();
    return { success: true, message: 'Item description deleted successfully' };
  }

  public static async seedDefaultItemDescriptions() {
    const defaults = [
      '2A / 4P',
      '4A / 4P',
      '6A / 1P',
      '6A / 4P',
      '10A / 1P',
      '10A / 4P',
      '16A / 1P',
      '16A / 4P',
      '25A / 4P',
      '32A / 4P',
      '40A / 4P',
      '63A / 4P',
      '100A 36kA',
      '100mA / 4P',
      '300mA / 4P',
      '3P 25A',
      '4P 63A',
    ];

    for (const name of defaults) {
      await ItemDescription.findOrCreate({
        where: { name },
        defaults: { name },
      });
    }
    console.log('Default Item Descriptions (Ratings/Specs) verified in database.');
  }
}
