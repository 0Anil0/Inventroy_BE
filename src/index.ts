import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { checkDatabaseConnection, sequelize } from './config/database';
import { UserService } from './services/user.service';
import { ItemTypeService } from './services/item-type.service';
import { ProjectService } from './services/project.service';
import { InventoryService } from './services/inventory.service';
import { UnitService } from './services/unit.service';
import { VendorService } from './services/vendor.service';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import itemTypeRoutes from './routes/item-type.routes';
import projectRoutes from './routes/project.routes';
import inventoryRoutes from './routes/inventory.routes';
import unitRoutes from './routes/unit.routes';
import dashboardRoutes from './routes/dashboard.routes';
import stockMovementRoutes from './routes/stock-movement.routes';
import vendorRoutes from './routes/vendor.routes';
import poRoutes from './routes/po.routes';
import materialIssueRoutes from './routes/material-issue.routes';
import reportRoutes from './routes/report.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', itemTypeRoutes);
app.use('/api', projectRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', unitRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', stockMovementRoutes);
app.use('/api', vendorRoutes);
app.use('/api', poRoutes);
app.use('/api', materialIssueRoutes);
app.use('/api', reportRoutes);

// Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Ravi Inventory Backend API is active' });
});

// Centralized Error Handling
app.use(errorHandler);

const startServer = async () => {
  try {
    console.log('Connecting to PostgreSQL via Sequelize...');
    const connected = await checkDatabaseConnection();

    if (connected) {
      console.log('Synchronizing Sequelize models with database...');
      await sequelize.sync({ alter: true });
      console.log('Sequelize models synchronized successfully.');

      try {
        await sequelize.query('ALTER TABLE stock_movements ALTER COLUMN project_id DROP NOT NULL;');
      } catch (e) {
        // Column may already be nullable
      }

      // Ensure roles and admin account exist
      await UserService.seedRolesAndAdmin();
    } else {
      console.warn('Database connection failed. Please check PostgreSQL server settings.');
    }

    app.listen(env.port, '0.0.0.0', () => {
      console.log(`🚀 Backend Server listening on http://0.0.0.0:${env.port} (Network Access Ready)`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
