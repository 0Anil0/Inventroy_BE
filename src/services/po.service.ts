import { Op } from 'sequelize';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  Vendor,
  Project,
  ItemType,
  TermsAndConditions,
  ProjectInventory,
  StockMovement,
  User,
} from '../models';
import { POApproverService } from './po-approver.service';

export class POService {
  public static async getAll(
    filters?: { project_id?: number; vendor_id?: number },
    currentUser?: { userId: number; role: string }
  ) {
    const where: any = {};
    if (filters?.project_id) where.project_id = filters.project_id;
    if (filters?.vendor_id) where.vendor_id = filters.vendor_id;

    // Role-based visibility check:
    // If role is NOT ADMIN, strictly only show POs created by this user
    if (currentUser && currentUser.role && currentUser.role.toUpperCase() !== 'ADMIN') {
      where.created_by_id = currentUser.userId;
    }

    return await PurchaseOrder.findAll({
      where,
      include: [
        { model: Vendor, as: 'vendor' },
        { model: Project, as: 'project' },
        { model: TermsAndConditions, as: 'terms_and_conditions' },
        { model: User, as: 'created_by_user', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'approved_by_user', attributes: ['id', 'username', 'email'] },
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
        { model: User, as: 'created_by_user', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'approved_by_user', attributes: ['id', 'username', 'email'] },
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

  public static async create(
    data: {
      po_number?: string;
      vendor_id: number;
      project_id?: number;
      terms_and_conditions_id?: number;
      notes?: string;
      order_date?: string;
      expected_date?: string;
      status?: string;
      items: Array<{
        item_type_id: number;
        cat_no?: string;
        make?: string;
        rating?: string;
        hsn_code?: string;
        ordered_qty: number;
        unit_price: number;
        discount_percent?: number;
        gst_percent?: number;
      }>;
    },
    createdById?: number
  ) {
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
        hsn_code: i.hsn_code || null,
        ordered_qty: i.ordered_qty,
        received_qty: 0,
        unit_price: i.unit_price,
        discount_percent: disc,
        gst_percent: gst,
        tax_amount: lineTax,
        total_price: lineSubtotal,
      });
    }

    const initialStatus = data.status || 'PENDING_APPROVAL';

    const po = await PurchaseOrder.create({
      po_number: poNumber,
      vendor_id: data.vendor_id,
      project_id: data.project_id || null,
      terms_and_conditions_id: data.terms_and_conditions_id || null,
      created_by_id: createdById || null,
      status: initialStatus as any,
      total_amount: Math.round(subtotalSum),
      order_date: data.order_date ? new Date(data.order_date) : new Date(),
      expected_date: data.expected_date ? new Date(data.expected_date) : null,
      notes: data.notes || null,
    });

    for (const itemData of itemsPayload) {
      await PurchaseOrderItem.create({
        po_id: po.id,
        ...itemData,
      });

      // Always sync PO unit_price to ItemType catalog Base Price (unit_rate)
      const itemTypeObj = await ItemType.findByPk(itemData.item_type_id);
      if (itemTypeObj) {
        const updateFields: any = {};
        if (itemData.unit_price !== undefined && itemData.unit_price > 0) {
          updateFields.unit_rate = itemData.unit_price;
        }
        if (itemData.hsn_code && !itemTypeObj.hsn_code) {
          updateFields.hsn_code = itemData.hsn_code;
        }
        if (Object.keys(updateFields).length > 0) {
          await itemTypeObj.update(updateFields);
        }
      }
    }

    return await this.getById(po.id);
  }

  public static async update(
    id: number,
    data: {
      po_number?: string;
      vendor_id?: number;
      project_id?: number;
      terms_and_conditions_id?: number;
      notes?: string;
      order_date?: string;
      expected_date?: string;
      items?: Array<{
        item_type_id: number;
        cat_no?: string;
        make?: string;
        rating?: string;
        hsn_code?: string;
        ordered_qty: number;
        unit_price: number;
        discount_percent?: number;
        gst_percent?: number;
      }>;
    },
    currentUser?: { userId: number; role: string }
  ) {
    const po = await PurchaseOrder.findByPk(id);
    if (!po) throw new Error('Purchase order not found');

    // Rule: Approved or Received Purchase Orders CANNOT be edited!
    if (po.status === 'APPROVED' || po.status === 'RECEIVED') {
      throw new Error('This Purchase Order is already APPROVED or RECEIVED and cannot be edited');
    }

    // Permission check for non-admin user editing PO created by someone else
    if (currentUser && currentUser.role.toUpperCase() !== 'ADMIN' && po.created_by_id && po.created_by_id !== currentUser.userId) {
      throw new Error('You can only edit Purchase Orders created by you');
    }

    let subtotalSum = po.total_amount || 0;

    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      subtotalSum = 0;
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
          hsn_code: i.hsn_code || null,
          ordered_qty: i.ordered_qty,
          received_qty: 0,
          unit_price: i.unit_price,
          discount_percent: disc,
          gst_percent: gst,
          tax_amount: lineTax,
          total_price: lineSubtotal,
        });
      }

      // Delete existing line items & replace
      await PurchaseOrderItem.destroy({ where: { po_id: id } });

      for (const itemData of itemsPayload) {
        await PurchaseOrderItem.create({
          po_id: id,
          ...itemData,
        });

        // Always sync PO unit_price to ItemType catalog Base Price (unit_rate)
        const itemTypeObj = await ItemType.findByPk(itemData.item_type_id);
        if (itemTypeObj) {
          const updateFields: any = {};
          if (itemData.unit_price !== undefined && itemData.unit_price > 0) {
            updateFields.unit_rate = itemData.unit_price;
          }
          if (itemData.hsn_code && !itemTypeObj.hsn_code) {
            updateFields.hsn_code = itemData.hsn_code;
          }
          if (Object.keys(updateFields).length > 0) {
            await itemTypeObj.update(updateFields);
          }
        }
      }
    }

    await po.update({
      vendor_id: data.vendor_id || po.vendor_id,
      project_id: data.project_id !== undefined ? data.project_id : po.project_id,
      terms_and_conditions_id: data.terms_and_conditions_id !== undefined ? data.terms_and_conditions_id : po.terms_and_conditions_id,
      notes: data.notes !== undefined ? data.notes : po.notes,
      expected_date: data.expected_date ? new Date(data.expected_date) : po.expected_date,
      order_date: data.order_date ? new Date(data.order_date) : po.order_date,
      total_amount: Math.round(subtotalSum),
    });

    return await this.getById(id);
  }

  public static async approve(id: number, userId: number, roleName: string) {
    const isApprover = await POApproverService.isUserApprover(userId, roleName);
    if (!isApprover) {
      throw new Error('You are not an authorized PO approver');
    }

    const po = await PurchaseOrder.findByPk(id);
    if (!po) throw new Error('Purchase order not found');

    if (po.status === 'APPROVED') {
      throw new Error('Purchase order is already approved');
    }

    await po.update({
      status: 'APPROVED',
      approved_by_id: userId,
      approved_at: new Date(),
    });

    return await this.getById(id);
  }

  public static async reject(id: number, userId: number, roleName: string) {
    const isApprover = await POApproverService.isUserApprover(userId, roleName);
    if (!isApprover) {
      throw new Error('You are not an authorized PO approver');
    }

    const po = await PurchaseOrder.findByPk(id);
    if (!po) throw new Error('Purchase order not found');

    await po.update({
      status: 'REJECTED',
    });

    return await this.getById(id);
  }

  public static async seedDefaultPO() {
    const count = await PurchaseOrder.count();
    if (count === 0) {
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
        status: 'APPROVED',
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

      await item.update({ received_qty: qtyReceived });

      const newCentralStock = itemType.total_quantity + qtyReceived;
      const targetProjectId = (po.project_id && po.project_id !== 0) ? Number(po.project_id) : null;

      const [projInv] = await ProjectInventory.findOrCreate({
        where: { project_id: targetProjectId, item_type_id: item.item_type_id },
        defaults: {
          project_id: targetProjectId,
          item_type_id: item.item_type_id,
          quantity: 0,
          min_quantity: 10,
        },
      });

      const oldQty = projInv.quantity;
      const newQty = oldQty + qtyReceived;
      await projInv.update({ quantity: newQty });

      await StockMovement.create({
        project_id: targetProjectId,
        item_type_id: item.item_type_id,
        user_id: userId || null,
        type: 'IN',
        quantity: qtyReceived,
        previous_quantity: oldQty,
        new_quantity: newQty,
        notes: `Stock Inward via ${po.po_number} (Supplier: ${vendorName})`,
      });
    }

    await po.update({ status: 'RECEIVED' });
    return await this.getById(poId);
  }

  public static async delete(id: number, currentUser?: { userId: number; role: string }) {
    const po = await PurchaseOrder.findByPk(id);
    if (!po) throw new Error('Purchase order not found');

    if (currentUser && currentUser.role.toUpperCase() !== 'ADMIN') {
      if (po.created_by_id && po.created_by_id !== currentUser.userId) {
        throw new Error('You can only delete Purchase Orders created by you');
      }
    }

    await PurchaseOrderItem.destroy({ where: { po_id: id } });
    await po.destroy();
    return { success: true, message: 'Purchase Order deleted successfully' };
  }

  public static async getItemTracking(params: {
    item_type_id?: number;
    vendor_id?: number;
    project_id?: number;
    status?: string;
    search?: string;
  }) {
    const whereItem: any = {};
    const wherePO: any = {};

    if (params.item_type_id) {
      whereItem.item_type_id = params.item_type_id;
    }
    if (params.vendor_id) {
      wherePO.vendor_id = params.vendor_id;
    }
    if (params.project_id) {
      wherePO.project_id = params.project_id;
    }
    if (params.status && params.status !== 'ALL') {
      wherePO.status = params.status;
    }

    if (params.search) {
      const q = `%${params.search.trim()}%`;
      whereItem[Op.or] = [
        { cat_no: { [Op.iLike]: q } },
        { make: { [Op.iLike]: q } },
        { rating: { [Op.iLike]: q } },
        { hsn_code: { [Op.iLike]: q } },
      ];
    }

    const items = await PurchaseOrderItem.findAll({
      where: whereItem,
      include: [
        {
          model: ItemType,
          as: 'item_type',
          where: params.search
            ? {
                [Op.or]: [
                  { name: { [Op.iLike]: `%${params.search.trim()}%` } },
                  { code: { [Op.iLike]: `%${params.search.trim()}%` } },
                  { cat_no: { [Op.iLike]: `%${params.search.trim()}%` } },
                  { make: { [Op.iLike]: `%${params.search.trim()}%` } },
                ],
              }
            : undefined,
          required: false,
        },
        {
          model: PurchaseOrder,
          as: 'purchase_order',
          where: wherePO,
          include: [
            { model: Vendor, as: 'vendor' },
            { model: Project, as: 'project' },
            { model: User, as: 'created_by_user', attributes: ['id', 'username', 'email'] },
          ],
        },
      ],
      order: [['id', 'DESC']],
    });

    let totalOrderedQty = 0;
    let totalReceivedQty = 0;
    let totalSpend = 0;

    const formattedList = items.map((row) => {
      const ordQty = Number(row.ordered_qty || 0);
      const recQty = Number(row.received_qty || 0);
      const price = Number(row.unit_price || 0);
      const disc = Number(row.discount_percent || 0);
      const gst = Number(row.gst_percent !== undefined ? row.gst_percent : 18);

      const netSub = ordQty * price * (1 - disc / 100);
      const lineTax = netSub * (gst / 100);
      const grandLine = netSub + lineTax;

      totalOrderedQty += ordQty;
      totalReceivedQty += recQty;
      totalSpend += grandLine;

      return {
        id: row.id,
        po_id: row.po_id,
        po_number: row.purchase_order?.po_number || `PO-#${row.po_id}`,
        order_date: row.purchase_order?.order_date,
        expected_date: row.purchase_order?.expected_date,
        po_status: row.purchase_order?.status || 'PENDING',
        vendor_id: row.purchase_order?.vendor_id,
        vendor_name: row.purchase_order?.vendor?.name || 'N/A',
        project_id: row.purchase_order?.project_id,
        project_name: row.purchase_order?.project ? `${row.purchase_order.project.code} - ${row.purchase_order.project.name}` : 'General / Central',
        created_by: row.purchase_order?.created_by_user?.username || 'System',

        item_type_id: row.item_type_id,
        item_code: row.item_type?.code || 'N/A',
        item_name: row.item_type?.name || 'N/A',
        cat_no: row.cat_no || row.item_type?.cat_no || '-',
        make: row.make || row.item_type?.make || '-',
        rating: row.rating || row.item_type?.rating || '-',
        unit: row.item_type?.unit || 'PCS',
        hsn_code: row.hsn_code || row.item_type?.hsn_code || '-',

        ordered_qty: ordQty,
        received_qty: recQty,
        pending_qty: Math.max(0, ordQty - recQty),
        unit_price: price,
        discount_percent: disc,
        gst_percent: gst,
        tax_amount: lineTax,
        net_subtotal: netSub,
        total_price: grandLine,
      };
    });

    return {
      success: true,
      summary: {
        totalRecords: items.length,
        totalOrderedQty,
        totalReceivedQty,
        totalPendingQty: Math.max(0, totalOrderedQty - totalReceivedQty),
        totalSpend,
      },
      items: formattedList,
    };
  }
}
