import { Op } from 'sequelize';
import { ProjectInventory, Project, ItemType, StockMovement, User, StorageShelf, StorageRack, InventoryLot } from '../models';

export class InventoryService {
  /**
   * Fetches all inventory records across all projects and general store warehouse
   */
  public static async getAllInventory(plant_id?: number) {
    const where: any = {};
    if (plant_id) where.plant_id = plant_id;

    return await ProjectInventory.findAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          include: [{ model: Project, as: 'parent', attributes: ['id', 'name', 'code'] }],
        },
        {
          model: ItemType,
          as: 'item_type',
        },
        { model: StorageShelf, as: 'shelf' },
        { model: StorageRack, as: 'rack' },
      ],
      order: [['id', 'ASC']],
    });
  }

  /**
   * Fetches current stock inventory for a given Project ID (or aggregated total for -1).
   * Returns ALL catalog items from ItemType master, displaying 0 quantity for un-stocked items.
  /**
   * Fetches current stock inventory for a given Project ID (or aggregated total for -1).
   * Supports backend search, filtering (LOW_STOCK), date range, and pagination.
   */
  public static async getByProjectId(params: {
    projectId: number;
    search?: string;
    filterMode?: 'ALL' | 'LOW_STOCK';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    plant_id?: number;
  }) {
    const { projectId, search, filterMode, startDate, endDate, page, limit, plant_id } = params;

    // 1. Fetch all master catalog items
    const allItemTypes = await ItemType.findAll({
      order: [['code', 'ASC'], ['name', 'ASC']],
    });

    // 2. Determine target project IDs (including child sub-projects if parent selected)
    let targetProjectIds: Array<number | null> = [];
    if (projectId === undefined || projectId === null || isNaN(projectId) || projectId === 0) {
      targetProjectIds = [null, 0];
    } else if (projectId === -1) {
      targetProjectIds = []; // All locations
    } else {
      targetProjectIds = [projectId];
      const childProjects = await Project.findAll({
        where: { parent_id: projectId },
        attributes: ['id'],
      });
      childProjects.forEach((cp) => targetProjectIds.push(cp.id));
    }

    // 3. Build query for existing inventory
    const whereClause: any = {};
    if (projectId !== -1) {
      if (targetProjectIds.includes(null)) {
        whereClause[Op.or] = [{ project_id: null }, { project_id: 0 }];
      } else {
        whereClause.project_id = { [Op.in]: targetProjectIds.filter((id) => id !== null) };
      }
    }
    
    if (plant_id) {
      whereClause.plant_id = plant_id;
    }

    const existingInventories = await ProjectInventory.findAll({
      where: whereClause,
      include: [
        { model: ItemType, as: 'item_type' },
        { model: StorageShelf, as: 'shelf' },
        { model: StorageRack, as: 'rack' },
      ],
    });

    // Map existing inventory by item_type_id
    const invMap = new Map<number, { quantity: number; record: any }>();
    for (const inv of existingInventories) {
      const invObj = inv.toJSON();
      const existing = invMap.get(invObj.item_type_id);
      if (existing) {
        existing.quantity += Number(invObj.quantity || 0);
      } else {
        invMap.set(invObj.item_type_id, {
          quantity: Number(invObj.quantity || 0),
          record: invObj,
        });
      }
    }

    // Combine with all master catalog items
    let resultList = allItemTypes.map((itemType) => {
      const itemTypeObj = itemType.toJSON();
      const invData = invMap.get(itemTypeObj.id);

      if (invData) {
        return {
          ...invData.record,
          item_type_id: itemTypeObj.id,
          item_type: itemTypeObj,
          quantity: invData.quantity,
        };
      }

      return {
        id: `virtual-${itemTypeObj.id}`,
        project_id: projectId === -1 ? null : (projectId || null),
        item_type_id: itemTypeObj.id,
        item_type: itemTypeObj,
        quantity: 0,
        min_quantity: 10,
        shelf: null,
        rack: null,
      };
    });

    // Server-Side Search Filtering
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      resultList = resultList.filter((inv) => {
        const item = inv.item_type;
        if (!item) return false;
        const shelfName = (inv.shelf?.name || '').toLowerCase();
        const shelfCode = (inv.shelf?.code || '').toLowerCase();
        const rackName = (inv.rack?.name || '').toLowerCase();
        const rackCode = (inv.rack?.rack_code || '').toLowerCase();
        const locationText = `${shelfName} ${shelfCode} ${rackName} ${rackCode}`;

        return (
          (item.name || '').toLowerCase().includes(q) ||
          (item.code || '').toLowerCase().includes(q) ||
          (item.cat_no || '').toLowerCase().includes(q) ||
          (item.make || '').toLowerCase().includes(q) ||
          (item.rating || '').toLowerCase().includes(q) ||
          (item.full_description || '').toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q) ||
          (item.unit || '').toLowerCase().includes(q) ||
          locationText.includes(q) ||
          inv.quantity.toString().includes(q)
        );
      });
    }

    // Server-Side Low Stock Filtering
    if (filterMode === 'LOW_STOCK') {
      resultList = resultList.filter((inv) => inv.quantity <= (inv.min_quantity || 10));
    }

    // Server-Side Date Range Filtering
    if (startDate && endDate) {
      resultList = resultList.filter((inv: any) => {
        if (!inv.updatedAt) return true;
        const itemDate = new Date(inv.updatedAt).toISOString().slice(0, 10);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // Calculate aggregated statistics from whole dataset before pagination
    const totalStockUnits = resultList.reduce((sum, item) => sum + item.quantity, 0);
    const outOfStockCount = resultList.filter((item) => item.quantity === 0).length;
    const lowStockCount = resultList.filter(
      (item) => item.quantity > 0 && item.quantity <= (item.min_quantity || 10)
    ).length;

    const totalRecords = resultList.length;

    // Server-Side Pagination
    let pageItems = resultList;
    if (page && limit) {
      const start = (page - 1) * limit;
      pageItems = resultList.slice(start, start + limit);
    }

    return {
      inventory: pageItems,
      total: totalRecords,
      totalStockUnits,
      outOfStockCount,
      lowStockCount,
    };
  }

  /**
   * Adjusts / allocates stock quantity from Central Warehouse to Project Site
   * - Deducts allocated quantity from Central Warehouse (item_types.total_quantity)
   * - Increases Project Inventory quantity (project_inventory.quantity)
   * - Creates / Updates InventoryLot with batch & purchase rate info
   */
  public static async adjustQuantity(data: {
    project_id: number;
    item_type_id: number;
    amount: number; // Target quantity for project
    min_quantity?: number;
    unit_price?: number;
    lot_number?: string;
    shelf_id?: number;
    rack_id?: number;
    adjustment_type?: 'ADD' | 'REMOVE' | 'SET';
    user_id?: number;
    notes?: string;
    plant_id: number;
  }) {
    const {
      project_id,
      item_type_id,
      amount,
      min_quantity,
      unit_price,
      lot_number,
      shelf_id,
      rack_id,
      adjustment_type,
      user_id,
      notes,
      plant_id,
    } = data;

    if (!plant_id) throw new Error('Plant selection is required');

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
      where: { project_id: targetProjectId, item_type_id, plant_id },
      defaults: {
        project_id: targetProjectId,
        item_type_id,
        plant_id,
        quantity: 0,
        min_quantity: min_quantity !== undefined ? min_quantity : 0,
        shelf_id: shelf_id || null,
        rack_id: rack_id || null,
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
    if (shelf_id) updateFields.shelf_id = shelf_id;
    if (rack_id) updateFields.rack_id = rack_id;

    await record.update(updateFields);

    // Sync ItemType total_quantity across all ProjectInventory locations
    const totalStock = await ProjectInventory.sum('quantity', {
      where: { item_type_id },
    });
    await itemType.update({ total_quantity: totalStock || 0 });

    // Create InventoryLot entry for positive stock additions / setting opening balance
    const lotQty = diff > 0 ? diff : (adjustment_type === 'SET' && targetProjectQty > 0 ? targetProjectQty : 0);
    if (lotQty > 0) {
      const unitRateVal = unit_price !== undefined ? unit_price : Number(itemType.unit_rate || 0);
      const generatedLotNo = lot_number || `LOT-OPENING-${Date.now().toString().slice(-6)}`;

      await InventoryLot.create({
        item_type_id,
        project_id: targetProjectId,
        unit_price: unitRateVal,
        received_qty: lotQty,
        available_qty: lotQty,
        assigned_qty: 0,
        shelf_id: shelf_id || null,
        rack_id: rack_id || null,
        lot_number: generatedLotNo,
      });
    }

    // Record Audit Movement Log
    if (diff !== 0 || adjustment_type) {
      const movementType: 'IN' | 'OUT' | 'SET' =
        diff > 0 ? 'IN' : diff < 0 ? 'OUT' : 'SET';

      await StockMovement.create({
        project_id: targetProjectId,
        item_type_id,
        plant_id,
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
   * Batch adjusts/creates stock quantities for multiple items in a project with rate & batch support
   */
  public static async batchAdjustQuantity(data: {
    project_id: number;
    items: Array<{
      item_type_id: number;
      quantity?: number;
      initial_quantity?: number;
      min_quantity?: number;
      unit_price?: number;
      lot_number?: string;
      shelf_id?: number;
      rack_id?: number;
    }>;
    user_id?: number;
    notes?: string;
    plant_id: number;
  }) {
    const { project_id, items, user_id, notes, plant_id } = data;

    if (!plant_id) throw new Error('Plant selection is required');

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
        unit_price: item.unit_price,
        lot_number: item.lot_number,
        shelf_id: item.shelf_id,
        rack_id: item.rack_id,
        adjustment_type: 'SET',
        user_id,
        notes: notes || 'Batch item opening stock entry',
        plant_id,
      });
      if (updated) results.push(updated);
    }

    return results;
  }

  /**
   * Transfer stock between two projects / PO lots with complete audit trail
   */
  public static async transferStock(data: {
    from_project_id: number;
    to_project_id: number;
    item_type_id: number;
    quantity: number;
    lot_id?: number;
    user_id?: number;
    notes?: string;
    plant_id: number;
  }) {
    const { from_project_id, to_project_id, item_type_id, quantity, lot_id, user_id, notes, plant_id } = data;

    if (!plant_id) throw new Error('Plant selection is required');

    const fromTargetId = (from_project_id && from_project_id !== 0) ? from_project_id : null;
    const toTargetId = (to_project_id && to_project_id !== 0) ? to_project_id : null;

    if (fromTargetId === toTargetId) {
      throw new Error('Source and destination locations must be different');
    }

    if (quantity <= 0) {
      throw new Error('Transfer quantity must be greater than 0');
    }

    const sourceInventory = await ProjectInventory.findOne({
      where: { project_id: fromTargetId, item_type_id, plant_id },
      include: [{ model: ItemType, as: 'item_type' }],
    });

    if (!sourceInventory || sourceInventory.quantity < quantity) {
      throw new Error(
        `Insufficient stock in source location. Available: ${sourceInventory?.quantity || 0}`
      );
    }

    const fromProject = fromTargetId ? await Project.findByPk(fromTargetId) : null;
    const toProject = toTargetId ? await Project.findByPk(toTargetId) : null;

    const fromName = fromProject ? `${fromProject.name} (${fromProject.code})` : 'General Stock / Main Store';
    const toName = toProject ? `${toProject.name} (${toProject.code})` : 'General Stock / Main Store';

    const itemType = sourceInventory.item_type || (await ItemType.findByPk(item_type_id));
    if (!itemType) throw new Error('Item type not found');

    // Generate unique Transfer Reference ID
    const count = await StockMovement.count({ where: { type: 'TRANSFER' } });
    const year = new Date().getFullYear();
    const transfer_ref = `TRF-${year}-${String(Math.floor(count / 2) + 1).padStart(4, '0')}`;

    // Deduct from / Add to specific InventoryLot if lot_id specified or auto-picked
    let sourceLot: InventoryLot | null = null;
    if (lot_id) {
      sourceLot = await InventoryLot.findByPk(lot_id);
      if (!sourceLot || sourceLot.available_qty < quantity) {
        throw new Error(
          `Selected PO Lot #${sourceLot?.lot_number || lot_id} has insufficient stock. Requested: ${quantity}, Available: ${sourceLot?.available_qty || 0}`
        );
      }
    } else {
      sourceLot = await InventoryLot.findOne({
        where: {
          project_id: fromTargetId,
          item_type_id,
          available_qty: { [Op.gte]: quantity },
        },
        order: [['id', 'ASC']],
      });
    }

    let lotNote = '';
    if (sourceLot) {
      lotNote = ` | Lot #${sourceLot.lot_number || sourceLot.id} @ ₹${sourceLot.unit_price}/unit`;
      await sourceLot.update({
        available_qty: sourceLot.available_qty - quantity,
      });

      // Replicate/Create InventoryLot in Destination Project
      await InventoryLot.create({
        item_type_id,
        project_id: toTargetId,
        po_id: sourceLot.po_id,
        po_item_id: sourceLot.po_item_id,
        grn_id: sourceLot.grn_id,
        unit_price: sourceLot.unit_price,
        received_qty: quantity,
        available_qty: quantity,
        assigned_qty: 0,
        lot_number: sourceLot.lot_number ? `${sourceLot.lot_number}-TRF` : `${transfer_ref}-LOT`,
        shelf_id: sourceLot.shelf_id,
        rack_id: sourceLot.rack_id,
      });
    }

    // Deduct from Source Location Inventory
    const oldSourceQty = sourceInventory.quantity;
    const newSourceQty = oldSourceQty - quantity;
    await sourceInventory.update({ quantity: newSourceQty });

    await StockMovement.create({
      project_id: fromTargetId,
      item_type_id,
      plant_id,
      user_id: user_id || null,
      type: 'TRANSFER',
      quantity,
      previous_quantity: oldSourceQty,
      new_quantity: newSourceQty,
      notes: `[Ref: ${transfer_ref}] Transferred ${quantity} ${itemType?.unit || 'units'} to "${toName}"${lotNote}${notes ? ` | ${notes}` : ''}`,
    });

    // Add to Destination Location Inventory
    const [destInventory] = await ProjectInventory.findOrCreate({
      where: { project_id: toTargetId, item_type_id, plant_id },
      defaults: {
        project_id: toTargetId,
        item_type_id,
        plant_id,
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
      plant_id,
      user_id: user_id || null,
      type: 'TRANSFER',
      quantity,
      previous_quantity: oldDestQty,
      new_quantity: newDestQty,
      notes: `[Ref: ${transfer_ref}] Received ${quantity} ${itemType?.unit || 'units'} from "${fromName}"${lotNote}${notes ? ` | ${notes}` : ''}`,
    });

    return {
      transfer_ref,
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
    plant_id?: number;
  }) {
    const where: any = {};
    if (filters?.project_id !== undefined && filters?.project_id !== null) {
      where.project_id = (filters.project_id === 0 ? null : filters.project_id);
    }
    if (filters?.item_type_id) where.item_type_id = filters.item_type_id;
    if (filters?.plant_id) where.plant_id = filters.plant_id;

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
  public static async getDashboardStats(plant_id?: number) {
    const totalProjects = await Project.count();
    const totalItemTypes = await ItemType.count();
    
    const inventoryWhere: any = {};
    if (plant_id) inventoryWhere.plant_id = plant_id;

    const allInventory = await ProjectInventory.findAll({
      where: inventoryWhere,
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

    const recentMovements = await this.getStockMovements({ limit: 10, plant_id });

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
   * Auto-syncs stock from received GRNs and Purchase Orders to ensure ProjectInventory and ItemType total_quantity are 100% accurate
   */
  public static async syncAllStockFromReceived() {
    const { InventoryLot, ProjectInventory, ItemType } = require('../models');

    // 1. Reset all ProjectInventory quantities to 0
    await ProjectInventory.update({ quantity: 0 }, { where: {} });

    // 2. Aggregate available_qty from active InventoryLot records
    const activeLots = await InventoryLot.findAll();
    const lotMap = new Map<string, number>();

    for (const lot of activeLots) {
      const pId = lot.project_id ? Number(lot.project_id) : 0;
      const itemTypeId = Number(lot.item_type_id);
      const key = `${pId}_${itemTypeId}`;
      const current = lotMap.get(key) || 0;
      lotMap.set(key, current + Number(lot.available_qty || 0));
    }

    for (const [key, availQty] of lotMap.entries()) {
      const [pIdStr, itemTypeIdStr] = key.split('_');
      const pId = Number(pIdStr) === 0 ? null : Number(pIdStr);
      const itemTypeId = Number(itemTypeIdStr);

      const [projInv] = await ProjectInventory.findOrCreate({
        where: { project_id: pId, item_type_id: itemTypeId },
        defaults: {
          project_id: pId,
          item_type_id: itemTypeId,
          quantity: availQty,
          min_quantity: 10,
        },
      });

      await projInv.update({ quantity: availQty });
    }

    // 3. Recalculate ItemType total_quantity across all ProjectInventory records
    const allItems = await ItemType.findAll();
    for (const itemType of allItems) {
      const totalQty = await ProjectInventory.sum('quantity', {
        where: { item_type_id: itemType.id },
      });
      await itemType.update({ total_quantity: totalQty || 0 });
    }
  }

  /**
   * Resets and clears all transactional stock, assignments, GRNs, movements, and project inventories
   * so the user can test the workflow step-by-step from scratch (GRN -> Stock -> Assignment -> Tracker).
   */
  public static async clearTransactionalData() {
    const {
      ProjectAssignmentItem,
      ProjectAssignment,
      GoodsReceiptNoteItem,
      GoodsReceiptNote,
      StockMovement,
      ProjectInventory,
      ItemType,
      PurchaseOrderItem,
      PurchaseOrder,
      MaterialIssueItem,
      MaterialIssue,
      PurchaseRequisitionItem,
      PurchaseRequisition,
      InventoryLot,
    } = require('../models');

    // 0. Delete Purchase Requisition Items & Requisitions
    if (PurchaseRequisitionItem) await PurchaseRequisitionItem.destroy({ where: {}, force: true });
    if (PurchaseRequisition) await PurchaseRequisition.destroy({ where: {}, force: true });

    // 1. Delete Project Assignment Items & Project Assignments
    await ProjectAssignmentItem.destroy({ where: {}, force: true });
    await ProjectAssignment.destroy({ where: {}, force: true });

    // 2. Delete Goods Receipt Note Items & Goods Receipt Notes
    await GoodsReceiptNoteItem.destroy({ where: {}, force: true });
    await GoodsReceiptNote.destroy({ where: {}, force: true });

    // 3. Delete Material Issue Items & Material Issues
    if (MaterialIssueItem) await MaterialIssueItem.destroy({ where: {}, force: true });
    if (MaterialIssue) await MaterialIssue.destroy({ where: {}, force: true });

    // 4. Delete Purchase Order Items & Purchase Orders
    await PurchaseOrderItem.destroy({ where: {}, force: true });
    await PurchaseOrder.destroy({ where: {}, force: true });

    // 5. Delete Inventory Lots & Stock Movements
    if (InventoryLot) await InventoryLot.destroy({ where: {}, force: true });
    await StockMovement.destroy({ where: {}, force: true });

    // 6. Delete Project Inventories
    await ProjectInventory.destroy({ where: {}, force: true });

    // 7. Reset ItemType total_quantity to 0
    await ItemType.update({ total_quantity: 0 }, { where: {} });

    return { success: true, message: 'All transactional inventory, PO, GRN, assignment, and report data reset to scratch successfully.' };
  }
}

