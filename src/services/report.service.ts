import { Op } from 'sequelize';
import {
  ProjectInventory,
  PurchaseOrder,
  PurchaseOrderItem,
  MaterialIssue,
  MaterialIssueItem,
  StockMovement,
  ItemType,
  Project,
  Vendor,
  User,
} from '../models';

export class ReportService {
  /**
   * Report 1: Stock Inventory Summary & Valuation Report
   */
  public static async getStockSummaryReport(filters?: {
    project_id?: number;
    health?: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters?.project_id) {
      where.project_id = filters.project_id;
    }

    const inventoryList = await ProjectInventory.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'code', 'location'] },
        { model: ItemType, as: 'item_type' },
      ],
      order: [['project_id', 'ASC'], ['id', 'ASC']],
    });

    let filtered = inventoryList;

    if (filters?.health && filters.health !== 'ALL') {
      filtered = filtered.filter((item) => {
        if (filters.health === 'OUT_OF_STOCK') return item.quantity === 0;
        if (filters.health === 'LOW_STOCK') return item.quantity > 0 && item.quantity <= (item.min_quantity || 10);
        if (filters.health === 'IN_STOCK') return item.quantity > (item.min_quantity || 10);
        return true;
      });
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter((item) => {
        const projName = (item.project?.name || 'Central Warehouse').toLowerCase();
        const projCode = (item.project?.code || '').toLowerCase();
        const itemName = (item.item_type?.name || '').toLowerCase();
        const itemCode = (item.item_type?.code || '').toLowerCase();
        const catNo = (item.item_type?.cat_no || '').toLowerCase();
        const make = (item.item_type?.make || '').toLowerCase();
        const rating = (item.item_type?.rating || '').toLowerCase();
        return projName.includes(q) || projCode.includes(q) || itemName.includes(q) || itemCode.includes(q) || catNo.includes(q) || make.includes(q) || rating.includes(q);
      });
    }

    const total = filtered.length;
    let pageItems = filtered;

    if (filters?.page && filters?.limit) {
      const page = filters.page > 0 ? filters.page : 1;
      const limit = filters.limit > 0 ? filters.limit : 15;
      pageItems = filtered.slice((page - 1) * limit, page * limit);
    }

    return {
      reports: pageItems,
      total,
      page: filters?.page || 1,
      limit: filters?.limit || 15,
      totalPages: filters?.limit ? Math.ceil(total / filters.limit) || 1 : 1,
    };
  }

  /**
   * Report 2: Purchase Orders & Procurement Report
   */
  public static async getPurchaseOrdersReport(filters?: {
    vendor_id?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters?.vendor_id) where.vendor_id = filters.vendor_id;
    if (filters?.status && filters.status !== 'ALL') where.status = filters.status;

    if (filters?.startDate && filters?.endDate) {
      where.order_date = {
        [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)],
      };
    }

    const poList = await PurchaseOrder.findAll({
      where,
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'phone', 'email', 'tax_id'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'code'] },
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [{ model: ItemType, as: 'item_type', attributes: ['id', 'name', 'code', 'unit'] }],
        },
      ],
      order: [['order_date', 'DESC']],
    });

    let filtered = poList;

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter((item) => {
        const poNum = (item.po_number || '').toLowerCase();
        const vendorName = (item.vendor?.name || '').toLowerCase();
        const projName = (item.project?.name || '').toLowerCase();
        const projCode = (item.project?.code || '').toLowerCase();
        const status = (item.status || '').toLowerCase();
        const itemMatch = item.items?.some((pi: any) => {
          const iName = (pi.item_type?.name || '').toLowerCase();
          const iCode = (pi.item_type?.code || '').toLowerCase();
          return iName.includes(q) || iCode.includes(q);
        });

        return poNum.includes(q) || vendorName.includes(q) || projName.includes(q) || projCode.includes(q) || status.includes(q) || itemMatch;
      });
    }

    const total = filtered.length;
    let pageItems = filtered;

    if (filters?.page && filters?.limit) {
      const page = filters.page > 0 ? filters.page : 1;
      const limit = filters.limit > 0 ? filters.limit : 15;
      pageItems = filtered.slice((page - 1) * limit, page * limit);
    }

    return {
      reports: pageItems,
      total,
      page: filters?.page || 1,
      limit: filters?.limit || 15,
      totalPages: filters?.limit ? Math.ceil(total / filters.limit) || 1 : 1,
    };
  }

  /**
   * Report 3: Material Issue Vouchers (Consumption) Report
   */
  public static async getMaterialIssuesReport(filters?: {
    project_id?: number;
    recipient?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};
    if (filters?.project_id) where.project_id = filters.project_id;
    if (filters?.recipient) {
      where.issued_to = { [Op.iLike]: `%${filters.recipient}%` };
    }

    if (filters?.startDate && filters?.endDate) {
      where.issue_date = {
        [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)],
      };
    }

    return await MaterialIssue.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        {
          model: MaterialIssueItem,
          as: 'items',
          include: [{ model: ItemType, as: 'item_type', attributes: ['id', 'name', 'code', 'unit'] }],
        },
      ],
      order: [['issue_date', 'DESC']],
    });
  }

  /**
   * Report 4: Inter-Project Stock Transfers Report
   */
  public static async getStockTransfersReport(filters?: {
    project_id?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = { type: 'TRANSFER' };
    if (filters?.project_id) where.project_id = filters.project_id;

    if (filters?.startDate && filters?.endDate) {
      where.createdAt = {
        [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)],
      };
    }

    return await StockMovement.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'code'] },
        { model: ItemType, as: 'item_type', attributes: ['id', 'name', 'code', 'unit'] },
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Report 5: Complete Audit Trail Movement Ledger Report
   */
  public static async getAuditLedgerReport(filters?: {
    project_id?: number;
    item_type_id?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters?.project_id) where.project_id = filters.project_id;
    if (filters?.item_type_id) where.item_type_id = filters.item_type_id;
    if (filters?.type && filters.type !== 'ALL') where.type = filters.type;

    if (filters?.startDate && filters?.endDate) {
      where.createdAt = {
        [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)],
      };
    }

    const movements = await StockMovement.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'code'] },
        { model: ItemType, as: 'item_type', attributes: ['id', 'name', 'code', 'unit'] },
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    let filtered = movements;

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter((item) => {
        const type = (item.type || '').toLowerCase();
        const projName = (item.project?.name || '').toLowerCase();
        const itemCode = (item.item_type?.code || '').toLowerCase();
        const itemName = (item.item_type?.name || '').toLowerCase();
        const username = (item.user?.username || '').toLowerCase();
        const notes = (item.notes || '').toLowerCase();
        return type.includes(q) || projName.includes(q) || itemCode.includes(q) || itemName.includes(q) || username.includes(q) || notes.includes(q);
      });
    }

    const total = filtered.length;
    let pageItems = filtered;

    if (filters?.page && filters?.limit) {
      const page = filters.page > 0 ? filters.page : 1;
      const limit = filters.limit > 0 ? filters.limit : 15;
      pageItems = filtered.slice((page - 1) * limit, page * limit);
    }

    return {
      reports: pageItems,
      total,
      page: filters?.page || 1,
      limit: filters?.limit || 15,
      totalPages: filters?.limit ? Math.ceil(total / filters.limit) || 1 : 1,
    };
  }

  /**
   * Report 6: Stock Procurement & Allocation Analytics (General vs Project Purpose)
   */
  public static async getProcurementDistributionReport(filters?: {
    project_id?: number;
    search?: string;
    health?: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    page?: number;
    limit?: number;
  }) {
    const itemTypes = await ItemType.findAll({
      order: [['id', 'ASC']],
    });

    const poItems = await PurchaseOrderItem.findAll({
      include: [
        {
          model: PurchaseOrder,
          as: 'purchase_order',
          where: {
            status: { [Op.notIn]: ['CANCELLED', 'REJECTED'] },
          },
          include: [{ model: Project, as: 'project', attributes: ['id', 'name', 'code'] }],
        },
      ],
    });

    const inventoryList = await ProjectInventory.findAll({
      include: [{ model: Project, as: 'project', attributes: ['id', 'name', 'code'] }],
    });

    const reports = itemTypes.map((item) => {
      const itemPoItems = poItems.filter((poi: any) => poi.item_type_id === item.id);
      let general_po_qty = 0;
      let project_po_qty = 0;
      const projectPoMap: Record<number, { project_id: number; project_name: string; project_code: string; qty: number; po_numbers: Set<string> }> = {};

      itemPoItems.forEach((poi: any) => {
        const po = poi.purchase_order;
        const orderedQty = Number(poi.ordered_qty || 0);
        if (!po) return;

        if (!po.project_id || po.project_id === 0) {
          general_po_qty += orderedQty;
        } else {
          project_po_qty += orderedQty;
          const pId = po.project_id;
          if (!projectPoMap[pId]) {
            projectPoMap[pId] = {
              project_id: pId,
              project_name: po.project?.name || `Project #${pId}`,
              project_code: po.project?.code || '',
              qty: 0,
              po_numbers: new Set(),
            };
          }
          projectPoMap[pId].qty += orderedQty;
          if (po.po_number) projectPoMap[pId].po_numbers.add(po.po_number);
        }
      });

      const project_po_breakdown = Object.values(projectPoMap).map((entry) => ({
        ...entry,
        po_numbers: Array.from(entry.po_numbers),
      }));

      const itemInvs = inventoryList.filter((inv) => inv.item_type_id === item.id);
      let central_warehouse_qty = 0;
      let dispatched_site_qty = 0;
      const dispatched_site_breakdown: Array<{ project_id: number; project_name: string; project_code: string; qty: number }> = [];

      itemInvs.forEach((inv: any) => {
        const qty = Number(inv.quantity || 0);
        if (!inv.project_id || inv.project_id === 0) {
          central_warehouse_qty += qty;
        } else {
          dispatched_site_qty += qty;
          if (qty > 0) {
            dispatched_site_breakdown.push({
              project_id: inv.project_id,
              project_name: inv.project?.name || `Project #${inv.project_id}`,
              project_code: inv.project?.code || '',
              qty,
            });
          }
        }
      });

      const total_po_qty = general_po_qty + project_po_qty;
      const total_physical_stock = central_warehouse_qty + dispatched_site_qty;
      const centralInv = itemInvs.find((inv: any) => !inv.project_id || inv.project_id === 0);
      const minQty = centralInv?.min_quantity || 10;

      let health_status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';

      if (total_physical_stock === 0) {
        health_status = 'OUT_OF_STOCK';
      } else if (total_physical_stock <= minQty) {
        health_status = 'LOW_STOCK';
      }

      return {
        id: item.id,
        name: item.name,
        code: item.code,
        cat_no: item.cat_no || '',
        make: item.make || '',
        rating: item.rating || '',
        unit: item.unit || 'pcs',
        min_quantity: minQty,
        general_po_qty,
        project_po_qty,
        total_po_qty,
        project_po_breakdown,
        central_warehouse_qty,
        dispatched_site_qty,
        total_physical_stock,
        dispatched_site_breakdown,
        health_status,
      };
    });

    let filteredReports = reports;

    if (filters?.project_id) {
      const pId = filters.project_id;
      filteredReports = filteredReports.filter((r) => {
        const hasPoIntent = r.project_po_breakdown.some((b) => b.project_id === pId);
        const hasSiteStock = r.dispatched_site_breakdown.some((b) => b.project_id === pId);
        return hasPoIntent || hasSiteStock;
      });
    }

    if (filters?.health && filters.health !== 'ALL') {
      filteredReports = filteredReports.filter((r) => r.health_status === filters.health);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      filteredReports = filteredReports.filter((r) => {
        const name = (r.name || '').toLowerCase();
        const code = (r.code || '').toLowerCase();
        const catNo = (r.cat_no || '').toLowerCase();
        const make = (r.make || '').toLowerCase();
        const rating = (r.rating || '').toLowerCase();
        const hasProject = r.project_po_breakdown?.some(
          (b) =>
            b.project_name?.toLowerCase().includes(q) ||
            b.project_code?.toLowerCase().includes(q) ||
            b.po_numbers?.some((po) => po.toLowerCase().includes(q))
        );
        const hasSite = r.dispatched_site_breakdown?.some(
          (b) => b.project_name?.toLowerCase().includes(q) || b.project_code?.toLowerCase().includes(q)
        );
        return name.includes(q) || code.includes(q) || catNo.includes(q) || make.includes(q) || rating.includes(q) || hasProject || hasSite;
      });
    }

    const summary = {
      total_items: filteredReports.length,
      total_general_po_qty: filteredReports.reduce((acc, r) => acc + r.general_po_qty, 0),
      total_project_po_qty: filteredReports.reduce((acc, r) => acc + r.project_po_qty, 0),
      total_central_stock: filteredReports.reduce((acc, r) => acc + r.central_warehouse_qty, 0),
      total_dispatched_stock: filteredReports.reduce((acc, r) => acc + r.dispatched_site_qty, 0),
    };

    const total = filteredReports.length;
    let pageItems = filteredReports;

    if (filters?.page && filters?.limit) {
      const page = filters.page > 0 ? filters.page : 1;
      const limit = filters.limit > 0 ? filters.limit : 15;
      pageItems = filteredReports.slice((page - 1) * limit, page * limit);
    }

    return {
      summary,
      items: pageItems,
      total,
      page: filters?.page || 1,
      limit: filters?.limit || 15,
      totalPages: filters?.limit ? Math.ceil(total / filters.limit) || 1 : 1,
    };
  }

  /**
   * Report 8: Project Financial Costing & Investment Report (How much money put into project)
   */
  public static async getProjectFinancialCostingReport(filters?: {
    project_id?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { Project, ProjectAssignment, ProjectAssignmentItem, ItemType, PurchaseOrderItem, InventoryLot } = require('../models');

    let targetProjectIds: number[] = [];
    let mainProjects: any[] = [];

    if (filters?.project_id) {
      const pId = Number(filters.project_id);
      const subProjects = await Project.findAll({ where: { parent_id: pId } });
      targetProjectIds = [pId, ...subProjects.map((sp: any) => sp.id)];
      const mainPrj = await Project.findByPk(pId);
      if (mainPrj) mainProjects.push(mainPrj);
    } else {
      mainProjects = await Project.findAll({
        where: { parent_id: null },
      });
      const allProjects = await Project.findAll();
      targetProjectIds = allProjects.map((p: any) => p.id);
    }

    // Lookup PO unit price, discount %, and GST % mapped specifically by PO ID + Item Type ID, as well as latest fallback
    const poItemSpecificMap: Record<string, { base_unit_price: number; disc_percent: number; gst_percent: number; effective_unit_cost: number }> = {};
    const latestPoItemMap: Record<number, { base_unit_price: number; disc_percent: number; gst_percent: number; effective_unit_cost: number }> = {};

    try {
      const poItems = await PurchaseOrderItem.findAll({ order: [['id', 'DESC']] });
      poItems.forEach((poi: any) => {
        const basePrice = Number(poi.unit_price) || 0;
        const disc = Number(poi.discount_percent) || 0;
        const gst = poi.gst_percent !== undefined && poi.gst_percent !== null ? Number(poi.gst_percent) : 18;

        const priceAfterDisc = basePrice - (basePrice * (disc / 100));
        const effectiveUnitCost = Number((priceAfterDisc * (1 + gst / 100)).toFixed(2));

        const specKey = `${poi.po_id}_${poi.item_type_id}`;
        if (!poItemSpecificMap[specKey] && (basePrice > 0 || effectiveUnitCost > 0)) {
          poItemSpecificMap[specKey] = {
            base_unit_price: basePrice,
            disc_percent: disc,
            gst_percent: gst,
            effective_unit_cost: effectiveUnitCost,
          };
        }

        if (!latestPoItemMap[poi.item_type_id] && (basePrice > 0 || effectiveUnitCost > 0)) {
          latestPoItemMap[poi.item_type_id] = {
            base_unit_price: basePrice,
            disc_percent: disc,
            gst_percent: gst,
            effective_unit_cost: effectiveUnitCost,
          };
        }
      });
    } catch (err) {
      console.error('Error loading PO unit prices for costing fallback:', err);
    }

    const whereAssignment: any = {};
    if (targetProjectIds.length > 0) {
      whereAssignment.to_project_id = { [Op.in]: targetProjectIds };
    }

    const assignments = await ProjectAssignment.findAll({
      where: whereAssignment,
      include: [
        {
          model: ProjectAssignmentItem,
          as: 'items',
          include: [
            { model: ItemType, as: 'item_type' },
            { model: InventoryLot, as: 'lot' },
          ],
        },
        { model: Project, as: 'to_project', attributes: ['id', 'name', 'code', 'parent_id', 'location'] },
      ],
      order: [['id', 'DESC']],
    });

    let totalMoneyInvested = 0;
    let totalQuantityAssigned = 0;

    const categoryMap: Record<string, { category: string; items_count: number; total_qty: number; total_cost: number }> = {};
    const subProjectCostMap: Record<number, { id: number; name: string; code: string; location: string; items_count: number; total_qty: number; money_invested: number; percent_share: number }> = {};
    let itemizedLedger: any[] = [];

    assignments.forEach((assignment: any) => {
      const siteId = assignment.to_project_id;
      const siteName = assignment.to_project?.name || `Site #${siteId}`;
      const siteCode = assignment.to_project?.code || '';

      if (!subProjectCostMap[siteId]) {
        subProjectCostMap[siteId] = {
          id: siteId,
          name: siteName,
          code: siteCode,
          location: assignment.to_project?.location || '',
          items_count: 0,
          total_qty: 0,
          money_invested: 0,
          percent_share: 0,
        };
      }

      (assignment.items || []).forEach((item: any) => {
        const qty = item.quantity || 0;

        // Determine Effective Purchase Unit Cost (Incl GST) for this specific lot/PO
        let baseUnitPrice = 0;
        let gstPercent = 0;
        let discPercent = 0;
        let unitCost = 0; // Net Landed Unit Cost (incl. GST)

        const targetPoId = item.po_id || item.lot?.po_id;
        const specKey = targetPoId ? `${targetPoId}_${item.item_type_id}` : '';
        const specificPoInfo = specKey ? poItemSpecificMap[specKey] : null;

        if (specificPoInfo) {
          baseUnitPrice = item.unit_price && Number(item.unit_price) > 0 ? Number(item.unit_price) : specificPoInfo.base_unit_price;
          gstPercent = specificPoInfo.gst_percent;
          discPercent = specificPoInfo.disc_percent;
          const priceAfterDisc = baseUnitPrice - (baseUnitPrice * (discPercent / 100));
          unitCost = Number((priceAfterDisc * (1 + gstPercent / 100)).toFixed(2));
        } else if (item.unit_price !== undefined && item.unit_price !== null && Number(item.unit_price) > 0) {
          baseUnitPrice = Number(item.unit_price);
          if (latestPoItemMap[item.item_type_id]) {
            const poInfo = latestPoItemMap[item.item_type_id];
            gstPercent = poInfo.gst_percent;
            discPercent = poInfo.disc_percent;
            unitCost = Number((baseUnitPrice * (1 + gstPercent / 100)).toFixed(2));
          } else {
            gstPercent = 0;
            discPercent = 0;
            unitCost = baseUnitPrice;
          }
        } else if (latestPoItemMap[item.item_type_id]) {
          const poInfo = latestPoItemMap[item.item_type_id];
          baseUnitPrice = poInfo.base_unit_price;
          gstPercent = poInfo.gst_percent;
          discPercent = poInfo.disc_percent;
          unitCost = poInfo.effective_unit_cost;
        } else if (item.item_type?.unit_rate && Number(item.item_type.unit_rate) > 0) {
          baseUnitPrice = Number(item.item_type.unit_rate);
          gstPercent = 0;
          discPercent = 0;
          unitCost = baseUnitPrice;
        }

        const lineCost = Number((qty * unitCost).toFixed(2));
        const category = item.item_type?.category || 'General Equipment';

        totalMoneyInvested += lineCost;
        totalQuantityAssigned += qty;

        // Sub-Project Site Accumulation
        subProjectCostMap[siteId].total_qty += qty;
        subProjectCostMap[siteId].money_invested += lineCost;
        subProjectCostMap[siteId].items_count += 1;

        // Category Accumulation
        if (!categoryMap[category]) {
          categoryMap[category] = { category, items_count: 0, total_qty: 0, total_cost: 0 };
        }
        categoryMap[category].items_count += 1;
        categoryMap[category].total_qty += qty;
        categoryMap[category].total_cost += lineCost;

        // Itemized Ledger Line
        itemizedLedger.push({
          id: item.id,
          assignment_id: assignment.id,
          assignment_no: assignment.assignment_no,
          site_id: siteId,
          site_name: siteName,
          site_code: siteCode,
          item_type_id: item.item_type_id,
          code: item.item_type?.code || '',
          name: item.item_type?.name || '',
          cat_no: item.item_type?.cat_no || '',
          make: item.item_type?.make || '',
          unit: item.item_type?.unit || 'pcs',
          category,
          quantity: qty,
          base_unit_price: baseUnitPrice,
          disc_percent: discPercent,
          gst_percent: gstPercent,
          unit_cost: unitCost, // Effective Unit Cost incl GST
          total_cost: lineCost,
          status: item.status || 'Allocated',
          assigned_at: item.createdAt,
        });
      });
    });


    let finalSubProjectsCosting = Object.values(subProjectCostMap).map((sp) => ({
      ...sp,
      money_invested: Number(sp.money_invested.toFixed(2)),
      percent_share: totalMoneyInvested > 0 ? Number(((sp.money_invested / totalMoneyInvested) * 100).toFixed(1)) : 0,
    }));

    let finalCategoryCosting = Object.values(categoryMap).map((cat) => ({
      ...cat,
      total_cost: Number(cat.total_cost.toFixed(2)),
      percent_share: totalMoneyInvested > 0 ? Number(((cat.total_cost / totalMoneyInvested) * 100).toFixed(1)) : 0,
    }));

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      itemizedLedger = itemizedLedger.filter(
        (item) =>
          String(item.name || '').toLowerCase().includes(q) ||
          String(item.code || '').toLowerCase().includes(q) ||
          String(item.cat_no || '').toLowerCase().includes(q) ||
          String(item.make || '').toLowerCase().includes(q) ||
          String(item.site_name || '').toLowerCase().includes(q) ||
          String(item.site_code || '').toLowerCase().includes(q) ||
          String(item.assignment_no || '').toLowerCase().includes(q) ||
          String(item.category || '').toLowerCase().includes(q)
      );

      totalMoneyInvested = itemizedLedger.reduce((sum, i) => sum + i.total_cost, 0);
      totalQuantityAssigned = itemizedLedger.reduce((sum, i) => sum + i.quantity, 0);

      const searchSiteMap: Record<number, any> = {};
      const searchCatMap: Record<string, any> = {};

      itemizedLedger.forEach((item) => {
        if (!searchSiteMap[item.site_id]) {
          searchSiteMap[item.site_id] = {
            id: item.site_id,
            name: item.site_name,
            code: item.site_code,
            location: '',
            items_count: 0,
            total_qty: 0,
            money_invested: 0,
            percent_share: 0,
          };
        }
        searchSiteMap[item.site_id].items_count += 1;
        searchSiteMap[item.site_id].total_qty += item.quantity;
        searchSiteMap[item.site_id].money_invested += item.total_cost;

        if (!searchCatMap[item.category]) {
          searchCatMap[item.category] = { category: item.category, items_count: 0, total_qty: 0, total_cost: 0 };
        }
        searchCatMap[item.category].items_count += 1;
        searchCatMap[item.category].total_qty += item.quantity;
        searchCatMap[item.category].total_cost += item.total_cost;
      });

      finalSubProjectsCosting = Object.values(searchSiteMap).map((sp: any) => ({
        ...sp,
        money_invested: Number(sp.money_invested.toFixed(2)),
        percent_share: totalMoneyInvested > 0 ? Number(((sp.money_invested / totalMoneyInvested) * 100).toFixed(1)) : 0,
      }));

      finalCategoryCosting = Object.values(searchCatMap).map((cat: any) => ({
        ...cat,
        total_cost: Number(cat.total_cost.toFixed(2)),
        percent_share: totalMoneyInvested > 0 ? Number(((cat.total_cost / totalMoneyInvested) * 100).toFixed(1)) : 0,
      }));
    }

    const totalLedger = itemizedLedger.length;
    let paginatedLedger = itemizedLedger;

    if (filters?.page && filters?.limit) {
      const page = filters.page > 0 ? filters.page : 1;
      const limit = filters.limit > 0 ? filters.limit : 10;
      paginatedLedger = itemizedLedger.slice((page - 1) * limit, page * limit);
    }

    return {
      summary: {
        total_projects: mainProjects.length,
        total_money_invested: Number(totalMoneyInvested.toFixed(2)),
        total_project_cost: Number(totalMoneyInvested.toFixed(2)),
        total_quantity_assigned: totalQuantityAssigned,
        total_item_types: new Set(itemizedLedger.map((i) => i.item_type_id)).size,
        total_sub_projects: finalSubProjectsCosting.length,
      },
      sub_projects_costing: finalSubProjectsCosting,
      category_costing: finalCategoryCosting,
      itemized_ledger: paginatedLedger,
      total_ledger: totalLedger,
      page: filters?.page || 1,
      limit: filters?.limit || 10,
      totalPages: filters?.limit ? Math.ceil(totalLedger / filters.limit) || 1 : 1,
      selected_project: mainProjects.length === 1 ? mainProjects[0] : null,
    };
  }
}

