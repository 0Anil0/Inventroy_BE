import { sequelize, checkDatabaseConnection } from '../config/database';
import { InventoryService } from '../services/inventory.service';

const runReset = async () => {
  try {
    console.log('Connecting to DB for data reset...');
    await checkDatabaseConnection();
    const result = await InventoryService.clearTransactionalData();
    console.log('✅ CLEANUP COMPLETE:', result.message);
    process.exit(0);
  } catch (err) {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  }
};

runReset();
