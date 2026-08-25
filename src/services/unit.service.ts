import { Unit, UnitCreationAttributes } from '../models/Unit';

export class UnitService {
  public static async getAll(): Promise<Unit[]> {
    return await Unit.findAll({ order: [['name', 'ASC']] });
  }

  public static async getById(id: number): Promise<Unit | null> {
    return await Unit.findByPk(id);
  }

  public static async create(data: UnitCreationAttributes): Promise<Unit> {
    const existing = await Unit.findOne({ where: { code: data.code.toUpperCase() } });
    if (existing) {
      throw new Error(`Unit with code '${data.code}' already exists`);
    }

    return await Unit.create({
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      description: data.description ? data.description.trim() : null,
    });
  }

  public static async update(id: number, data: Partial<UnitCreationAttributes>): Promise<Unit> {
    const unit = await Unit.findByPk(id);
    if (!unit) {
      throw new Error('Unit not found');
    }

    if (data.code && data.code.toUpperCase() !== unit.code) {
      const existing = await Unit.findOne({ where: { code: data.code.toUpperCase() } });
      if (existing) {
        throw new Error(`Unit with code '${data.code}' already exists`);
      }
      unit.code = data.code.trim().toUpperCase();
    }

    if (data.name) unit.name = data.name.trim();
    if (data.description !== undefined) unit.description = data.description ? data.description.trim() : null;

    await unit.save();
    return unit;
  }

  public static async delete(id: number): Promise<boolean> {
    const unit = await Unit.findByPk(id);
    if (!unit) {
      throw new Error('Unit not found');
    }
    await unit.destroy();
    return true;
  }

  public static async seedDefaultUnits(): Promise<void> {
    const defaultUnits = [
      { name: 'Pieces', code: 'PCS', description: 'Individual piece / count' },
      { name: 'Kilograms', code: 'KG', description: 'Weight in kilograms' },
      { name: 'Meters', code: 'MTR', description: 'Length in meters' },
      { name: 'Liters', code: 'LTR', description: 'Volume in liters' },
      { name: 'Boxes', code: 'BOX', description: 'Box package unit' },
      { name: 'Sets', code: 'SET', description: 'Complete set of items' },
      { name: 'Packets', code: 'PKT', description: 'Packet unit' },
      { name: 'Bags', code: 'BAG', description: 'Bag / Sack container' },
      { name: 'Rolls', code: 'ROLL', description: 'Roll bundle' },
      { name: 'Feet', code: 'FT', description: 'Length in feet' },
    ];

    for (const unitData of defaultUnits) {
      const exists = await Unit.findOne({ where: { code: unitData.code } });
      if (!exists) {
        await Unit.create(unitData);
      }
    }
  }
}
