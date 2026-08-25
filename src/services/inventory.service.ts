import { ProjectInventory, Project, ItemType } from '../models';

export class InventoryService {
  /**
   * Fetches current stock inventory for a given Project ID
   */
  public static async getByProjectId(projectId: number) {
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    return await ProjectInventory.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: ItemType,
          as: 'item_type',
          attributes: ['id', 'name', 'code', 'unit', 'total_quantity', 'description'],
        },
      ],
      order: [['id', 'ASC']],
    });
  }

  /**
   * Adjusts / updates project stock quantity and updates central item stock in item_types table
   */
  public static async adjustQuantity(data: {
    project_id: number;
    item_type_id: number;
    amount: number; // Target quantity for project
    min_quantity?: number;
  }) {
    const { project_id, item_type_id, amount, min_quantity } = data;

    const project = await Project.findByPk(project_id);
    if (!project) throw new Error('Project not found');

    const itemType = await ItemType.findByPk(item_type_id);
    if (!itemType) throw new Error('Item type not found');

    const [record] = await ProjectInventory.findOrCreate({
      where: { project_id, item_type_id },
      defaults: {
        project_id,
        item_type_id,
        quantity: 0,
        min_quantity: min_quantity || 0,
      },
    });

    const oldProjectQty = record.quantity;
    const targetProjectQty = Math.max(0, amount);
    const diff = targetProjectQty - oldProjectQty;

    // Total available stock in database for this item (Current Item DB Stock + Current Project Stock)
    const maxAvailableFromDB = itemType.total_quantity + oldProjectQty;

    if (targetProjectQty > maxAvailableFromDB) {
      throw new Error(
        `Quantity allocated (${targetProjectQty} ${itemType.unit}) exceeds available stock in DB (${maxAvailableFromDB} ${itemType.unit})`
      );
    }

    // Update central item_types table total_quantity
    const newCentralStock = Math.max(0, itemType.total_quantity - diff);
    await itemType.update({ total_quantity: newCentralStock });

    // Update project inventory record
    const updateFields: any = { quantity: targetProjectQty };
    if (min_quantity !== undefined) {
      updateFields.min_quantity = min_quantity;
    }

    await record.update(updateFields);

    return await ProjectInventory.findByPk(record.id, {
      include: [
        {
          model: ItemType,
          as: 'item_type',
          attributes: ['id', 'name', 'code', 'unit', 'total_quantity', 'description'],
        },
      ],
    });
  }

  /**
   * Batch adjusts/creates stock quantities for multiple items in a project
   */
  public static async batchAdjustQuantity(data: {
    project_id: number;
    items: Array<{
      item_type_id: number;
      quantity: number;
      min_quantity?: number;
    }>;
  }) {
    const { project_id, items } = data;

    const project = await Project.findByPk(project_id);
    if (!project) throw new Error('Project not found');

    const results = [];
    for (const item of items) {
      const updated = await this.adjustQuantity({
        project_id,
        item_type_id: item.item_type_id,
        amount: item.quantity,
        min_quantity: item.min_quantity,
      });
      if (updated) results.push(updated);
    }

    return results;
  }

  /**
   * Seeds initial quantities for project inventory items
   */
  public static async seedInitialInventory() {
    try {
      const projects = await Project.findAll();
      const itemTypes = await ItemType.findAll();

      if (projects.length > 0 && itemTypes.length > 0) {
        const sampleProj = projects[0];
        const initialQuantities = [150, 450, 75, 1200];

        for (let i = 0; i < itemTypes.length; i++) {
          const item = itemTypes[i];
          const qty = initialQuantities[i % initialQuantities.length];
          const existing = await ProjectInventory.findOne({
            where: { project_id: sampleProj.id, item_type_id: item.id },
          });
          if (!existing) {
            await ProjectInventory.create({
              project_id: sampleProj.id,
              item_type_id: item.id,
              quantity: qty,
              min_quantity: 50,
            });
            const updatedCentral = Math.max(0, item.total_quantity - qty);
            await item.update({ total_quantity: updatedCentral });
          }
        }
        console.log(`Initial stock quantities seeded for Project: ${sampleProj.name}`);
      }
    } catch (error) {
      console.error('Error seeding inventory stock:', error);
    }
  }
}
