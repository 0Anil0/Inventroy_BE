import {
  ProjectAssignment,
  ProjectAssignmentItem,
  Project,
  ItemType,
  ProjectInventory,
  StockMovement,
  User,
  InventoryLot,
  PurchaseOrder,
} from '../models';

export class ProjectAssignmentService {
  public static async getAll(params?: {
    search?: string;
    to_project_id?: number;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
    plant_id?: number;
  }) {
    const where: any = {};
    if (params?.to_project_id) {
      where.to_project_id = params.to_project_id;
    }
    if (params?.plant_id) {
      where.plant_id = params.plant_id;
    }

    const allAssignments = await ProjectAssignment.findAll({
      where,
      include: [
        {
          model: Project,
          as: 'to_project',
          include: [{ model: Project, as: 'parent', attributes: ['id', 'name', 'code'] }],
        },
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        {
          model: ProjectAssignmentItem,
          as: 'items',
          include: [
            { model: ItemType, as: 'item_type' },
            { model: InventoryLot, as: 'lot' },
            { model: PurchaseOrder, as: 'purchase_order', attributes: ['id', 'po_number'] },
          ],
        },
      ],
      order: [['id', 'DESC']],
    });

    let filtered = allAssignments.map((a) => (a.toJSON ? a.toJSON() : a));

    // Server-side search filter
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter((a: any) => {
        const matchNo = (a.assignment_no || '').toLowerCase().includes(q);
        const matchPerson = (a.assigned_to_person || '').toLowerCase().includes(q);
        const matchNotes = (a.notes || '').toLowerCase().includes(q);
        const matchProj =
          (a.to_project?.name || '').toLowerCase().includes(q) ||
          (a.to_project?.code || '').toLowerCase().includes(q) ||
          (a.to_project?.parent?.name || '').toLowerCase().includes(q) ||
          (a.to_project?.parent?.code || '').toLowerCase().includes(q);

        const matchItems = (a.items || []).some(
          (i: any) =>
            (i.item_type?.name || '').toLowerCase().includes(q) ||
            (i.item_type?.code || '').toLowerCase().includes(q) ||
            (i.item_type?.cat_no || '').toLowerCase().includes(q) ||
            (i.item_type?.make || '').toLowerCase().includes(q) ||
            (i.purchase_order?.po_number || '').toLowerCase().includes(q)
        );

        return matchNo || matchPerson || matchNotes || matchProj || matchItems;
      });
    }

    // Server-side date range filter
    if (params?.from_date && params?.to_date) {
      const start = new Date(params.from_date).getTime();
      const end = new Date(params.to_date).getTime() + 86400000;
      filtered = filtered.filter((a: any) => {
        const d = new Date(a.assignment_date || a.createdAt).getTime();
        return d >= start && d <= end;
      });
    }

    // Aggregated stats over whole filtered dataset
    const totalAssignmentsCount = filtered.length;
    const uniqueProjectsAssigned = new Set(filtered.map((a: any) => a.to_project_id)).size;
    const totalUnitsDispatched = filtered.reduce(
      (sum: number, a: any) =>
        sum + (a.items || []).reduce((iSum: number, item: any) => iSum + Number(item.quantity || 0), 0),
      0
    );

    const total = filtered.length;

    // Server-side pagination
    let pageItems = filtered;
    if (params?.page && params?.limit) {
      const start = (params.page - 1) * params.limit;
      pageItems = filtered.slice(start, start + params.limit);
    }

