import { ProjectInventory, Project, ItemType, StockMovement, User } from '../models';

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
    adjustment_type?: 'ADD' | 'REMOVE' | 'SET';
    user_id?: number;
    notes?: string;
  }) {
    const { project_id, item_type_id, amount, min_quantity, adjustment_type, user_id, notes } = data;

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
        min_quantity: min_quantity !== undefined ? min_quantity : 0,
      },
    });

    const oldProjectQty = record.quantity;
    let targetProjectQty = Math.max(0, amount);

    if (adjustment_type === 'ADD') {
      targetProjectQty = oldProjectQty + amount;
    } else if (adjustment_type === 'REMOVE') {
      targetProjectQty = Math.max(0, oldProjectQty - amount);
    }

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

    // Record Audit Movement Log
    if (diff !== 0 || adjustment_type) {
      const movementType: 'IN' | 'OUT' | 'SET' =
        diff > 0 ? 'IN' : diff < 0 ? 'OUT' : 'SET';

      await StockMovement.create({
        project_id,
        item_type_id,
        user_id: user_id || null,
        type: movementType,
        quantity: Math.abs(diff),
        previous_quantity: oldProjectQty,
        new_quantity: targetProjectQty,
        notes: notes || `Stock updated to ${targetProjectQty} ${itemType.unit}`,
      });
    }

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
      quantity?: number;
      initial_quantity?: number;
      min_quantity?: number;
    }>;
    user_id?: number;
    notes?: string;
  }) {
    const { project_id, items, user_id, notes } = data;

    const project = await Project.findByPk(project_id);
    if (!project) throw new Error('Project not found');

    const results = [];
    for (const item of items) {
      const targetQty = item.quantity !== undefined ? item.quantity : item.initial_quantity || 0;
      const updated = await this.adjustQuantity({
        project_id,
        item_type_id: item.item_type_id,
        amount: targetQty,
        min_quantity: item.min_quantity,
        adjustment_type: 'SET',
        user_id,
        notes: notes || 'Batch item allocation to project',
      });
      if (updated) results.push(updated);
    }

    return results;
  }

  /**
   * Transfer stock between two projects
   */
  public static async transferStock(data: {
    from_project_id: number;
    to_project_id: number;
    item_type_id: number;
    quantity: number;
    user_id?: number;
    notes?: string;
  }) {
    const { from_project_id, to_project_id, item_type_id, quantity, user_id, notes } = data;

    if (from_project_id === to_project_id) {
      throw new Error('Source and destination projects must be different');
    }

    if (quantity <= 0) {
      throw new Error('Transfer quantity must be greater than 0');
    }

    const sourceInventory = await ProjectInventory.findOne({
      where: { project_id: from_project_id, item_type_id },
      include: [{ model: ItemType, as: 'item_type' }],
    });

    if (!sourceInventory || sourceInventory.quantity < quantity) {
      throw new Error(
        `Insufficient stock in source project. Available: ${sourceInventory?.quantity || 0}`
      );
    }

    const fromProject = await Project.findByPk(from_project_id);
    const toProject = await Project.findByPk(to_project_id);
    if (!fromProject || !toProject) throw new Error('Project not found');

    const itemType = sourceInventory.item_type || (await ItemType.findByPk(item_type_id));

    // Deduct from Source Project
    const oldSourceQty = sourceInventory.quantity;
    const newSourceQty = oldSourceQty - quantity;
    await sourceInventory.update({ quantity: newSourceQty });

    await StockMovement.create({
      project_id: from_project_id,
      item_type_id,
      user_id: user_id || null,
      type: 'TRANSFER',
      quantity,
      previous_quantity: oldSourceQty,
      new_quantity: newSourceQty,
      notes: notes || `Transferred ${quantity} ${itemType?.unit || 'units'} to ${toProject.name}`,
    });

    // Add to Destination Project
    const [destInventory] = await ProjectInventory.findOrCreate({
      where: { project_id: to_project_id, item_type_id },
      defaults: {
        project_id: to_project_id,
        item_type_id,
        quantity: 0,
        min_quantity: 0,
      },
    });

    const oldDestQty = destInventory.quantity;
    const newDestQty = oldDestQty + quantity;
    await destInventory.update({ quantity: newDestQty });

    await StockMovement.create({
      project_id: to_project_id,
      item_type_id,
      user_id: user_id || null,
      type: 'TRANSFER',
      quantity,
      previous_quantity: oldDestQty,
      new_quantity: newDestQty,
      notes: notes || `Received ${quantity} ${itemType?.unit || 'units'} from ${fromProject.name}`,
    });

    return {
      source: await ProjectInventory.findByPk(sourceInventory.id, {
        include: [{ model: ItemType, as: 'item_type' }],
      }),
      destination: await ProjectInventory.findByPk(destInventory.id, {
        include: [{ model: ItemType, as: 'item_type' }],
      }),
    };
  }

  /**
   * Fetches Stock Movements / Ledger logs
   */
  public static async getStockMovements(filters?: {
    project_id?: number;
    item_type_id?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters?.project_id) where.project_id = filters.project_id;
    if (filters?.item_type_id) where.item_type_id = filters.item_type_id;

    return await StockMovement.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'code'] },
        { model: ItemType, as: 'item_type', attributes: ['id', 'name', 'code', 'unit'] },
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: filters?.limit || 50,
    });
  }

  /**
   * Generates Executive Dashboard Analytics
   */
  public static async getDashboardStats() {
    const totalProjects = await Project.count();
    const totalItemTypes = await ItemType.count();

    const allInventory = await ProjectInventory.findAll({
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'code'] },
        { model: ItemType, as: 'item_type', attributes: ['id', 'name', 'code', 'unit'] },
      ],
    });

    const totalStockUnits = allInventory.reduce((sum, item) => sum + item.quantity, 0);
    const outOfStockCount = allInventory.filter((item) => item.quantity === 0).length;
    const lowStockItems = allInventory.filter(
      (item) => item.quantity > 0 && item.quantity <= (item.min_quantity || 10)
    );

    const recentMovements = await this.getStockMovements({ limit: 10 });

    // Project breakdown
    const projects = await Project.findAll();
    const projectBreakdown = projects.map((p) => {
      const projItems = allInventory.filter((i) => i.project_id === p.id);
      const totalUnits = projItems.reduce((sum, i) => sum + i.quantity, 0);
      const outCount = projItems.filter((i) => i.quantity === 0).length;
      const lowCount = projItems.filter(
        (i) => i.quantity > 0 && i.quantity <= (i.min_quantity || 10)
      ).length;

      return {
        id: p.id,
        name: p.name,
        code: p.code,
        itemCount: projItems.length,
        totalUnits,
        outCount,
        lowCount,
      };
    });

    return {
      totalProjects,
      totalItemTypes,
      totalStockUnits,
      outOfStockCount,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      projectBreakdown,
      recentMovements,
    };
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

            await StockMovement.create({
              project_id: sampleProj.id,
              item_type_id: item.id,
              type: 'IN',
              quantity: qty,
              previous_quantity: 0,
              new_quantity: qty,
              notes: 'Initial seed stock allocation',
            });
          }
        }
        console.log(`Initial stock quantities seeded for Project: ${sampleProj.name}`);
      }
    } catch (error) {
      console.error('Error seeding inventory stock:', error);
    }
  }
}
