import {
  PurchaseOrder,
  PurchaseOrderItem,
  Vendor,
  Project,
  ItemType,
  TermsAndConditions,
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
        { model: TermsAndConditions, as: 'terms_and_conditions' },
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
        { model: TermsAndConditions, as: 'terms_and_conditions' },
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
    po_number?: string;
    vendor_id: number;
    project_id?: number;
    terms_and_conditions_id?: number;
    notes?: string;
    order_date?: string;
    expected_date?: string;
    items: Array<{
      item_type_id: number;
      cat_no?: string;
      make?: string;
      rating?: string;
      ordered_qty: number;
      unit_price: number;
      discount_percent?: number;
      gst_percent?: number;
    }>;
  }) {
    const count = await PurchaseOrder.count();
    const poNumber = data.po_number || `EEEA/26-27/${String(count + 1).padStart(2, '0')}`;

    let subtotalSum = 0;
    let totalTaxSum = 0;
    const itemsPayload = [];

    for (const i of data.items) {
      const disc = i.discount_percent || 0;
      const gst = i.gst_percent !== undefined ? i.gst_percent : 18;
      const gross = i.ordered_qty * i.unit_price;
      const lineSubtotal = gross - gross * (disc / 100);
      const lineTax = lineSubtotal * (gst / 100);

      subtotalSum += lineSubtotal;
      totalTaxSum += lineTax;

      itemsPayload.push({
        item_type_id: i.item_type_id,
        cat_no: i.cat_no || null,
        make: i.make || null,
        rating: i.rating || null,
        ordered_qty: i.ordered_qty,
        received_qty: 0,
        unit_price: i.unit_price,
        discount_percent: disc,
        gst_percent: gst,
        tax_amount: lineTax,
        total_price: lineSubtotal,
      });
    }

    const grandTotal = subtotalSum + totalTaxSum;

    const po = await PurchaseOrder.create({
      po_number: poNumber,
      vendor_id: data.vendor_id,
      project_id: data.project_id || null,
      terms_and_conditions_id: data.terms_and_conditions_id || null,
      status: 'ORDERED',
      total_amount: Math.round(subtotalSum), // basic amount
      order_date: data.order_date ? new Date(data.order_date) : new Date(),
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

  public static async seedDefaultPO() {
    const count = await PurchaseOrder.count();
    if (count === 0) {
      // Find or create Vendor AMTECH INDIA
      let vendor = await Vendor.findOne({ where: { name: 'AMTECH INDIA' } });
      if (!vendor) {
        vendor = await Vendor.create({
          name: 'AMTECH INDIA',
          contact_person: 'Sales Department',
          phone: '0294-2415555',
          email: 'sales@amtechindia.com',
          address: '167 GANGA SADAN ASHWINI MARG, UDAIPUR 313001 (RAJ)',
          tax_id: 'GSTIN08AMTECH1234F1Z0',
        });
      }

      // Ensure item types exist for PO line items
      const poItemsDef = [
        { name: 'Heavy duty Plug 16A 5 Pin 415 VAC', code: 'ITM-AM-01', cat_no: 'DS1A7A1', make: 'ABB', unit: 'pcs', unit_price: 2025, discount_percent: 43.5, gst_percent: 18, ordered_qty: 40 },
        { name: 'Heavy duty Socket 16A 5 Pin 415 VAC', code: 'ITM-AM-02', cat_no: 'DS1B7A1', make: 'ABB', unit: 'pcs', unit_price: 2510, discount_percent: 43.5, gst_percent: 18, ordered_qty: 40 },
        { name: 'Heavy duty Plug 32A 5 Pin 415 VAC', code: 'ITM-AM-03', cat_no: 'DS3A7A1', make: 'ABB', unit: 'pcs', unit_price: 3310, discount_percent: 43.5, gst_percent: 18, ordered_qty: 48 },
        { name: 'Heavy duty Socket 32A 5 Pin 415 VAC', code: 'ITM-AM-04', cat_no: 'DS3B7A1', make: 'ABB', unit: 'pcs', unit_price: 4020, discount_percent: 43.5, gst_percent: 18, ordered_qty: 48 },
        { name: 'Heavy duty Plug 63A 5 Pin 415 VAC', code: 'ITM-AM-05', cat_no: 'DS6A7A1', make: 'ABB', unit: 'pcs', unit_price: 5265, discount_percent: 43.5, gst_percent: 18, ordered_qty: 20 },
        { name: 'Heavy duty Socket 63A 5 Pin 415 VAC', code: 'ITM-AM-06', cat_no: 'DS6B7A1', make: 'ABB', unit: 'pcs', unit_price: 7260, discount_percent: 43.5, gst_percent: 18, ordered_qty: 20 },
        { name: 'Heavy duty power plug 30A 3 pin', code: 'ITM-AM-07', cat_no: '2415B', make: 'ABB', unit: 'pcs', unit_price: 1360, discount_percent: 33.0, gst_percent: 18, ordered_qty: 54 },
        { name: 'Heavy duty power socket 30A 3 pin', code: 'ITM-AM-08', cat_no: '215B', make: 'ABB', unit: 'pcs', unit_price: 1340, discount_percent: 33.0, gst_percent: 18, ordered_qty: 54 },
      ];

      const itemsPayload = [];
      for (const def of poItemsDef) {
        const [item] = await ItemType.findOrCreate({
          where: { code: def.code },
          defaults: {
            name: def.name,
            code: def.code,
            cat_no: def.cat_no,
            make: def.make,
            unit: def.unit,
            full_description: `${def.name} (${def.cat_no})`,
            total_quantity: 100,
          },
        });

        itemsPayload.push({
          item_type_id: item.id,
          cat_no: def.cat_no,
          make: def.make,
          ordered_qty: def.ordered_qty,
          unit_price: def.unit_price,
          discount_percent: def.discount_percent,
          gst_percent: def.gst_percent,
        });
      }

      await this.create({
        po_number: 'EEEA/26-27/54',
        vendor_id: vendor.id,
        order_date: '2026-07-24',
        notes: 'Project No. 1000104 - Heavy Duty Plugs & Sockets Supply',
        items: itemsPayload,
      });

      console.log('Sample Purchase Order EEEA/26-27/54 (AMTECH INDIA) seeded into database.');
    }
  }

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
