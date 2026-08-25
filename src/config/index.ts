import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.BE_PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'ravi_inventory_secret_jwt_key_2026',
  jwtExpiresIn: '7d',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'est',
    database: process.env.DB_NAME || 'Inventory_Management',
  },
};
