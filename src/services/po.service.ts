import {
  PurchaseOrder,
  PurchaseOrderItem,
  Vendor,
  Project,
  ItemType,
  ProjectInventory,
  StockMovement,
} from '../models';

export class POService {
  public static async getAll(filters?: { project_id?: number; vendor_id?: number }) {
    const where: any = {};
    if (filters?.project_id) where.project_id = filters.project_id;
    if (filters?.vendor_id) where.vendor_id = filters.vendor_id;

    return await PurchaseOrder.findAll({
      where,
      include: [
        { model: Vendor, as: 'vendor' },
        { model: Project, as: 'project' },
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [{ model: ItemType, as: 'item_type' }],
        },
      ],
      order: [['id', 'DESC']],
    });
  }

  public static async getById(id: number) {
    const po = await PurchaseOrder.findByPk(id, {
      include: [
        { model: Vendor, as: 'vendor' },
        { model: Project, as: 'project' },
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [{ model: ItemType, as: 'item_type' }],
        },
      ],
    });
    if (!po) throw new Error('Purchase order not found');
    return po;
  }

  public static async create(data: {
    vendor_id: number;
    project_id?: number;
    notes?: string;
    expected_date?: string;
    items: Array<{
      item_type_id: number;
      ordered_qty: number;
      unit_price: number;
    }>;
  }) {
    const count = await PurchaseOrder.count();
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let totalAmount = 0;
    const itemsPayload = [];

    for (const i of data.items) {
      const lineTotal = i.ordered_qty * i.unit_price;
      totalAmount += lineTotal;
      itemsPayload.push({
        item_type_id: i.item_type_id,
        ordered_qty: i.ordered_qty,
        received_qty: 0,
        unit_price: i.unit_price,
        total_price: lineTotal,
      });
    }

    const po = await PurchaseOrder.create({
      po_number: poNumber,
      vendor_id: data.vendor_id,
      project_id: data.project_id || null,
      status: 'ORDERED',
      total_amount: totalAmount,
      order_date: new Date(),
      expected_date: data.expected_date ? new Date(data.expected_date) : null,
      notes: data.notes || null,
    });

    for (const itemData of itemsPayload) {
      await PurchaseOrderItem.create({
        po_id: po.id,
        ...itemData,
      });
    }

    return await this.getById(po.id);
  }

  /**
   * Receives stock against a Purchase Order:
   * - Updates PO status to RECEIVED
   * - Increases central stock in item_types table
   * - Increases project inventory stock if allocated to a project
   * - Records document-linked StockMovement audit logs
   */
  public static async receiveStock(poId: number, userId?: number) {
    const po = await this.getById(poId);
    if (!po) throw new Error('Purchase order not found');
    if (po.status === 'RECEIVED') {
      throw new Error('Purchase order has already been received');
    }

    const vendorName = po.vendor?.name || 'Vendor';

    for (const item of po.items || []) {
      const itemType = await ItemType.findByPk(item.item_type_id);
      if (!itemType) continue;

      const qtyReceived = item.ordered_qty;

      // Update received_qty in PO item line
      await item.update({ received_qty: qtyReceived });

      // Increase Central Master Stock in ItemType
      const newCentralStock = itemType.total_quantity + qtyReceived;
      await itemType.update({ total_quantity: newCentralStock });

      // If PO was allocated to a Project, increase Project Stock
      if (po.project_id) {
        const [projInv] = await ProjectInventory.findOrCreate({
          where: { project_id: po.project_id, item_type_id: item.item_type_id },
          defaults: {
            project_id: po.project_id,
            item_type_id: item.item_type_id,
            quantity: 0,
            min_quantity: 10,
          },
        });

        const oldQty = projInv.quantity;
        const newQty = oldQty + qtyReceived;
        await projInv.update({ quantity: newQty });

        // Record Document-linked Audit Log
        await StockMovement.create({
          project_id: po.project_id,
          item_type_id: item.item_type_id,
          user_id: userId || null,
          type: 'IN',
          quantity: qtyReceived,
          previous_quantity: oldQty,
          new_quantity: newQty,
          notes: `Stock Inward via ${po.po_number} (Supplier: ${vendorName})`,
        });
      } else {
        // Log movement for central warehouse stock
        await StockMovement.create({
          project_id: (po.project_id as any) || null,
          item_type_id: item.item_type_id,
          user_id: userId || null,
          type: 'IN',
          quantity: qtyReceived,
          previous_quantity: itemType.total_quantity - qtyReceived,
          new_quantity: newCentralStock,
          notes: `Central Catalog Stock Received via ${po.po_number} (Supplier: ${vendorName})`,
        });
      }
    }

    await po.update({ status: 'RECEIVED' });
    return await this.getById(poId);
  }
}
