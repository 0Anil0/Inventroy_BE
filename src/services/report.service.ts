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

    // Filter health status if requested
    if (filters?.health && filters.health !== 'ALL') {
      return inventoryList.filter((item) => {
        if (filters.health === 'OUT_OF_STOCK') return item.quantity === 0;
        if (filters.health === 'LOW_STOCK') return item.quantity > 0 && item.quantity <= (item.min_quantity || 10);
        if (filters.health === 'IN_STOCK') return item.quantity > (item.min_quantity || 10);
        return true;
      });
    }

    return inventoryList;
  }

  /**
   * Report 2: Purchase Orders & Procurement Report
   */
  public static async getPurchaseOrdersReport(filters?: {
    vendor_id?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};
    if (filters?.vendor_id) where.vendor_id = filters.vendor_id;
    if (filters?.status) where.status = filters.status;

    if (filters?.startDate && filters?.endDate) {
      where.order_date = {
        [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)],
      };
    }

    return await PurchaseOrder.findAll({
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

    return await StockMovement.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'code'] },
        { model: ItemType, as: 'item_type', attributes: ['id', 'name', 'code', 'unit'] },
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 200,
    });
  }

  /**
   * Report 6: Stock Procurement & Allocation Analytics (General vs Project Purpose)
   */
  public static async getProcurementDistributionReport(filters?: {
    project_id?: number;
    search?: string;
    health?: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
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
          include: [
            { model: Project, as: 'project', attributes: ['id', 'name', 'code'] },
          ],
        },
      ],
    });

    const inventoryList = await ProjectInventory.findAll({
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'code'] },
      ],
    });

    const reports = itemTypes.map((item) => {
      const itemPoItems = poItems.filter((poi) => poi.item_type_id === item.id);

      let general_po_qty = 0;
      let project_po_qty = 0;
      const projectPoMap: Record<number, { project_id: number; project_name: string; project_code: string; qty: number; po_numbers: Set<string> }> = {};

      itemPoItems.forEach((poi: any) => {
        const po = poi.purchase_order || poi.po;
        const orderedQty = poi.ordered_qty || 0;
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
        const qty = inv.quantity || 0;
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

    return {
      summary,
      items: filteredReports,
    };
  }

  /**
   * Report 8: Project Financial Costing & Investment Report (How much money put into project)
   */
  public static async getProjectFinancialCostingReport(filters?: {

    project_id?: number;
    search?: string;
  }) {
    const { Project, ProjectAssignment, ProjectAssignmentItem, ItemType, PurchaseOrderItem } = require('../models');

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

    // Lookup latest Purchase Order unit price, discount %, and GST % for each item_type_id
    const latestPoItemMap: Record<number, { base_unit_price: number; disc_percent: number; gst_percent: number; effective_unit_cost: number }> = {};
    try {
      const poItems = await PurchaseOrderItem.findAll({ order: [['id', 'DESC']] });
      poItems.forEach((poi: any) => {
        if (!latestPoItemMap[poi.item_type_id]) {
          const basePrice = Number(poi.unit_price) || 0;
          const disc = Number(poi.discount_percent) || 0;
          const gst = poi.gst_percent !== undefined ? Number(poi.gst_percent) : 18;

          const priceAfterDisc = basePrice - (basePrice * (disc / 100));
          const effectiveUnitCost = Number((priceAfterDisc * (1 + gst / 100)).toFixed(2));

          if (basePrice > 0 || effectiveUnitCost > 0) {
            latestPoItemMap[poi.item_type_id] = {
              base_unit_price: basePrice,
              disc_percent: disc,
              gst_percent: gst,
              effective_unit_cost: effectiveUnitCost,
            };
          }
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
          include: [{ model: ItemType, as: 'item_type' }],
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

        // Determine Effective Purchase Unit Cost (Incl GST)
        let baseUnitPrice = 0;
        let gstPercent = 18;
        let discPercent = 0;
        let unitCost = 0; // Net Landed Unit Cost (incl. GST)

        if (latestPoItemMap[item.item_type_id]) {
          const poInfo = latestPoItemMap[item.item_type_id];
          baseUnitPrice = poInfo.base_unit_price;
          gstPercent = poInfo.gst_percent;
          discPercent = poInfo.disc_percent;
          unitCost = poInfo.effective_unit_cost;
        } else if (item.unit_cost !== undefined && item.unit_cost !== null && Number(item.unit_cost) > 0) {
          baseUnitPrice = Number(item.unit_cost);
          unitCost = Number((baseUnitPrice * 1.18).toFixed(2));
        } else if (item.item_type?.unit_rate && Number(item.item_type.unit_rate) > 0) {
          baseUnitPrice = Number(item.item_type.unit_rate);
          unitCost = Number((baseUnitPrice * 1.18).toFixed(2));
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


    // Calculate percent share for sub-projects and categories
    const subProjectsCosting = Object.values(subProjectCostMap).map((sp) => ({
      ...sp,
      money_invested: Number(sp.money_invested.toFixed(2)),
      percent_share: totalMoneyInvested > 0 ? Number(((sp.money_invested / totalMoneyInvested) * 100).toFixed(1)) : 0,
    }));

    const categoryCosting = Object.values(categoryMap).map((cat) => ({
      ...cat,
      total_cost: Number(cat.total_cost.toFixed(2)),
      percent_share: totalMoneyInvested > 0 ? Number(((cat.total_cost / totalMoneyInvested) * 100).toFixed(1)) : 0,
    }));

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      itemizedLedger = itemizedLedger.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.cat_no.toLowerCase().includes(q) ||
          item.make.toLowerCase().includes(q) ||
          item.site_name.toLowerCase().includes(q)
      );
    }

    return {
      summary: {
        total_projects: mainProjects.length,
        total_money_invested: Number(totalMoneyInvested.toFixed(2)), // Actual Money put into project (incl. GST)
        total_project_cost: Number(totalMoneyInvested.toFixed(2)),
        total_quantity_assigned: totalQuantityAssigned,
        total_item_types: new Set(itemizedLedger.map((i) => i.item_type_id)).size,
        total_sub_projects: subProjectsCosting.length,
      },
      sub_projects_costing: subProjectsCosting,
      category_costing: categoryCosting,
      itemized_ledger: itemizedLedger,
      selected_project: mainProjects.length === 1 ? mainProjects[0] : null,
    };

  }
}

