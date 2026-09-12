import { Op } from 'sequelize';
import {
  PurchaseRequisition,
  PurchaseRequisitionItem,
  Project,
  ItemType,
  User,
  ProjectInventory,
} from '../models';
import { POService } from './po.service';

export class PRService {
  public static async getAll(filters?: {
    project_id?: number;
    status?: string;
    priority?: string;
    search?: string;
  }) {
    const where: any = {};
    if (filters?.project_id) where.project_id = filters.project_id;
    if (filters?.status && filters.status !== 'ALL') where.status = filters.status;
    if (filters?.priority && filters.priority !== 'ALL') where.priority = filters.priority;

    if (filters?.search) {
      const q = `%${filters.search.trim()}%`;
      where[Op.or] = [
        { pr_number: { [Op.iLike]: q } },
        { notes: { [Op.iLike]: q } },
      ];
    }

    const prList = await PurchaseRequisition.findAll({
      where,
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'requested_by_user', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'created_by_user', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'reviewed_by_user', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'approved_by_user', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'rejected_by_user', attributes: ['id', 'username', 'email'] },
        {
          model: PurchaseRequisitionItem,
          as: 'items',
          include: [{ model: ItemType, as: 'item_type' }],
        },
      ],
      order: [['id', 'DESC']],
    });

    return prList;
  }

  public static async getById(id: number) {
    const pr = await PurchaseRequisition.findByPk(id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'requested_by_user', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'created_by_user', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'reviewed_by_user', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'approved_by_user', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'rejected_by_user', attributes: ['id', 'username', 'email'] },
        {
          model: PurchaseRequisitionItem,
          as: 'items',
          include: [{ model: ItemType, as: 'item_type' }],
        },
      ],
    });

    if (!pr) throw new Error('Purchase Requisition not found');

    // Attach real-time Central Warehouse & Project Stock details to items for inventory review
    const formattedItems = await Promise.all(
      (pr.items || []).map(async (item) => {
        let centralStock = 0;
        const centralInv = await ProjectInventory.findOne({
          where: { project_id: null, item_type_id: item.item_type_id },
        });
        if (centralInv) {
          centralStock = centralInv.quantity;
        }

        let projectStock = 0;
        if (pr.project_id) {
          const projInv = await ProjectInventory.findOne({
            where: { project_id: pr.project_id, item_type_id: item.item_type_id },
          });
          if (projInv) projectStock = projInv.quantity;
        }

        return {
          ...item.toJSON(),
          central_stock: centralStock,
          project_stock: projectStock,
        };
      })
    );

    const prObj = pr.toJSON();
    prObj.items = formattedItems as any;
    return prObj;
  }

  public static async create(
    data: {
      pr_number?: string;
      project_id?: number;
      priority?: string;
      required_date?: string;
      notes?: string;
      items: Array<{
        item_type_id: number;
        cat_no?: string;
        make?: string;
        hsn_code?: string;
        requested_qty: number;
        estimated_unit_price?: number;
        notes?: string;
      }>;
    },
    requestedById?: number
  ) {
    if (data.pr_number && data.pr_number.trim()) {
      const existing = await PurchaseRequisition.findOne({
        where: { pr_number: data.pr_number.trim() },
      });
      if (existing) {
        throw new Error(`PR Number '${data.pr_number.trim()}' already exists! Please enter a unique PR number.`);
      }
    }

    const count = await PurchaseRequisition.count();
    const prNumber = data.pr_number?.trim() || `PR/26-27/${String(count + 1).padStart(3, '0')}`;

    const pr = await PurchaseRequisition.create({
      pr_number: prNumber,
      project_id: data.project_id || null,
      requested_by_id: requestedById || null,
      created_by_id: requestedById || null,
      status: 'PENDING_APPROVAL',
      priority: (data.priority as any) || 'MEDIUM',
      required_date: data.required_date ? new Date(data.required_date) : null,
      notes: data.notes || null,
    });

    for (const i of data.items) {
      await PurchaseRequisitionItem.create({
        pr_id: pr.id,
        item_type_id: i.item_type_id,
        cat_no: i.cat_no || null,
        make: i.make || null,
        hsn_code: i.hsn_code || null,
        requested_qty: Number(i.requested_qty || 0),
        allowed_po_qty: Number(i.requested_qty || 0), // Default allowed Qty equal to requested Qty until reviewed
        converted_po_qty: 0,
        estimated_unit_price: Number(i.estimated_unit_price || 0),
        notes: i.notes || null,
      });
    }

    return await this.getById(pr.id);
  }

  public static async reviewAndApprove(
    id: number,
    data: {
      status: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED';
      items?: Array<{
        id: number;
        allowed_po_qty: number;
        notes?: string;
      }>;
      notes?: string;
    },
    reviewerId?: number
  ) {
    const pr = await PurchaseRequisition.findByPk(id);
    if (!pr) throw new Error('Purchase Requisition not found');

    if (data.items && Array.isArray(data.items)) {
      for (const itemData of data.items) {
        const prItem = await PurchaseRequisitionItem.findByPk(itemData.id);
        if (prItem) {
          await prItem.update({
            allowed_po_qty: Number(itemData.allowed_po_qty || 0),
            notes: itemData.notes !== undefined ? itemData.notes : prItem.notes,
          });
        }
      }
    }

    const isRejected = data.status === 'REJECTED';

    await pr.update({
      status: data.status,
      reviewed_by_id: reviewerId || null,
      approved_by_id: !isRejected ? (reviewerId || null) : pr.approved_by_id,
      approved_at: !isRejected ? new Date() : pr.approved_at,
      rejected_by_id: isRejected ? (reviewerId || null) : pr.rejected_by_id,
      rejected_at: isRejected ? new Date() : pr.rejected_at,
      rejection_reason: isRejected ? (data.notes || 'Purchase Requisition Rejected') : pr.rejection_reason,
      notes: data.notes !== undefined ? data.notes : pr.notes,
    });

    return await this.getById(id);
  }

  public static async convertToPO(
    id: number,
    poData: {
      vendor_id: number;
      terms_and_conditions_id?: number;
      order_date?: string;
      expected_date?: string;
      notes?: string;
      items: Array<{
        pr_item_id: number;
        item_type_id: number;
        ordered_qty: number;
        unit_price: number;
        discount_percent?: number;
        gst_percent?: number;
        cat_no?: string;
        make?: string;
        hsn_code?: string;
      }>;
    },
    userId?: number
  ) {
    const pr = await PurchaseRequisition.findByPk(id, {
      include: [{ model: PurchaseRequisitionItem, as: 'items' }],
    });

    if (!pr) throw new Error('Purchase Requisition not found');
    if (pr.status === 'REJECTED' || pr.status === 'CLOSED') {
      throw new Error(`Cannot convert PR with status ${pr.status} to Purchase Order`);
    }

    // Build PO creation payload using PR project reference and approved item details
    const poItemsPayload = poData.items.map((i) => ({
      item_type_id: i.item_type_id,
      cat_no: i.cat_no || undefined,
      make: i.make || undefined,
      hsn_code: i.hsn_code || undefined,
      ordered_qty: Number(i.ordered_qty),
      unit_price: Number(i.unit_price),
      discount_percent: Number(i.discount_percent || 0),
      gst_percent: Number(i.gst_percent !== undefined ? i.gst_percent : 18),
    }));

    const po = await POService.create(
      {
        vendor_id: poData.vendor_id,
        project_id: pr.project_id || undefined,
        terms_and_conditions_id: poData.terms_and_conditions_id,
        order_date: poData.order_date,
        expected_date: poData.expected_date,
        notes: poData.notes || `Generated from Purchase Requisition ${pr.pr_number}`,
        items: poItemsPayload,
      },
      userId
    );

    // Update converted_po_qty on PR line items
    for (const i of poData.items) {
      if (i.pr_item_id) {
        const prItem = await PurchaseRequisitionItem.findByPk(i.pr_item_id);
        if (prItem) {
          const newConverted = (prItem.converted_po_qty || 0) + Number(i.ordered_qty);
          await prItem.update({ converted_po_qty: newConverted });
        }
      }
    }

    // Update PR status to PO_CREATED
    await pr.update({ status: 'PO_CREATED' });

    return {
      success: true,
      message: `Successfully generated PO ${po.po_number} from PR ${pr.pr_number}`,
      purchaseOrder: po,
    };
  }

  public static async delete(id: number) {
    const pr = await PurchaseRequisition.findByPk(id);
    if (!pr) throw new Error('Purchase Requisition not found');

    if (pr.status === 'PO_CREATED') {
      throw new Error('Cannot delete Purchase Requisition that has already been converted to a Purchase Order');
    }

    await PurchaseRequisitionItem.destroy({ where: { pr_id: id } });
    await pr.destroy();
    return { success: true, message: 'Purchase Requisition deleted successfully' };
  }

  public static async seedDefaultPR() {
    const count = await PurchaseRequisition.count();
    if (count === 0) {
      const items = await ItemType.findAll({ limit: 4 });
      if (items.length > 0) {
        const prItems = items.map((item, idx) => ({
          item_type_id: item.id,
          cat_no: item.cat_no || undefined,
          make: item.make || undefined,
          hsn_code: item.hsn_code || undefined,
          requested_qty: (idx + 1) * 25,
          estimated_unit_price: item.unit_rate || 1500,
          notes: 'Required for Phase 1 Project Assembly & Commissioning',
        }));

        const pr = await this.create({
          pr_number: 'PR/26-27/001',
          priority: 'HIGH',
          required_date: '2026-09-30',
          notes: 'Urgent site procurement requisition for upcoming substation installation project',
          items: prItems,
        });

        console.log(`Sample Purchase Requisition ${pr.pr_number} seeded into database.`);
      }
    }
  }
}
