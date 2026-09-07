import { pool } from '../db';

async function fix() {
  try {
    console.log('Fixing purchase_orders status column in PostgreSQL...');
    await pool.query(`
      ALTER TABLE purchase_orders ALTER COLUMN status DROP DEFAULT;
      ALTER TABLE purchase_orders ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
      ALTER TABLE purchase_orders ALTER COLUMN status SET DEFAULT 'PENDING_APPROVAL';
    `);
    console.log('Successfully altered status column to VARCHAR(50).');
  } catch (err) {
    console.error('Error fixing status column:', err);
  } finally {
    process.exit(0);
  }
}

fix();
