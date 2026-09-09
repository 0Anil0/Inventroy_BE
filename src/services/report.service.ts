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
        { model: ItemType, as: 'item_type', attributes: ['id', 'name', 'code', 'unit', 'total_quantity', 'description'] },
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
    const itemWhere: any = {};
    if (filters?.search) {
      itemWhere[Op.or] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { code: { [Op.iLike]: `%${filters.search}%` } },
        { cat_no: { [Op.iLike]: `%${filters.search}%` } },
        { make: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    const itemTypes = await ItemType.findAll({
      where: itemWhere,
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
}

