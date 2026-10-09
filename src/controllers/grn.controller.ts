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
  InventoryLot,
} from '../models';

export const getGRNs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vendor_id, project_id, po_id, from_date, to_date, search, page, limit } = req.query;

    const plantId = (req as any).plantId;

    const where: any = {};
    const poWhere: any = {};

    if (plantId) {
      poWhere.plant_id = Number(plantId);
    }

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

    const allGrns = await GoodsReceiptNote.findAll({
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

    let filtered = allGrns.map((g) => (g.toJSON ? g.toJSON() : g));

    if (search && String(search).trim()) {
      const q = String(search).toLowerCase().trim();
      filtered = filtered.filter((g: any) => {
        const matchGrn = (g.grn_number || '').toLowerCase().includes(q);
        const matchChallan = (g.challan_no || '').toLowerCase().includes(q);
        const matchVehicle = (g.vehicle_no || '').toLowerCase().includes(q);
        const matchPo = (g.purchase_order?.po_number || '').toLowerCase().includes(q);
        const matchVendor = (g.purchase_order?.vendor?.name || '').toLowerCase().includes(q);
        const matchProject =
          (g.project?.name || '').toLowerCase().includes(q) ||
          (g.project?.code || '').toLowerCase().includes(q) ||
          (g.purchase_order?.project?.name || '').toLowerCase().includes(q) ||
          (g.purchase_order?.project?.code || '').toLowerCase().includes(q);

        const matchItems = (g.items || []).some(
          (i: any) =>
            (i.item_type?.name || '').toLowerCase().includes(q) ||
            (i.item_type?.code || '').toLowerCase().includes(q) ||
            (i.item_type?.cat_no || '').toLowerCase().includes(q) ||
            (i.item_type?.make || '').toLowerCase().includes(q)
        );

        return matchGrn || matchChallan || matchVehicle || matchPo || matchVendor || matchProject || matchItems;
      });
    }

    const total = filtered.length;
    const pageNum = page ? parseInt(String(page), 10) : undefined;
    const limitNum = limit ? parseInt(String(limit), 10) : undefined;

    let pageItems = filtered;
    if (pageNum && limitNum) {
      const start = (pageNum - 1) * limitNum;
      pageItems = filtered.slice(start, start + limitNum);
    }

    if (pageNum || limitNum || req.query.paginate === 'true') {
      res.json({
        success: true,
        grns: pageItems,
        total,
        page: pageNum || 1,
        limit: limitNum || total,
      });
    } else {
      res.json(filtered);
    }
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

    // Generate guaranteed unique GRN Number
    const year = new Date().getFullYear();
    const maxGrn = await GoodsReceiptNote.findOne({
      order: [['id', 'DESC']],
      transaction,
    });
    let seq = (maxGrn?.id || 0) + 1;
    let grn_number = `GRN-${year}-${String(seq).padStart(4, '0')}`;
    let existingGrn = await GoodsReceiptNote.findOne({ where: { grn_number }, transaction });
    while (existingGrn) {
      seq++;
      grn_number = `GRN-${year}-${String(seq).padStart(4, '0')}`;
      existingGrn = await GoodsReceiptNote.findOne({ where: { grn_number }, transaction });
    }

    const userId = (req as any).user?.userId || (req as any).user?.id || null;
    const plant_id = (req as any).plantId;
    if (!plant_id) {
      res.status(400).json({ message: 'Plant selection is required' });
      await transaction.rollback();
      return;
    }

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
    let itemSeq = 0;

    for (const itemData of items) {
      const receivedQtyNow = Number(itemData.received_qty || 0);
      if (receivedQtyNow <= 0) continue;

      itemSeq++;
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

      // 2. Update PurchaseOrderItem received_qty and get unit purchase rate
      let unitPrice = 0;
      if (itemData.po_item_id) {
        const poItem = await PurchaseOrderItem.findByPk(itemData.po_item_id, { transaction });
        if (poItem) {
          poItem.received_qty = (poItem.received_qty || 0) + receivedQtyNow;
          await poItem.save({ transaction });
          unitPrice = Number(poItem.unit_price || 0);
        }
      }

      if (!unitPrice) {
        const catItem = await ItemType.findByPk(Number(itemData.item_type_id), { transaction });
        unitPrice = Number(catItem?.unit_rate || 0);
      }

      // 3. Update / Upsert Project / Central Warehouse Inventory & Create Inventory Stock Lot
      const targetProjectId = po.project_id && po.project_id !== 0 ? Number(po.project_id) : null;

      await InventoryLot.create(
        {
          item_type_id: Number(itemData.item_type_id),
          po_id: po.id,
          po_item_id: itemData.po_item_id ? Number(itemData.po_item_id) : null,
          grn_id: grn.id,
          project_id: targetProjectId,
          unit_price: unitPrice,
          received_qty: receivedQtyNow,
          available_qty: receivedQtyNow,
          assigned_qty: 0,
          shelf_id: shelfId,
          rack_id: rackId,
          plant_id,
          lot_number: `${po.po_number || 'PO'}-${grn_number}-I${itemData.item_type_id}-${itemSeq}`,
        },
        { transaction }
      );

      const existingInventory = await ProjectInventory.findOne({
        where: {
          project_id: targetProjectId,
          item_type_id: Number(itemData.item_type_id),
          plant_id,
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
            project_id: targetProjectId,
            item_type_id: Number(itemData.item_type_id),
            plant_id,
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

      // 4. Record Stock Movement into Target Location (project_id)
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
          project_id: targetProjectId,
          item_type_id: Number(itemData.item_type_id),
          plant_id,
          user_id: userId,
          type: 'IN',
          quantity: receivedQtyNow,
          previous_quantity: prevQty,
          new_quantity: newQty,
          notes: `Stock Inward via GRN: ${grn_number} (PO: ${po.po_number})${targetProjectId ? ` | Project #${targetProjectId}` : ' | General Stock'}${challan_no ? ` | Inv: ${challan_no}` : ''}${locationNote}`.slice(0, 250),
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
    const detailError = error.errors ? error.errors.map((e: any) => `${e.path}: ${e.message}`).join('; ') : error.message;
    res.status(500).json({ message: 'Error creating Goods Receipt Note', error: detailError || error.message });
  }
};
