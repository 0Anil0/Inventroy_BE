import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { checkDatabaseConnection, sequelize } from './config/database';
import { UserService } from './services/user.service';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// API Routes - ONLY Auth & User Management
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);

// Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'User Management API is active' });
});

// Centralized Error Handling
app.use(errorHandler);

const startServer = async () => {
  try {
    console.log('Connecting to PostgreSQL via Sequelize...');
    const connected = await checkDatabaseConnection();

    if (connected) {
      console.log('Cleaning up unused tables in PostgreSQL database...');
      try {
        await sequelize.query(`
          DROP TABLE IF EXISTS purchase_order_items CASCADE;
          DROP TABLE IF EXISTS purchase_orders CASCADE;
          DROP TABLE IF EXISTS material_issue_items CASCADE;
          DROP TABLE IF EXISTS material_issues CASCADE;
          DROP TABLE IF EXISTS stock_movements CASCADE;
          DROP TABLE IF EXISTS project_inventories CASCADE;
          DROP TABLE IF EXISTS item_types CASCADE;
          DROP TABLE IF EXISTS units CASCADE;
          DROP TABLE IF EXISTS vendors CASCADE;
          DROP TABLE IF EXISTS projects CASCADE;
        `);
        console.log('Unused tables successfully dropped.');
      } catch (err: any) {
        console.warn('Notice while dropping tables:', err.message);
      }

      console.log('Synchronizing User & Role models with database...');
      await sequelize.sync({ alter: true });
      console.log('User & Role models synchronized successfully.');

      // Ensure roles and admin account exist
      await UserService.seedRolesAndAdmin();
    } else {
      console.warn('Database connection failed. Please check PostgreSQL server settings.');
    }

    app.listen(env.port, '0.0.0.0', () => {
      console.log(`🚀 Backend Server listening on http://0.0.0.0:${env.port} (User Management Ready)`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
