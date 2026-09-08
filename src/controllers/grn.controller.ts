import { Request, Response } from 'express';
import { Op } from 'sequelize';
import {
  sequelize,
  GoodsReceiptNote,
  GoodsReceiptNoteItem,
  PurchaseOrder,
  PurchaseOrderItem,
  ProjectInventory,
  StockMovement,
  Vendor,
  Project,
  User,
  ItemType,
  Make,
  Unit,
  StorageShelf,
  StorageRack,
} from '../models';

export const getGRNs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendor_id, project_id, po_id, from_date, to_date, search } = req.query;

    const where: any = {};
    const poWhere: any = {};

    if (po_id) {
      where.po_id = Number(po_id);
    }
    if (project_id) {
      where.project_id = Number(project_id);
    }
    if (vendor_id) {
      poWhere.vendor_id = Number(vendor_id);
    }
    if (from_date && to_date) {
      where.received_date = {
        [Op.between]: [String(from_date), String(to_date)],
      };
    } else if (from_date) {
      where.received_date = { [Op.gte]: String(from_date) };
    } else if (to_date) {
      where.received_date = { [Op.lte]: String(to_date) };
    }

    if (search) {
      const s = `%${String(search).trim()}%`;
      where[Op.or] = [
        { grn_number: { [Op.iLike]: s } },
        { challan_no: { [Op.iLike]: s } },
        { vehicle_no: { [Op.iLike]: s } },
      ];
    }

    const grns = await GoodsReceiptNote.findAll({
      where,
      order: [['id', 'DESC']],
      include: [
        {
          model: PurchaseOrder,
          as: 'purchase_order',
          where: Object.keys(poWhere).length > 0 ? poWhere : undefined,
          include: [
            { model: Vendor, as: 'vendor' },
            { model: Project, as: 'project' },
          ],
        },
        { model: Project, as: 'project' },
        { model: User, as: 'received_by_user', attributes: ['id', 'username', 'email'] },
        {
          model: GoodsReceiptNoteItem,
          as: 'items',
          include: [
            {
              model: ItemType,
              as: 'item_type',
              include: [
                { model: Make, as: 'make_details' },
                { model: Unit, as: 'unit_details' },
              ],
            },
            { model: StorageShelf, as: 'shelf' },
            { model: StorageRack, as: 'rack' },
          ],
        },
      ],
    });
    res.json(grns);
  } catch (error: any) {
    console.error('Error fetching GRNs:', error);
    res.status(500).json({ message: 'Error fetching Goods Receipt Notes', error: error.message });
  }
};

export const getGRNById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid GRN ID' });
      return;
    }

    const grn = await GoodsReceiptNote.findByPk(id, {
      include: [
        {
          model: PurchaseOrder,
          as: 'purchase_order',
          include: [
            { model: Vendor, as: 'vendor' },
            { model: Project, as: 'project' },
          ],
        },
        { model: Project, as: 'project' },
        { model: User, as: 'received_by_user', attributes: ['id', 'username', 'email'] },
        {
          model: GoodsReceiptNoteItem,
          as: 'items',
          include: [
            {
              model: ItemType,
              as: 'item_type',
              include: [
                { model: Make, as: 'make_details' },
                { model: Unit, as: 'unit_details' },
              ],
            },
            { model: StorageShelf, as: 'shelf' },
            { model: StorageRack, as: 'rack' },
          ],
        },
      ],
    });

    if (!grn) {
      res.status(404).json({ message: 'GRN not found' });
      return;
    }

    res.json(grn);
  } catch (error: any) {
    console.error('Error fetching GRN detail:', error);
    res.status(500).json({ message: 'Error fetching GRN detail', error: error.message });
  }
};

