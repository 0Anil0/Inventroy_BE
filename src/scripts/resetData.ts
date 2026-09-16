import { sequelize, checkDatabaseConnection } from '../config/database';
import { ItemType } from '../models';

const runReset = async () => {
  try {
    console.log('Connecting to DB for hard truncation...');
    await checkDatabaseConnection();

    const tablesToTruncate = [
      'purchase_requisition_items',
      'purchase_requisitions',
      'purchase_order_items',
      'purchase_orders',
      'goods_receipt_note_items',
      'goods_receipt_notes',
      'material_issue_items',
      'material_issues',
      'project_assignment_items',
      'project_assignments',
      'stock_movements',
      'project_inventories',
    ];

    for (const table of tablesToTruncate) {
      try {
        await sequelize.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
        console.log(`TRUNCATED: ${table}`);
      } catch (err: any) {
        console.warn(`Could not truncate ${table}:`, err.message);
      }
    }

    // Reset ItemType total_quantity to 0
    await ItemType.update({ total_quantity: 0 }, { where: {} });

    console.log('✅ HARD TRUNCATE COMPLETE: All transactional tables purged and identity sequences restarted to 1.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  }
};

runReset();
