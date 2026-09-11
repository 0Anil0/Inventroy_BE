import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/reports/stock-summary', ReportController.getStockSummary);
router.get('/reports/purchase-orders', ReportController.getPurchaseOrders);
router.get('/reports/material-issues', ReportController.getMaterialIssues);
router.get('/reports/stock-transfers', ReportController.getStockTransfers);
router.get('/reports/audit-ledger', ReportController.getAuditLedger);
router.get('/reports/procurement-distribution', ReportController.getProcurementDistribution);
router.get('/reports/project-costing', ReportController.getProjectFinancialCosting);

export default router;


