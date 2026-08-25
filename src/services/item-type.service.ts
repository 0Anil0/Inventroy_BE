import { ItemType, Unit } from '../models';

export class ItemTypeService {
  public static async getAll() {
    return await ItemType.findAll({
      order: [['id', 'ASC']],
      include: [{ model: Unit, as: 'unit_details', required: false }],
    });
  }

  public static async create(data: { name: string; code: string; unit?: string; unit_id?: number; total_quantity?: number; description?: string }) {
    const existingCode = await ItemType.findOne({ where: { code: data.code } });
    if (existingCode) {
      throw new Error('Item type code already exists');
    }

    let unitStr = data.unit || 'pcs';
    if (data.unit_id) {
      const u = await Unit.findByPk(data.unit_id);
      if (u) {
        unitStr = u.code;
      }
    }

    return await ItemType.create({
      name: data.name,
      code: data.code,
      unit: unitStr,
      unit_id: data.unit_id || null,
      total_quantity: data.total_quantity !== undefined ? data.total_quantity : 0,
      description: data.description || null,
    });
  }

  public static async update(id: number, data: { name?: string; code?: string; unit?: string; unit_id?: number; total_quantity?: number; description?: string }) {
    const item = await ItemType.findByPk(id);
    if (!item) throw new Error('Item type not found');

    const updatePayload: any = { ...data };
    if (data.unit_id) {
      const u = await Unit.findByPk(data.unit_id);
      if (u) {
        updatePayload.unit = u.code;
      }
    }

    await item.update(updatePayload);
    return await ItemType.findByPk(id, {
      include: [{ model: Unit, as: 'unit_details', required: false }],
    });
  }

  public static async delete(id: number) {
    const item = await ItemType.findByPk(id);
    if (!item) throw new Error('Item type not found');
    await item.destroy();
    return { success: true, message: 'Item type deleted successfully' };
  }

  public static async seedDefaultItemTypes() {
    const defaults = [
      { name: 'Steel Reinforcement Bar 12mm', code: 'ITM-STL-12', unit: 'kg', total_quantity: 1500, description: 'High tensile steel bar' },
      { name: 'Portland Cement 50kg Bag', code: 'ITM-CMT-50', unit: 'bags', total_quantity: 3000, description: 'Grade 53 OPC Cement' },
      { name: 'Safety Helmet (Yellow)', code: 'ITM-SAF-HLM', unit: 'pcs', total_quantity: 500, description: 'Industrial safety helmet' },
      { name: 'Copper Cable 4sqmm', code: 'ITM-CBL-4MM', unit: 'meters', total_quantity: 5000, description: 'Multi-strand insulated wire' },
    ];

    for (const d of defaults) {
      await ItemType.findOrCreate({
        where: { code: d.code },
        defaults: d,
      });
    }
    console.log('Default Item Types with Central Quantities verified in database.');
  }
}
