import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { checkDatabaseConnection, sequelize } from './config/database';
import { UserService } from './services/user.service';
import { MakeService } from './services/make.service';
import { UnitService } from './services/unit.service';
import { VendorService } from './services/vendor.service';
import { ItemDescriptionService } from './services/item-description.service';
import { TermsAndConditionsService } from './services/terms-and-conditions.service';
import { POService } from './services/po.service';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import makeRoutes from './routes/make.routes';
import unitRoutes from './routes/unit.routes';
import itemTypeRoutes from './routes/item-type.routes';
import vendorRoutes from './routes/vendor.routes';
import itemDescriptionRoutes from './routes/item-description.routes';
import termsAndConditionsRoutes from './routes/terms-and-conditions.routes';
import poRoutes from './routes/po.routes';
import poApproverRoutes from './routes/po-approver.routes';
import projectRoutes from './routes/project.routes';
import materialIssueRoutes from './routes/material-issue.routes';
import reportRoutes from './routes/report.routes';
import stockMovementRoutes from './routes/stock-movement.routes';
import dashboardRoutes from './routes/dashboard.routes';
import storageLocationRoutes from './routes/storage-location.routes';
import grnRoutes from './routes/grn.routes';
import inventoryRoutes from './routes/inventory.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Ravi Inventory Master API is active' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', makeRoutes);
app.use('/api', unitRoutes);
app.use('/api', itemTypeRoutes);
app.use('/api', vendorRoutes);
app.use('/api', itemDescriptionRoutes);
app.use('/api', termsAndConditionsRoutes);
app.use('/api', poRoutes);
app.use('/api', poApproverRoutes);
app.use('/api', projectRoutes);
app.use('/api', materialIssueRoutes);
app.use('/api', reportRoutes);
app.use('/api', stockMovementRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', storageLocationRoutes);
app.use('/api', inventoryRoutes);
app.use('/api/grn', grnRoutes);

// Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Ravi Inventory Master API is active' });
});

// Centralized Error Handling
app.use(errorHandler);

const startServer = async () => {
  try {
    console.log('Connecting to PostgreSQL via Sequelize...');
    const connected = await checkDatabaseConnection();

    if (connected) {
      console.log('Synchronizing Sequelize models with database...');
      try {
        await sequelize.sync({ alter: true });
        console.log('Sequelize models synchronized successfully.');
      } catch (syncErr) {
        console.warn('Sequelize alter sync warning (continuing server startup):', syncErr);
        await sequelize.sync();
      }

      // Execute SQL fixes for nullable columns to support general stock (null project_id) & optional storage binding
      const alterQueries = [
        'ALTER TABLE "goods_receipt_notes" ALTER COLUMN "project_id" DROP NOT NULL;',
        'ALTER TABLE "goods_receipt_notes" ALTER COLUMN "challan_no" DROP NOT NULL;',
        'ALTER TABLE "goods_receipt_notes" ALTER COLUMN "vehicle_no" DROP NOT NULL;',
        'ALTER TABLE "goods_receipt_notes" ALTER COLUMN "received_by_id" DROP NOT NULL;',
        'ALTER TABLE "goods_receipt_notes" ALTER COLUMN "remarks" DROP NOT NULL;',
        'ALTER TABLE "goods_receipt_note_items" ALTER COLUMN "po_item_id" DROP NOT NULL;',
        'ALTER TABLE "goods_receipt_note_items" ALTER COLUMN "shelf_id" DROP NOT NULL;',
        'ALTER TABLE "goods_receipt_note_items" ALTER COLUMN "rack_id" DROP NOT NULL;',
        'ALTER TABLE "goods_receipt_note_items" ALTER COLUMN "notes" DROP NOT NULL;',
        'ALTER TABLE "project_inventories" ALTER COLUMN "project_id" DROP NOT NULL;',
        'ALTER TABLE "project_inventories" ALTER COLUMN "shelf_id" DROP NOT NULL;',
        'ALTER TABLE "project_inventories" ALTER COLUMN "rack_id" DROP NOT NULL;',
        'ALTER TABLE "stock_movements" ALTER COLUMN "project_id" DROP NOT NULL;',
      ];

      for (const q of alterQueries) {
        try {
          await sequelize.query(q);
        } catch (qErr) {
          // Column may already be nullable, ignore error
        }
      }

      // Ensure default records exist
      try {
        await UserService.seedRolesAndAdmin();
        await UnitService.seedDefaultUnits();
        await MakeService.seedDefaultMakes();
        await VendorService.seedDefaultVendors();
        await ItemDescriptionService.seedDefaultItemDescriptions();
        await TermsAndConditionsService.seedDefaultTerms();
        await POService.seedDefaultPO();
      } catch (seedErr) {
        console.warn('Seeding warning:', seedErr);
      }
    } else {
      console.warn('Database connection failed. Please check PostgreSQL server settings.');
    }

    app.listen(env.port, '0.0.0.0', () => {
      console.log(`🚀 Backend Server listening on http://0.0.0.0:${env.port} (Inventory Master System Ready)`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
