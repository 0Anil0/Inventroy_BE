import { Op } from 'sequelize';
import { ItemType, Unit } from '../models';

export interface ItemTypeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  make?: string;
  rating?: string;
  code?: string;
  cat_no?: string;
  name?: string;
}

export class ItemTypeService {
  public static async getAll(params: ItemTypeQueryParams = {}) {
    const page = params.page && Number(params.page) > 0 ? Number(params.page) : 1;
    const limit = params.limit && Number(params.limit) > 0 ? Number(params.limit) : 1000;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      const q = `%${params.search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: q } },
        { code: { [Op.iLike]: q } },
        { cat_no: { [Op.iLike]: q } },
        { make: { [Op.iLike]: q } },
        { rating: { [Op.iLike]: q } },
        { full_description: { [Op.iLike]: q } },
      ];
    }

    if (params.make && params.make !== 'ALL') {
      where.make = params.make;
    }

    if (params.rating) {
      where.rating = { [Op.iLike]: `%${params.rating.trim()}%` };
    }

    if (params.code) {
      where.code = { [Op.iLike]: `%${params.code.trim()}%` };
    }

    if (params.cat_no) {
      where.cat_no = { [Op.iLike]: `%${params.cat_no.trim()}%` };
    }

    if (params.name) {
      where.name = { [Op.iLike]: `%${params.name.trim()}%` };
    }

    const { count, rows } = await ItemType.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [{ model: Unit, as: 'unit_details', required: false }],
    });

    return {
      items: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }


  public static async create(data: {
    name: string;
    code: string;
    cat_no?: string;
    make?: string;
    rating?: string;
    switchgear_family?: string;
    full_description?: string;
    unit?: string;
    unit_id?: number;
    total_quantity?: number;
    description?: string;
    unit_rate?: number;
    discount?: number;
  }) {
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

    const created = await ItemType.create({
      name: data.name,
      code: data.code,
      cat_no: data.cat_no || null,
      make: data.make || null,
      rating: data.rating || null,
      switchgear_family: data.switchgear_family || null,
      full_description: data.full_description || null,
      unit: unitStr,
      unit_id: data.unit_id || null,
      total_quantity: data.total_quantity !== undefined ? data.total_quantity : 0,
      description: data.description || null,
      unit_rate: data.unit_rate || 0,
      discount: data.discount || 0,
    });

    return await ItemType.findByPk(created.id, {
      include: [{ model: Unit, as: 'unit_details', required: false }],
    });
  }

  public static async update(
    id: number,
    data: {
      name?: string;
      code?: string;
      cat_no?: string;
      make?: string;
      rating?: string;
      switchgear_family?: string;
      full_description?: string;
      unit?: string;
      unit_id?: number;
      total_quantity?: number;
      description?: string;
      unit_rate?: number;
      discount?: number;
    }
  ) {
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
