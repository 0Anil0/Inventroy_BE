import { Pool } from 'pg';
import { config } from '../config';

export const pool = new Pool(config.db);

export const checkDbConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database:', config.db.database);
    client.release();
    return true;
  } catch (error) {
    console.error('Error connecting to PostgreSQL database:', error);
    return false;
  }
};
