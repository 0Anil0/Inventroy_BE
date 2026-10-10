import { sequelize } from '../src/config/database';
import {
  User,
  Role,
  Plant,
  UserPlant,
  ProjectInventory,
  InventoryLot,
  StockMovement,
  GoodsReceiptNote,
  GoodsReceiptNoteItem,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequisition,
  PurchaseRequisitionItem,
  ProjectAssignment,
  ProjectAssignmentItem,
  MaterialIssue,
  MaterialIssueItem,
} from '../src/models';

async function resetDBDataAndConfigurePlants() {
  try {
    console.log('🔄 Connecting to Database...');
    await sequelize.authenticate();
    console.log('✅ Connected to DB successfully.');

    await sequelize.transaction(async (t) => {
      // 1. Clear all PO, PR, GRN, Inventory and Stock Transactional Data
      console.log('🗑️ Clearing Material Issues...');
      await MaterialIssueItem.destroy({ where: {}, transaction: t });
      await MaterialIssue.destroy({ where: {}, transaction: t });

      console.log('🗑️ Clearing Project Assignments...');
      await ProjectAssignmentItem.destroy({ where: {}, transaction: t });
      await ProjectAssignment.destroy({ where: {}, transaction: t });

      console.log('🗑️ Clearing Stock Movements & Inventory Lots...');
      await StockMovement.destroy({ where: {}, transaction: t });
      await ProjectInventory.destroy({ where: {}, transaction: t });
      await InventoryLot.destroy({ where: {}, transaction: t });

      console.log('🗑️ Clearing Goods Receipt Notes (GRN)...');
      await GoodsReceiptNoteItem.destroy({ where: {}, transaction: t });
      await GoodsReceiptNote.destroy({ where: {}, transaction: t });

      console.log('🗑️ Clearing Purchase Orders (PO)...');
      await PurchaseOrderItem.destroy({ where: {}, transaction: t });
      await PurchaseOrder.destroy({ where: {}, transaction: t });

      console.log('🗑️ Clearing Purchase Requisitions (PR)...');
      await PurchaseRequisitionItem.destroy({ where: {}, transaction: t });
      await PurchaseRequisition.destroy({ where: {}, transaction: t });

      console.log('✅ All PO, PR, GRN & Inventory data successfully reset.');

      // 2. Ensure "Plant 1" and "Plant 2" exist
      console.log('⚙️ Checking / Creating Plant 1 and Plant 2...');
      
      let plant1 = await Plant.findOne({ where: { name: 'Plant 1' }, transaction: t });
      if (!plant1) {
        plant1 = await Plant.findOne({ where: { code: 'PLANT-1' }, transaction: t });
      }
      if (!plant1) {
        plant1 = await Plant.create({ name: 'Plant 1', code: 'PLANT-1', status: 'active' }, { transaction: t });
        console.log('  + Created Plant 1 (ID:', plant1.id, ')');
      } else {
        console.log('  - Existing Plant 1 (ID:', plant1.id, ')');
      }

      let plant2 = await Plant.findOne({ where: { name: 'Plant 2' }, transaction: t });
      if (!plant2) {
        plant2 = await Plant.findOne({ where: { code: 'PLANT-2' }, transaction: t });
      }
      if (!plant2) {
        plant2 = await Plant.create({ name: 'Plant 2', code: 'PLANT-2', status: 'active' }, { transaction: t });
        console.log('  + Created Plant 2 (ID:', plant2.id, ')');
      } else {
        console.log('  - Existing Plant 2 (ID:', plant2.id, ')');
      }

      // 3. Assign Plant 1 & Plant 2 to all non-admin users
      console.log('👥 Updating Plant assignments for Users...');
      const users = await User.findAll({
        include: [{ model: Role, as: 'role' }],
        transaction: t,
      });

      const allPlants = await Plant.findAll({ transaction: t });
      const targetPlantIds = [plant1.id, plant2.id];

      for (const user of users) {
        const isUserAdmin = user.username.toLowerCase() === 'admin';

        if (isUserAdmin) {
          // Admin gets access to all plants
          await UserPlant.destroy({ where: { user_id: user.id }, transaction: t });
          for (const p of allPlants) {
            await UserPlant.create({ user_id: user.id, plant_id: p.id }, { transaction: t });
          }
          console.log(`  👑 Admin User "${user.username}" assigned all ${allPlants.length} plants.`);
        } else {
          // All other users get access only to Plant 1 and Plant 2
          await UserPlant.destroy({ where: { user_id: user.id }, transaction: t });
          for (const pid of targetPlantIds) {
            await UserPlant.create({ user_id: user.id, plant_id: pid }, { transaction: t });
          }
          console.log(`  👤 User "${user.username}" (Role: ${user.role?.name || 'N/A'}) assigned ONLY to Plant 1 & Plant 2.`);
        }
      }
    });

    console.log('\n🎉 DB reset and Plant configuration completed successfully!');
  } catch (err) {
    console.error('❌ Error during database reset and plant assignment:', err);
  } finally {
    process.exit(0);
  }
}

resetDBDataAndConfigurePlants();
