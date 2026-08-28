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
}
