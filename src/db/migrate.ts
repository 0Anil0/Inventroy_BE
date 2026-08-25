import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pool } from './index';

export const getEncryptedPasswordPayload = (plainText: string): string => {
  return crypto.createHash('sha256').update(plainText).digest('hex');
};

export const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    const migrationPath = path.join(__dirname, '../migrations/001_create_users_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(sql);
    console.log('Migration 001_create_users_table.sql applied successfully.');

    // Seed/Update Admin User password_hash with encrypted payload hash
    const adminCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    const sha256Password = getEncryptedPasswordPayload('admin123');
    const hashedPassword = await bcrypt.hash(sha256Password, 10);

    if (adminCheck.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['admin', 'admin@inventory.local', hashedPassword, 'admin']
      );
      console.log('Seeded default admin user (username: admin, password: admin123).');
    } else {
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE username = $2',
        [hashedPassword, 'admin']
      );
      console.log('Updated admin user password hash for encrypted payload compatibility.');
    }
  } catch (error) {
    console.error('Error running database migrations:', error);
    throw error;
  }
};

// Allow standalone execution
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
