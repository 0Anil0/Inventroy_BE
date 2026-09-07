import { StorageShelf, StorageRack } from '../models';

export class StorageLocationService {
  public static async getAllShelves() {
    return await StorageShelf.findAll({
      include: [
        {
          model: StorageRack,
          as: 'racks',
        },
      ],
      order: [
        ['id', 'ASC'],
        [{ model: StorageRack, as: 'racks' }, 'id', 'ASC'],
      ],
    });
  }

  public static async createShelf(data: { code: string; name: string; zone?: string; description?: string }) {
    const existing = await StorageShelf.findOne({ where: { code: data.code } });
    if (existing) {
      throw new Error(`Shelf with code '${data.code}' already exists`);
    }

    return await StorageShelf.create({
      code: data.code,
      name: data.name,
      zone: data.zone || null,
      description: data.description || null,
    });
  }

  public static async updateShelf(
    id: number,
    data: { code?: string; name?: string; zone?: string; description?: string }
  ) {
    const shelf = await StorageShelf.findByPk(id);
    if (!shelf) throw new Error('Shelf not found');

    if (data.code && data.code !== shelf.code) {
      const existing = await StorageShelf.findOne({ where: { code: data.code } });
      if (existing) throw new Error(`Shelf with code '${data.code}' already exists`);
    }

    await shelf.update({
      ...(data.code && { code: data.code }),
      ...(data.name && { name: data.name }),
      ...(data.zone !== undefined && { zone: data.zone }),
      ...(data.description !== undefined && { description: data.description }),
    });

    return await StorageShelf.findByPk(id, {
      include: [{ model: StorageRack, as: 'racks' }],
    });
  }

  public static async deleteShelf(id: number) {
    const shelf = await StorageShelf.findByPk(id);
    if (!shelf) throw new Error('Shelf not found');

    await StorageRack.destroy({ where: { shelf_id: id } });
    await shelf.destroy();
    return { success: true, message: 'Shelf and associated racks deleted successfully' };
  }

  public static async createRack(data: { shelf_id: number; rack_code: string; name: string; capacity_notes?: string }) {
    const shelf = await StorageShelf.findByPk(data.shelf_id);
    if (!shelf) throw new Error('Target shelf does not exist');

    return await StorageRack.create({
      shelf_id: data.shelf_id,
      rack_code: data.rack_code,
      name: data.name,
      capacity_notes: data.capacity_notes || null,
    });
  }

  public static async updateRack(
    id: number,
    data: { rack_code?: string; name?: string; capacity_notes?: string }
  ) {
    const rack = await StorageRack.findByPk(id);
    if (!rack) throw new Error('Rack not found');

    await rack.update({
      ...(data.rack_code && { rack_code: data.rack_code }),
      ...(data.name && { name: data.name }),
      ...(data.capacity_notes !== undefined && { capacity_notes: data.capacity_notes }),
    });

    return rack;
  }

  public static async deleteRack(id: number) {
    const rack = await StorageRack.findByPk(id);
    if (!rack) throw new Error('Rack not found');

    await rack.destroy();
    return { success: true, message: 'Rack deleted successfully' };
  }
}
