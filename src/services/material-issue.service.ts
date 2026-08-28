import {
  MaterialIssue,
  MaterialIssueItem,
  Project,
  ItemType,
  ProjectInventory,
  StockMovement,
  User,
} from '../models';

export class MaterialIssueService {
  public static async getAll(filters?: { project_id?: number }) {
    const where: any = {};
    if (filters?.project_id) where.project_id = filters.project_id;

    return await MaterialIssue.findAll({
      where,
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        {
          model: MaterialIssueItem,
          as: 'items',
          include: [{ model: ItemType, as: 'item_type' }],
        },
      ],
      order: [['id', 'DESC']],
    });
  }

  public static async getById(id: number) {
    const issue = await MaterialIssue.findByPk(id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        {
          model: MaterialIssueItem,
          as: 'items',
          include: [{ model: ItemType, as: 'item_type' }],
        },
      ],
    });
    if (!issue) throw new Error('Material issue voucher not found');
    return issue;
  }

  public static async create(data: {
    project_id: number;
    issued_to: string;
    issued_by_user_id?: number;
    notes?: string;
    items: Array<{
      item_type_id: number;
      quantity: number;
    }>;
  }) {
    const count = await MaterialIssue.count();
    const issueNumber = `MR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const project = await Project.findByPk(data.project_id);
    if (!project) throw new Error('Project not found');

    // Verify stock availability for all items before processing
    for (const item of data.items) {
      const inv = await ProjectInventory.findOne({
        where: { project_id: data.project_id, item_type_id: item.item_type_id },
        include: [{ model: ItemType, as: 'item_type' }],
      });

      if (!inv || inv.quantity < item.quantity) {
        const itemTypeName = inv?.item_type?.name || `Item #${item.item_type_id}`;
        throw new Error(
          `Insufficient stock for "${itemTypeName}". Available: ${inv?.quantity || 0}, Requested: ${item.quantity}`
        );
      }
    }

    // Create Material Issue Voucher Header
    const issue = await MaterialIssue.create({
      issue_number: issueNumber,
      project_id: data.project_id,
      issued_to: data.issued_to,
      issued_by_user_id: data.issued_by_user_id || null,
      issue_date: new Date(),
      notes: data.notes || null,
    });

    // Deduct Stock and Create Items + Audit Logs
    for (const item of data.items) {
      await MaterialIssueItem.create({
        material_issue_id: issue.id,
        item_type_id: item.item_type_id,
        quantity: item.quantity,
      });

      const inv = await ProjectInventory.findOne({
        where: { project_id: data.project_id, item_type_id: item.item_type_id },
      });

      if (inv) {
        const oldQty = inv.quantity;
        const newQty = Math.max(0, oldQty - item.quantity);
        await inv.update({ quantity: newQty });

        // Record Document-linked Audit Log
        await StockMovement.create({
          project_id: data.project_id,
          item_type_id: item.item_type_id,
          user_id: data.issued_by_user_id || null,
          type: 'OUT',
          quantity: item.quantity,
          previous_quantity: oldQty,
          new_quantity: newQty,
          notes: `Material Issued via ${issueNumber} to "${data.issued_to}"`,
        });
      }
    }

    return await this.getById(issue.id);
  }
}
