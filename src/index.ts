import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { checkDatabaseConnection, sequelize } from './config/database';
import { UserService } from './services/user.service';
import { MakeService } from './services/make.service';
import { UnitService } from './services/unit.service';
import { VendorService } from './services/vendor.service';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import makeRoutes from './routes/make.routes';
import unitRoutes from './routes/unit.routes';
import itemTypeRoutes from './routes/item-type.routes';
import vendorRoutes from './routes/vendor.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', makeRoutes);
app.use('/api', unitRoutes);
app.use('/api', itemTypeRoutes);
app.use('/api', vendorRoutes);

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
      await sequelize.sync({ alter: true });
      console.log('Sequelize models synchronized successfully.');

      // Ensure default records exist
      await UserService.seedRolesAndAdmin();
      await UnitService.seedDefaultUnits();
      await MakeService.seedDefaultMakes();
      await VendorService.seedDefaultVendors();
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
