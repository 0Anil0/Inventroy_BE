import { Op } from 'sequelize';
import { ItemType, Unit, Make, ItemDescription } from '../models';

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
  /**
   * Helper to verify if Unit, Make, and ItemDescription (Rating) exist in master tables.
   * If not present, auto-creates them so they are saved in database master tables.
   */
  private static async ensureMastersExist(data: { unit?: string; make?: string; rating?: string }) {
    let unitObj: Unit | null = null;
    let unitStr = data.unit && data.unit.trim() ? data.unit.trim().toUpperCase() : undefined;
    let makeStr = data.make && data.make.trim() ? data.make.trim() : undefined;
    let ratingStr = data.rating && data.rating.trim() ? data.rating.trim() : undefined;

    if (unitStr) {
      // Case-insensitive check to prevent duplicates like 'NOS' vs 'nos'
      let existingUnit = await Unit.findOne({
        where: { code: { [Op.iLike]: unitStr } },
      });
      if (!existingUnit) {
        existingUnit = await Unit.create({ code: unitStr, name: unitStr });
      }
      unitObj = existingUnit;
      unitStr = existingUnit.code;
    }

    if (makeStr) {
      // Case-insensitive check to prevent duplicates like 'Havells' vs 'HAVELLS'
      let existingMake = await Make.findOne({
        where: { name: { [Op.iLike]: makeStr } },
      });
      if (!existingMake) {
        existingMake = await Make.create({ name: makeStr });
      }
      makeStr = existingMake.name;
    }

    if (ratingStr) {
      // Case-insensitive check to prevent duplicates like '6A C-Curve' vs '6a c-curve'
      let existingDesc = await ItemDescription.findOne({
        where: { name: { [Op.iLike]: ratingStr } },
      });
      if (!existingDesc) {
        existingDesc = await ItemDescription.create({ name: ratingStr });
      }
      ratingStr = existingDesc.name;
    }

    return { unitObj, unitStr, makeStr, ratingStr };
  }

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
    base_price?: number;
    discount?: number;
  }) {
    const existingCode = await ItemType.findOne({ where: { code: data.code } });
    if (existingCode) {
      throw new Error('Item type code already exists');
    }

    // Check & auto-create unit, make, and rating in master tables if not preset
    const { unitObj, unitStr, makeStr, ratingStr } = await this.ensureMastersExist({
      unit: data.unit,
      make: data.make,
      rating: data.rating,
    });

    const finalUnitStr = unitStr || (data.unit_id ? (await Unit.findByPk(data.unit_id))?.code : 'PCS') || 'PCS';
    const finalUnitId = data.unit_id || unitObj?.id || null;
    const rate = data.base_price !== undefined ? data.base_price : (data.unit_rate || 0);

    const created = await ItemType.create({
      name: data.name,
      code: data.code,
      cat_no: data.cat_no || null,
      make: makeStr || null,
      rating: ratingStr || null,
      switchgear_family: data.switchgear_family || null,
      full_description: data.full_description || null,
      unit: finalUnitStr,
      unit_id: finalUnitId,
      total_quantity: data.total_quantity !== undefined ? data.total_quantity : 0,
      description: data.description || null,
      unit_rate: rate,
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
      base_price?: number;
      discount?: number;
    }
  ) {
    const item = await ItemType.findByPk(id);
    if (!item) throw new Error('Item type not found');

    // Check & auto-create unit, make, and rating in master tables if not preset
    const { unitObj, unitStr, makeStr, ratingStr } = await this.ensureMastersExist({
      unit: data.unit,
      make: data.make,
      rating: data.rating,
    });

    const updatePayload: any = { ...data };
    if (makeStr) updatePayload.make = makeStr;
    if (ratingStr) updatePayload.rating = ratingStr;
    if (unitStr) {
      updatePayload.unit = unitStr;
      if (unitObj) updatePayload.unit_id = unitObj.id;
    }

    if (data.base_price !== undefined) {
      updatePayload.unit_rate = data.base_price;
    }

    await item.update(updatePayload);
    return await ItemType.findByPk(id, {
      include: [{ model: Unit, as: 'unit_details', required: false }],
    });
  }

  public static async bulkImport(items: Array<{
    code: string;
    name: string;
    cat_no?: string;
    make?: string;
    rating?: string;
    unit?: string;
    base_price?: number;
    unit_rate?: number;
    description?: string;
  }>) {
    let createdCount = 0;
    let updatedCount = 0;

    for (const itemData of items) {
      if (!itemData.code || !itemData.name) continue;

      const codeStr = String(itemData.code).trim();
      const nameStr = String(itemData.name).trim();
      const rateVal = itemData.base_price !== undefined
        ? Number(itemData.base_price)
        : (itemData.unit_rate !== undefined ? Number(itemData.unit_rate) : 0);

      // Check & auto-create unit, make, and rating in master tables if not preset
      const { unitObj, unitStr, makeStr, ratingStr } = await this.ensureMastersExist({
        unit: itemData.unit,
        make: itemData.make,
        rating: itemData.rating,
      });

      const finalUnitStr = unitStr || 'PCS';
      const existing = await ItemType.findOne({ where: { code: codeStr } });

      if (existing) {
        await existing.update({
          name: nameStr,
          cat_no: itemData.cat_no ? String(itemData.cat_no).trim() : existing.cat_no,
          make: makeStr || existing.make,
          rating: ratingStr || existing.rating,
          unit: finalUnitStr || existing.unit,
          unit_id: unitObj ? unitObj.id : existing.unit_id,
          unit_rate: rateVal > 0 ? rateVal : existing.unit_rate,
          description: itemData.description ? String(itemData.description).trim() : existing.description,
        });
        updatedCount++;
      } else {
        await ItemType.create({
          code: codeStr,
          name: nameStr,
          cat_no: itemData.cat_no ? String(itemData.cat_no).trim() : null,
          make: makeStr || null,
          rating: ratingStr || null,
          unit: finalUnitStr,
          unit_id: unitObj ? unitObj.id : null,
          unit_rate: rateVal,
          total_quantity: 0,
          description: itemData.description ? String(itemData.description).trim() : null,
        });
        createdCount++;
      }
    }

    return {
      success: true,
      createdCount,
      updatedCount,
      totalProcessed: items.length,
      message: `Bulk import completed: ${createdCount} items created, ${updatedCount} items updated. All new Units, Makes, and Descriptions saved to Master tables.`,
    };
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