    return {
      assignments: pageItems,
      total,
      totalAssignmentsCount,
      uniqueProjectsAssigned,
      totalUnitsDispatched,
    };
  }

  public static async getById(id: number) {
    return await ProjectAssignment.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'to_project',
          include: [{ model: Project, as: 'parent', attributes: ['id', 'name', 'code'] }],
        },
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        {
          model: ProjectAssignmentItem,
          as: 'items',
          include: [
            { model: ItemType, as: 'item_type' },
            { model: InventoryLot, as: 'lot' },
            { model: PurchaseOrder, as: 'purchase_order', attributes: ['id', 'po_number'] },
          ],
        },
      ],
    });
  }

  public static async create(data: {
    from_project_id?: number | null;
    to_project_id: number;
    assigned_to_person: string;
    notes?: string;
    created_by_user_id?: number;
    items: Array<{
      item_type_id: number;
      lot_id?: number | null;
      quantity: number;
    }>;
    plant_id: number;
  }) {
    const { from_project_id, to_project_id, assigned_to_person, notes, created_by_user_id, items, plant_id } = data;

    const fromTargetId = (from_project_id && from_project_id !== 0) ? Number(from_project_id) : null;
    const toTargetId = Number(to_project_id);

    if (fromTargetId === toTargetId) {
      throw new Error('Source store and destination project cannot be the same');
    }

    const toProject = await Project.findByPk(toTargetId);
    if (!toProject) throw new Error('Target project or sub-site not found');

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Please select at least one material item to assign');
    }

    // Auto-generate assignment ref number
    const count = await ProjectAssignment.count();
    const year = new Date().getFullYear();
    const assignment_no = `ASN-${year}-${String(count + 1).padStart(4, '0')}`;

    // Process Stock Lot Deductions & Additions atomically
    const processedItems: Array<{
      item_type_id: number;
      lot_id: number | null;
      po_id: number | null;
      unit_price: number;
      total_cost: number;
      quantity: number;
    }> = [];

    for (const item of items) {
      const itemTypeId = Number(item.item_type_id);
      const qty = parseFloat(String(item.quantity));

      if (qty <= 0) {
        throw new Error('Assignment quantity must be greater than 0');
      }

      const itemType = await ItemType.findByPk(itemTypeId);
      if (!itemType) throw new Error(`Item type ID ${itemTypeId} not found`);

      let selectedLot: InventoryLot | null = null;
      if (item.lot_id) {
        selectedLot = await InventoryLot.findByPk(Number(item.lot_id));
      }

      // If no lot_id passed directly, find active available lot for this item
      if (!selectedLot) {
        selectedLot = await InventoryLot.findOne({
          where: {
            item_type_id: itemTypeId,
            available_qty: { [Symbol.for('gte')]: qty },
          },
          order: [['id', 'ASC']],
        });
      }

      let unitPrice = Number(itemType.unit_rate || 0);
      let poId: number | null = null;
      let lotId: number | null = null;
      let sourceProjectId: number | null = fromTargetId;

      if (selectedLot) {
        if (selectedLot.available_qty < qty) {
          throw new Error(
            `Selected PO Lot #${selectedLot.lot_number || selectedLot.id} has insufficient stock. Requested: ${qty}, Available: ${selectedLot.available_qty}`
          );
        }

        unitPrice = Number(selectedLot.unit_price || unitPrice);
        poId = selectedLot.po_id;
        lotId = selectedLot.id;
        sourceProjectId = selectedLot.project_id ? Number(selectedLot.project_id) : null;

        // Deduct from InventoryLot
        const oldAvailable = selectedLot.available_qty;
        const newAvailable = oldAvailable - qty;
        const newAssigned = (selectedLot.assigned_qty || 0) + qty;

        await selectedLot.update({
          available_qty: newAvailable,
          assigned_qty: newAssigned,
        });
      }

      // 1. Deduct from Aggregate Source Inventory (where sourceProjectId is lot's origin project_id or fromTargetId)
      const sourceInventory = await ProjectInventory.findOne({
        where: { project_id: sourceProjectId, item_type_id: itemTypeId, plant_id },
      });

      if (sourceInventory) {
        const oldSourceQty = sourceInventory.quantity;
        const newSourceQty = Math.max(0, oldSourceQty - qty);
        await sourceInventory.update({ quantity: newSourceQty });
      }

      // Record Audit Movement Log for Source (Deduction)
      const sourceName = sourceProjectId ? 'Project Lot Store' : 'General Store / Main Warehouse';
      await StockMovement.create({
        project_id: sourceProjectId,
        item_type_id: itemTypeId,
        plant_id,
        user_id: created_by_user_id || null,
        type: 'TRANSFER',
        quantity: qty,
        previous_quantity: sourceInventory ? sourceInventory.quantity + qty : qty,
        new_quantity: sourceInventory ? sourceInventory.quantity : 0,
        notes: `Assigned ${qty} ${itemType.unit} @ ₹${unitPrice} to project "${toProject.name}" (${assignment_no})`,
      });

      // Note: Assigned material is dispatched for project execution, so it is NOT added to available warehouse stock.

      // Update ItemType total_quantity across all unassigned warehouse inventories
      const totalStock = await ProjectInventory.sum('quantity', {
        where: { item_type_id: itemTypeId },
      });
      await itemType.update({ total_quantity: totalStock || 0 });

      processedItems.push({
        item_type_id: itemTypeId,
        lot_id: lotId,
        po_id: poId,
        unit_price: unitPrice,
        total_cost: Number((qty * unitPrice).toFixed(2)),
        quantity: qty,
      });
    }

    const assignment = await ProjectAssignment.create({
      assignment_no,
      from_project_id: fromTargetId,
      to_project_id: toTargetId,
      plant_id,
      assigned_to_person: assigned_to_person.trim(),
      created_by_user_id: created_by_user_id || null,
      notes: notes ? notes.trim() : null,
    });

    // Create Assignment Line Items with exact purchase rate and cost
    for (const item of processedItems) {
      await ProjectAssignmentItem.create({
        assignment_id: assignment.id,
        item_type_id: item.item_type_id,
        lot_id: item.lot_id,
        po_id: item.po_id,
        unit_price: item.unit_price,
        total_cost: item.total_cost,
        quantity: item.quantity,
      });
    }

    return await this.getById(assignment.id);
  }

  public static async update(
    id: number,
    data: {
      from_project_id?: number | null;
      to_project_id?: number;
      assigned_to_person?: string;
      notes?: string;
      items?: Array<{
        item_type_id: number;
        lot_id?: number | null;
        quantity: number;
      }>;
      plant_id: number;
    }
  ) {
    const existing = await ProjectAssignment.findByPk(id, {
      include: [{ model: ProjectAssignmentItem, as: 'items' }],
    });
    if (!existing) throw new Error('Project assignment record not found');

    // Revert existing line items stock back to source InventoryLots & source ProjectInventory
    for (const item of existing.items || []) {
      const itemTypeId = item.item_type_id;
      const qty = item.quantity;
      let sourceProjectId: number | null = existing.from_project_id;

      if (item.lot_id) {
        const lot = await InventoryLot.findByPk(item.lot_id);
        if (lot) {
          sourceProjectId = lot.project_id ? Number(lot.project_id) : null;
          await lot.update({
            available_qty: lot.available_qty + qty,
            assigned_qty: Math.max(0, (lot.assigned_qty || 0) - qty),
          });
        }
      }

      const sourceInv = await ProjectInventory.findOne({
        where: { project_id: sourceProjectId, item_type_id: itemTypeId, plant_id: data.plant_id },
      });
      if (sourceInv) {
        await sourceInv.update({ quantity: sourceInv.quantity + qty });
      }

      const totalStock = await ProjectInventory.sum('quantity', {
        where: { item_type_id: itemTypeId },
      });
      const itemType = await ItemType.findByPk(itemTypeId);
      if (itemType) {
        await itemType.update({ total_quantity: totalStock || 0 });
      }
    }

    await ProjectAssignmentItem.destroy({ where: { assignment_id: existing.id } });

    // Re-create using updated item specs
    const newFromId = data.from_project_id !== undefined ? (data.from_project_id || null) : existing.from_project_id;
    const newToId = data.to_project_id !== undefined ? Number(data.to_project_id) : existing.to_project_id;
    const newRecipient = data.assigned_to_person !== undefined ? data.assigned_to_person.trim() : existing.assigned_to_person;
    const newNotes = data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : existing.notes;
    const newItems = data.items && data.items.length > 0 ? data.items : (existing.items || []);

    const toProject = await Project.findByPk(newToId);
    if (!toProject) throw new Error('Target project not found');

    const processedItems: Array<{
      item_type_id: number;
      lot_id: number | null;
      po_id: number | null;
      unit_price: number;
      total_cost: number;
      quantity: number;
    }> = [];

    for (const item of newItems) {
      const itemTypeId = Number(item.item_type_id);
      const qty = parseFloat(String(item.quantity));
      if (qty <= 0) throw new Error('Assignment quantity must be greater than 0');

      const itemType = await ItemType.findByPk(itemTypeId);
      if (!itemType) throw new Error(`Item type ID ${itemTypeId} not found`);

      let selectedLot: InventoryLot | null = null;
      if (item.lot_id) {
        selectedLot = await InventoryLot.findByPk(Number(item.lot_id));
      }

      let unitPrice = Number(itemType.unit_rate || 0);
      let poId: number | null = null;
      let lotId: number | null = null;
      let sourceProjectId: number | null = newFromId;

      if (selectedLot) {
        if (selectedLot.available_qty < qty) {
          throw new Error(
            `Selected PO Lot #${selectedLot.lot_number || selectedLot.id} has insufficient stock. Requested: ${qty}, Available: ${selectedLot.available_qty}`
          );
        }

        unitPrice = Number(selectedLot.unit_price || unitPrice);
        poId = selectedLot.po_id;
        lotId = selectedLot.id;
        sourceProjectId = selectedLot.project_id ? Number(selectedLot.project_id) : null;

        await selectedLot.update({
          available_qty: selectedLot.available_qty - qty,
          assigned_qty: (selectedLot.assigned_qty || 0) + qty,
        });
      }

      const sourceInv = await ProjectInventory.findOne({
        where: { project_id: sourceProjectId, item_type_id: itemTypeId, plant_id: data.plant_id },
      });
      if (sourceInv) {
        await sourceInv.update({ quantity: Math.max(0, sourceInv.quantity - qty) });
      }

      const totalStock = await ProjectInventory.sum('quantity', {
        where: { item_type_id: itemTypeId },
      });
      await itemType.update({ total_quantity: totalStock || 0 });

      processedItems.push({
        item_type_id: itemTypeId,
        lot_id: lotId,
        po_id: poId,
        unit_price: unitPrice,
        total_cost: Number((qty * unitPrice).toFixed(2)),
        quantity: qty,
      });
    }

    for (const item of processedItems) {
      await ProjectAssignmentItem.create({
        assignment_id: existing.id,
        item_type_id: item.item_type_id,
        lot_id: item.lot_id,
        po_id: item.po_id,
        unit_price: item.unit_price,
        total_cost: item.total_cost,
        quantity: item.quantity,
      });
    }

    await existing.update({
      from_project_id: newFromId,
      to_project_id: newToId,
      assigned_to_person: newRecipient,
      notes: newNotes,
    });

    return await this.getById(existing.id);
  }

  public static async delete(id: number, plant_id: number) {
    const assignment = await ProjectAssignment.findByPk(id, {
      include: [{ model: ProjectAssignmentItem, as: 'items' }],
    });
    if (!assignment) throw new Error('Project assignment record not found');

    for (const item of assignment.items || []) {
      const itemTypeId = item.item_type_id;
      const qty = item.quantity;
      const itemType = await ItemType.findByPk(itemTypeId);
      let sourceProjectId: number | null = assignment.from_project_id;

      // Restore InventoryLot stock
      if (item.lot_id) {
        const lot = await InventoryLot.findByPk(item.lot_id);
        if (lot) {
          sourceProjectId = lot.project_id ? Number(lot.project_id) : null;
          await lot.update({
            available_qty: lot.available_qty + qty,
            assigned_qty: Math.max(0, (lot.assigned_qty || 0) - qty),
          });
        }
      }

      const [sourceInv] = await ProjectInventory.findOrCreate({
        where: { project_id: sourceProjectId, item_type_id: itemTypeId, plant_id },
        defaults: { project_id: sourceProjectId, item_type_id: itemTypeId, plant_id, quantity: 0, min_quantity: 10 },
      });
      const oldSrcQty = sourceInv.quantity;
      const newSrcQty = oldSrcQty + qty;
      await sourceInv.update({ quantity: newSrcQty });

      await StockMovement.create({
        project_id: sourceProjectId,
        item_type_id: itemTypeId,
        plant_id,
        type: 'IN',
        quantity: qty,
        previous_quantity: oldSrcQty,
        new_quantity: newSrcQty,
        notes: `Returned ${qty} ${itemType?.unit || 'units'} from cancelled assignment ${assignment.assignment_no}`,
      });

      const totalStock = await ProjectInventory.sum('quantity', {
        where: { item_type_id: itemTypeId },
      });
      if (itemType) {
        await itemType.update({ total_quantity: totalStock || 0 });
      }
    }

    await ProjectAssignmentItem.destroy({ where: { assignment_id: assignment.id } });
    await assignment.destroy();

    return { success: true, message: `Assignment ${assignment.assignment_no} cancelled & stock restored to warehouse` };
  }
}

