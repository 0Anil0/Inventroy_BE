import { ProjectInventory, Project, ItemType, StockMovement, User, StorageShelf, StorageRack } from '../models';

export class InventoryService {
  /**
   * Fetches current stock inventory for a given Project ID
   */
  public static async getByProjectId(projectId: number) {
    const whereClause = (!projectId || projectId === 0 || isNaN(projectId)) ? { project_id: null } : { project_id: projectId };

    return await ProjectInventory.findAll({
      where: whereClause,
      include: [
        {
          model: ItemType,
          as: 'item_type',
          attributes: ['id', 'name', 'code', 'unit', 'total_quantity', 'description'],
        },
        {
          model: StorageShelf,
          as: 'shelf',
        },
        {
          model: StorageRack,
          as: 'rack',
        },
      ],
      order: [['id', 'ASC']],
    });
  }

  /**
   * Adjusts / allocates stock quantity from Central Warehouse to Project Site
   * - Deducts allocated quantity from Central Warehouse (item_types.total_quantity)
   * - Increases Project Inventory quantity (project_inventory.quantity)
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

    const targetProjectId = (project_id && project_id !== 0) ? project_id : null;
    let projectName = 'General Stock / Main Store';

    if (targetProjectId) {
      const project = await Project.findByPk(targetProjectId);
      if (!project) throw new Error('Project not found');
      projectName = project.name;
    }

    const itemType = await ItemType.findByPk(item_type_id);
    if (!itemType) throw new Error('Item type not found');

    const [record] = await ProjectInventory.findOrCreate({
      where: { project_id: targetProjectId, item_type_id },
      defaults: {
        project_id: targetProjectId,
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
        project_id: targetProjectId,
        item_type_id,
        user_id: user_id || null,
        type: movementType,
        quantity: Math.abs(diff),
        previous_quantity: oldProjectQty,
        new_quantity: targetProjectQty,
        notes: notes || `Updated ${diff > 0 ? '+' : ''}${diff} ${itemType.unit} for ${projectName}`,
      });
    }

    return await ProjectInventory.findByPk(record.id, {
      include: [
        {
          model: ItemType,
          as: 'item_type',
          attributes: ['id', 'name', 'code', 'unit', 'total_quantity', 'description'],
        },
        {
          model: StorageShelf,
          as: 'shelf',
        },
        {
          model: StorageRack,
          as: 'rack',
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

    const targetProjectId = (project_id && project_id !== 0) ? project_id : null;
    if (targetProjectId) {
      const project = await Project.findByPk(targetProjectId);
      if (!project) throw new Error('Project not found');
    }

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

    const fromTargetId = (from_project_id && from_project_id !== 0) ? from_project_id : null;
    const toTargetId = (to_project_id && to_project_id !== 0) ? to_project_id : null;

    if (fromTargetId === toTargetId) {
      throw new Error('Source and destination locations must be different');
    }

    if (quantity <= 0) {
      throw new Error('Transfer quantity must be greater than 0');
    }

    const sourceInventory = await ProjectInventory.findOne({
      where: { project_id: fromTargetId, item_type_id },
      include: [{ model: ItemType, as: 'item_type' }],
    });

    if (!sourceInventory || sourceInventory.quantity < quantity) {
      throw new Error(
        `Insufficient stock in source location. Available: ${sourceInventory?.quantity || 0}`
      );
    }

    const fromProject = fromTargetId ? await Project.findByPk(fromTargetId) : null;
    const toProject = toTargetId ? await Project.findByPk(toTargetId) : null;

    const fromName = fromProject ? fromProject.name : 'General Stock / Main Store';
    const toName = toProject ? toProject.name : 'General Stock / Main Store';

    const itemType = sourceInventory.item_type || (await ItemType.findByPk(item_type_id));

    // Deduct from Source Location
    const oldSourceQty = sourceInventory.quantity;
    const newSourceQty = oldSourceQty - quantity;
    await sourceInventory.update({ quantity: newSourceQty });

    await StockMovement.create({
      project_id: fromTargetId,
      item_type_id,
      user_id: user_id || null,
      type: 'TRANSFER',
      quantity,
      previous_quantity: oldSourceQty,
      new_quantity: newSourceQty,
      notes: notes || `Transferred ${quantity} ${itemType?.unit || 'units'} to ${toName}`,
    });

    // Add to Destination Location
    const [destInventory] = await ProjectInventory.findOrCreate({
      where: { project_id: toTargetId, item_type_id },
      defaults: {
        project_id: toTargetId,
        item_type_id,
        quantity: 0,
        min_quantity: 0,
      },
    });

    const oldDestQty = destInventory.quantity;
    const newDestQty = oldDestQty + quantity;
    await destInventory.update({ quantity: newDestQty });

    await StockMovement.create({
      project_id: toTargetId,
      item_type_id,
      user_id: user_id || null,
      type: 'TRANSFER',
      quantity,
      previous_quantity: oldDestQty,
      new_quantity: newDestQty,
      notes: notes || `Received ${quantity} ${itemType?.unit || 'units'} from ${fromName}`,
    });

    return {
      source: await ProjectInventory.findByPk(sourceInventory.id, {
        include: [
          { model: ItemType, as: 'item_type' },
          { model: StorageShelf, as: 'shelf' },
          { model: StorageRack, as: 'rack' },
        ],
      }),
      destination: await ProjectInventory.findByPk(destInventory.id, {
        include: [
          { model: ItemType, as: 'item_type' },
          { model: StorageShelf, as: 'shelf' },
          { model: StorageRack, as: 'rack' },
        ],
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
    if (filters?.project_id !== undefined && filters?.project_id !== null) {
      where.project_id = (filters.project_id === 0 ? null : filters.project_id);
    }
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
}
