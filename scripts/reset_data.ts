import { sequelize } from '../src/config/database';
import { ProjectInventory } from '../src/models/ProjectInventory';
import { InventoryLot } from '../src/models/InventoryLot';
import { StockMovement } from '../src/models/StockMovement';
import { GoodsReceiptNote } from '../src/models/GoodsReceiptNote';
import { GoodsReceiptNoteItem } from '../src/models/GoodsReceiptNoteItem';
import { PurchaseOrder } from '../src/models/PurchaseOrder';
import { PurchaseOrderItem } from '../src/models/PurchaseOrderItem';
import { PurchaseRequisition } from '../src/models/PurchaseRequisition';
import { PurchaseRequisitionItem } from '../src/models/PurchaseRequisitionItem';
import { ProjectAssignment } from '../src/models/ProjectAssignment';
import { ProjectAssignmentItem } from '../src/models/ProjectAssignmentItem';
import { MaterialIssue } from '../src/models/MaterialIssue';
import { MaterialIssueItem } from '../src/models/MaterialIssueItem';

async function resetData() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    await sequelize.transaction(async (t) => {
      // Clear all transactional records
      await MaterialIssueItem.destroy({ where: {}, transaction: t, cascade: true });
      await MaterialIssue.destroy({ where: {}, transaction: t, cascade: true });
      await ProjectAssignmentItem.destroy({ where: {}, transaction: t, cascade: true });
      await ProjectAssignment.destroy({ where: {}, transaction: t, cascade: true });
      await StockMovement.destroy({ where: {}, transaction: t, cascade: true });
      await ProjectInventory.destroy({ where: {}, transaction: t, cascade: true });
      await InventoryLot.destroy({ where: {}, transaction: t, cascade: true });
      await GoodsReceiptNoteItem.destroy({ where: {}, transaction: t, cascade: true });
      await GoodsReceiptNote.destroy({ where: {}, transaction: t, cascade: true });
      await PurchaseOrderItem.destroy({ where: {}, transaction: t, cascade: true });
      await PurchaseOrder.destroy({ where: {}, transaction: t, cascade: true });
      await PurchaseRequisitionItem.destroy({ where: {}, transaction: t, cascade: true });
      await PurchaseRequisition.destroy({ where: {}, transaction: t, cascade: true });
      
      console.log('All transactional data has been successfully cleared!');
    });

  } catch (err) {
    console.error('Failed to reset data:', err);
  } finally {
    process.exit(0);
  }
}

resetData();
