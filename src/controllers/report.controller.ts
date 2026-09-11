import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';

export class ReportController {
  public static async getStockSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_id, health } = req.query;
      const data = await ReportService.getStockSummaryReport({
        project_id: project_id ? parseInt(String(project_id), 10) : undefined,
        health: health ? String(health) as any : undefined,
      });
      res.json({ success: true, reports: data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to generate stock report' });
    }
  }

  public static async getPurchaseOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vendor_id, status, startDate, endDate } = req.query;
      const data = await ReportService.getPurchaseOrdersReport({
        vendor_id: vendor_id ? parseInt(String(vendor_id), 10) : undefined,
        status: status ? String(status) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });
      res.json({ success: true, reports: data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to generate PO report' });
    }
  }

  public static async getMaterialIssues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_id, recipient, startDate, endDate } = req.query;
      const data = await ReportService.getMaterialIssuesReport({
        project_id: project_id ? parseInt(String(project_id), 10) : undefined,
        recipient: recipient ? String(recipient) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });
      res.json({ success: true, reports: data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to generate material issues report' });
    }
  }

  public static async getStockTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_id, startDate, endDate } = req.query;
      const data = await ReportService.getStockTransfersReport({
        project_id: project_id ? parseInt(String(project_id), 10) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });
      res.json({ success: true, reports: data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to generate transfers report' });
    }
  }

  public static async getAuditLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_id, item_type_id, type, startDate, endDate } = req.query;
      const data = await ReportService.getAuditLedgerReport({
        project_id: project_id ? parseInt(String(project_id), 10) : undefined,
        item_type_id: item_type_id ? parseInt(String(item_type_id), 10) : undefined,
        type: type ? String(type) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });
      res.json({ success: true, reports: data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to generate audit ledger report' });
    }
  }

  public static async getProcurementDistribution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_id, search, health } = req.query;
      const data = await ReportService.getProcurementDistributionReport({
        project_id: project_id ? parseInt(String(project_id), 10) : undefined,
        search: search ? String(search) : undefined,
        health: health ? String(health) as any : undefined,
      });
      res.json({ success: true, report: data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to generate procurement distribution report' });
    }
  }

  public static async getProjectFinancialCosting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { project_id, search } = req.query;
      const data = await ReportService.getProjectFinancialCostingReport({
        project_id: project_id ? parseInt(String(project_id), 10) : undefined,
        search: search ? String(search) : undefined,
      });
      res.json({ success: true, report: data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to generate project financial costing report' });
    }
  }
}


