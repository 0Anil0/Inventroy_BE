import { Sequelize } from 'sequelize';
import { env } from './env';

export const sequelize = new Sequelize(
  env.db.name,
  env.db.user,
  env.db.password,
  {
    host: env.db.host,
    port: env.db.port,
    dialect: 'postgres',
    logging: false, // Set to console.log for SQL query debugging
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log(`Successfully connected to PostgreSQL via Sequelize ORM (${env.db.name})`);
    return true;
  } catch (error) {
    console.error('Unable to connect to PostgreSQL database via Sequelize:', error);
    return false;
  }
};
