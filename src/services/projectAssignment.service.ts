import {
  ProjectAssignment,
  ProjectAssignmentItem,
  Project,
  ItemType,
  ProjectInventory,
  StockMovement,
  User,
} from '../models';

export class ProjectAssignmentService {
  public static async getAll(params?: { to_project_id?: number }) {
    const where: any = {};
    if (params?.to_project_id) {
      where.to_project_id = params.to_project_id;
    }

    return await ProjectAssignment.findAll({
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
          include: [{ model: ItemType, as: 'item_type' }],
        },
      ],
      order: [['id', 'DESC']],
    });
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
          include: [{ model: ItemType, as: 'item_type' }],
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
      quantity: number;
    }>;
  }) {
    const { from_project_id, to_project_id, assigned_to_person, notes, created_by_user_id, items } = data;

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

    // Process Stock Deductions & Additions atomically
    for (const item of items) {
      const itemTypeId = Number(item.item_type_id);
      const qty = parseFloat(String(item.quantity));

      if (qty <= 0) {
        throw new Error('Assignment quantity must be greater than 0');
      }

      const itemType = await ItemType.findByPk(itemTypeId);
      if (!itemType) throw new Error(`Item type ID ${itemTypeId} not found`);

      // 1. Check & Deduct from Source Inventory (General Store or Source Site)
      const sourceInventory = await ProjectInventory.findOne({
        where: { project_id: fromTargetId, item_type_id: itemTypeId },
      });

      if (!sourceInventory || sourceInventory.quantity < qty) {
        const available = sourceInventory ? sourceInventory.quantity : 0;
        throw new Error(
          `Insufficient stock for "${itemType.name}". Available in warehouse: ${available} ${itemType.unit}`
        );
      }

      const oldSourceQty = sourceInventory.quantity;
      const newSourceQty = oldSourceQty - qty;
      await sourceInventory.update({ quantity: newSourceQty });

      // Record Audit Movement Log for Source (Deduction)
      const sourceName = fromTargetId ? 'Source Site' : 'General Store / Main Warehouse';
      await StockMovement.create({
        project_id: fromTargetId,
        item_type_id: itemTypeId,
        user_id: created_by_user_id || null,
        type: 'TRANSFER',
        quantity: qty,
        previous_quantity: oldSourceQty,
        new_quantity: newSourceQty,
        notes: `Assigned ${qty} ${itemType.unit} to project "${toProject.name}" (${assignment_no})`,
      });

      // 2. Add to Target Project Inventory
      const [targetInventory] = await ProjectInventory.findOrCreate({
        where: { project_id: toTargetId, item_type_id: itemTypeId },
        defaults: {
          project_id: toTargetId,
          item_type_id: itemTypeId,
          quantity: 0,
          min_quantity: 10,
        },
      });

      const oldTargetQty = targetInventory.quantity;
      const newTargetQty = oldTargetQty + qty;
      await targetInventory.update({ quantity: newTargetQty });

      // Record Audit Movement Log for Target (Addition)
      await StockMovement.create({
        project_id: toTargetId,
        item_type_id: itemTypeId,
        user_id: created_by_user_id || null,
        type: 'TRANSFER',
        quantity: qty,
        previous_quantity: oldTargetQty,
        new_quantity: newTargetQty,
        notes: `Received assignment of ${qty} ${itemType.unit} from ${sourceName} (${assignment_no})`,
      });
    }

    // Create Project Assignment Record
    const assignment = await ProjectAssignment.create({
      assignment_no,
      from_project_id: fromTargetId,
      to_project_id: toTargetId,
      assigned_to_person: assigned_to_person.trim(),
      created_by_user_id: created_by_user_id || null,
      notes: notes ? notes.trim() : null,
    });

    // Create Assignment Line Items
    for (const item of items) {
      await ProjectAssignmentItem.create({
        assignment_id: assignment.id,
        item_type_id: Number(item.item_type_id),
        quantity: parseFloat(String(item.quantity)),
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
        quantity: number;
      }>;
    }
  ) {
    const existing = await ProjectAssignment.findByPk(id, {
      include: [{ model: ProjectAssignmentItem, as: 'items' }],
    });
    if (!existing) throw new Error('Project assignment record not found');

    const oldFromId = existing.from_project_id;
    const oldToId = existing.to_project_id;

    // Revert stock for previous items
    for (const item of existing.items || []) {
      const itemTypeId = item.item_type_id;
      const qty = item.quantity;

      const targetInv = await ProjectInventory.findOne({
        where: { project_id: oldToId, item_type_id: itemTypeId },
      });
      if (targetInv) {
        await targetInv.update({ quantity: Math.max(0, targetInv.quantity - qty) });
      }

      const [sourceInv] = await ProjectInventory.findOrCreate({
        where: { project_id: oldFromId, item_type_id: itemTypeId },
        defaults: { project_id: oldFromId, item_type_id: itemTypeId, quantity: 0, min_quantity: 10 },
      });
      await sourceInv.update({ quantity: sourceInv.quantity + qty });
    }

    const newFromId = data.from_project_id !== undefined ? (data.from_project_id || null) : existing.from_project_id;
    const newToId = data.to_project_id !== undefined ? Number(data.to_project_id) : existing.to_project_id;
    const newRecipient = data.assigned_to_person !== undefined ? data.assigned_to_person.trim() : existing.assigned_to_person;
    const newNotes = data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : existing.notes;
    const newItems = data.items && data.items.length > 0 ? data.items : (existing.items || []);

    const toProject = await Project.findByPk(newToId);
    if (!toProject) throw new Error('Target project not found');

    // Deduct & add new items
    for (const item of newItems) {
      const itemTypeId = Number(item.item_type_id);
      const qty = parseFloat(String(item.quantity));
      if (qty <= 0) throw new Error('Assignment quantity must be greater than 0');

      const itemType = await ItemType.findByPk(itemTypeId);
      if (!itemType) throw new Error(`Item type ID ${itemTypeId} not found`);

      const sourceInv = await ProjectInventory.findOne({
        where: { project_id: newFromId, item_type_id: itemTypeId },
      });

      if (!sourceInv || sourceInv.quantity < qty) {
        const avail = sourceInv ? sourceInv.quantity : 0;
        throw new Error(`Insufficient stock for "${itemType.name}". Available: ${avail} ${itemType.unit}`);
      }

      await sourceInv.update({ quantity: sourceInv.quantity - qty });

      const [targetInv] = await ProjectInventory.findOrCreate({
        where: { project_id: newToId, item_type_id: itemTypeId },
        defaults: { project_id: newToId, item_type_id: itemTypeId, quantity: 0, min_quantity: 10 },
      });
      await targetInv.update({ quantity: targetInv.quantity + qty });
    }

    // Replace line items
    await ProjectAssignmentItem.destroy({ where: { assignment_id: existing.id } });
    for (const item of newItems) {
      await ProjectAssignmentItem.create({
        assignment_id: existing.id,
        item_type_id: Number(item.item_type_id),
        quantity: parseFloat(String(item.quantity)),
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

  public static async delete(id: number) {
    const assignment = await ProjectAssignment.findByPk(id, {
      include: [{ model: ProjectAssignmentItem, as: 'items' }],
    });
    if (!assignment) throw new Error('Project assignment record not found');

    const fromTargetId = assignment.from_project_id;
    const toTargetId = assignment.to_project_id;

    for (const item of assignment.items || []) {
      const itemTypeId = item.item_type_id;
      const qty = item.quantity;
      const itemType = await ItemType.findByPk(itemTypeId);

      const targetInv = await ProjectInventory.findOne({
        where: { project_id: toTargetId, item_type_id: itemTypeId },
      });
      if (targetInv) {
        const oldQty = targetInv.quantity;
        const newQty = Math.max(0, oldQty - qty);
        await targetInv.update({ quantity: newQty });

        await StockMovement.create({
          project_id: toTargetId,
          item_type_id: itemTypeId,
          type: 'OUT',
          quantity: qty,
          previous_quantity: oldQty,
          new_quantity: newQty,
          notes: `Reverted/Cancelled assignment ${assignment.assignment_no}`,
        });
      }

      const [sourceInv] = await ProjectInventory.findOrCreate({
        where: { project_id: fromTargetId, item_type_id: itemTypeId },
        defaults: { project_id: fromTargetId, item_type_id: itemTypeId, quantity: 0, min_quantity: 10 },
      });
      const oldSrcQty = sourceInv.quantity;
      const newSrcQty = oldSrcQty + qty;
      await sourceInv.update({ quantity: newSrcQty });

      await StockMovement.create({
        project_id: fromTargetId,
        item_type_id: itemTypeId,
        type: 'IN',
        quantity: qty,
        previous_quantity: oldSrcQty,
        new_quantity: newSrcQty,
        notes: `Returned ${qty} ${itemType?.unit || 'units'} from cancelled assignment ${assignment.assignment_no}`,
      });
    }

    await ProjectAssignmentItem.destroy({ where: { assignment_id: assignment.id } });
    await assignment.destroy();

    return { success: true, message: `Assignment ${assignment.assignment_no} cancelled & stock restored to warehouse` };
  }
}