export const createGRN = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    const { po_id, received_date, challan_no, vehicle_no, remarks, items } = req.body;

    if (!po_id || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'PO ID and at least one item are required' });
      await transaction.rollback();
      return;
    }

    const po = await PurchaseOrder.findByPk(po_id, {
      include: [{ model: PurchaseOrderItem, as: 'items' }],
      transaction,
    });

    if (!po) {
      res.status(404).json({ message: 'Purchase Order not found' });
      await transaction.rollback();
      return;
    }

    if (po.status !== 'APPROVED' && po.status !== 'PARTIALLY_RECEIVED') {
      res.status(400).json({ message: `Cannot create GRN for PO with status: ${po.status}` });
      await transaction.rollback();
      return;
    }

    const projectId = po.project_id || null;

    // Generate unique GRN Number
    const year = new Date().getFullYear();
    const grnCount = await GoodsReceiptNote.count({ transaction });
    const grn_number = `GRN-${year}-${String(grnCount + 1).padStart(4, '0')}`;

    const userId = (req as any).user?.userId || (req as any).user?.id || null;

    const grn = await GoodsReceiptNote.create(
      {
        grn_number,
        po_id: po.id,
        project_id: projectId,
        received_date: received_date || new Date().toISOString().split('T')[0],
        challan_no: challan_no || null,
        vehicle_no: vehicle_no || null,
        received_by_id: userId,
        remarks: remarks || null,
        status: 'RECEIVED',
      },
      { transaction }
    );

    let totalReceivedInThisGRN = 0;

    for (const itemData of items) {
      const receivedQtyNow = Number(itemData.received_qty || 0);
      if (receivedQtyNow <= 0) continue;

      totalReceivedInThisGRN += receivedQtyNow;
      const shelfId = itemData.shelf_id ? Number(itemData.shelf_id) : null;
      const rackId = itemData.rack_id ? Number(itemData.rack_id) : null;

      // 1. Create GRN item
      await GoodsReceiptNoteItem.create(
        {
          grn_id: grn.id,
          po_item_id: itemData.po_item_id ? Number(itemData.po_item_id) : null,
          item_type_id: Number(itemData.item_type_id),
          received_qty: receivedQtyNow,
          shelf_id: shelfId,
          rack_id: rackId,
          notes: itemData.notes || null,
        },
        { transaction }
      );

      // 2. Update PurchaseOrderItem received_qty if linked to a PO item line
      if (itemData.po_item_id) {
        const poItem = await PurchaseOrderItem.findByPk(itemData.po_item_id, { transaction });
        if (poItem) {
          poItem.received_qty = (poItem.received_qty || 0) + receivedQtyNow;
          await poItem.save({ transaction });
        }
      }

      // 3. Update / Upsert Central Warehouse Inventory (Always project_id = null)
      const existingInventory = await ProjectInventory.findOne({
        where: {
          project_id: null,
          item_type_id: Number(itemData.item_type_id),
        },
        transaction,
      });

      let prevQty = 0;
      let newQty = receivedQtyNow;

      if (existingInventory) {
        prevQty = existingInventory.quantity;
        existingInventory.quantity += receivedQtyNow;
        newQty = existingInventory.quantity;
        if (shelfId) existingInventory.shelf_id = shelfId;
        if (rackId) existingInventory.rack_id = rackId;
        await existingInventory.save({ transaction });
      } else {
        await ProjectInventory.create(
          {
            project_id: null,
            item_type_id: Number(itemData.item_type_id),
            shelf_id: shelfId,
            rack_id: rackId,
            quantity: receivedQtyNow,
            min_quantity: 0,
          },
          { transaction }
        );
      }

      // Update ItemType.total_quantity
      const itemTypeRecord = await ItemType.findByPk(Number(itemData.item_type_id), { transaction });
      if (itemTypeRecord) {
        await itemTypeRecord.update(
          { total_quantity: (itemTypeRecord.total_quantity || 0) + receivedQtyNow },
          { transaction }
        );
      }

      // 4. Record Stock Movement into Central Warehouse (project_id = null)
      let locationNote = '';
      if (shelfId) {
        const shelf = await StorageShelf.findByPk(shelfId, { transaction });
        locationNote += ` | Shelf: ${shelf?.code || shelf?.name || shelfId}`;
      }
      if (rackId) {
        const rack = await StorageRack.findByPk(rackId, { transaction });
        locationNote += ` - Rack: ${rack?.rack_code || rack?.name || rackId}`;
      }

      await StockMovement.create(
        {
          project_id: null,
          item_type_id: Number(itemData.item_type_id),
          user_id: userId,
          type: 'IN',
          quantity: receivedQtyNow,
          previous_quantity: prevQty,
          new_quantity: newQty,
          notes: `Central Inward via GRN: ${grn_number} (PO: ${po.po_number})${po.project_id ? ` | Purpose: Project #${po.project_id}` : ''}${challan_no ? ` | Inv: ${challan_no}` : ''}${locationNote}`,
        },
        { transaction }
      );
    }

    if (totalReceivedInThisGRN === 0) {
      res.status(400).json({ message: 'No valid item received quantities specified' });
      await transaction.rollback();
      return;
    }

    // Check PO overall status update
    const updatedPoItems = await PurchaseOrderItem.findAll({
      where: { po_id: po.id },
      transaction,
    });

    let allFullyReceived = true;
    let anyReceived = false;

    for (const pItem of updatedPoItems) {
      if ((pItem.received_qty || 0) < pItem.ordered_qty) {
        allFullyReceived = false;
      }
      if ((pItem.received_qty || 0) > 0) {
        anyReceived = true;
      }
    }

    if (allFullyReceived) {
      po.status = 'RECEIVED';
    } else if (anyReceived) {
      po.status = 'PARTIALLY_RECEIVED';
    }

    await po.save({ transaction });
    await transaction.commit();

    const createdGrn = await GoodsReceiptNote.findByPk(grn.id, {
      include: [
        {
          model: PurchaseOrder,
          as: 'purchase_order',
          include: [
            { model: Vendor, as: 'vendor' },
            { model: Project, as: 'project' },
          ],
        },
        { model: Project, as: 'project' },
        { model: User, as: 'received_by_user', attributes: ['id', 'username', 'email'] },
        {
          model: GoodsReceiptNoteItem,
          as: 'items',
          include: [
            {
              model: ItemType,
              as: 'item_type',
              include: [
                { model: Make, as: 'make_details' },
                { model: Unit, as: 'unit_details' },
              ],
            },
            { model: StorageShelf, as: 'shelf' },
            { model: StorageRack, as: 'rack' },
          ],
        },
      ],
    });

    res.status(201).json(createdGrn);
  } catch (error: any) {
    await transaction.rollback();
    console.error('Error creating GRN:', error);
    res.status(500).json({ message: 'Error creating Goods Receipt Note', error: error.message });
  }
};
