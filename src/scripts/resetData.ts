import {
  sequelize,
  MaterialIssueItem,
  MaterialIssue,
  PurchaseOrderItem,
  PurchaseOrder,
  StockMovement,
  ProjectInventory,
  Vendor,
  ItemType,
  Unit,
  Project,
} from '../models';

export const resetData = async () => {
  try {
    console.log('🔄 Cleaning database: Removing all sample materials, POs, material issues, vendors, inventory, and projects...');

    await MaterialIssueItem.destroy({ where: {}, truncate: true, cascade: true });
    await MaterialIssue.destroy({ where: {}, truncate: true, cascade: true });
    await PurchaseOrderItem.destroy({ where: {}, truncate: true, cascade: true });
    await PurchaseOrder.destroy({ where: {}, truncate: true, cascade: true });
    await StockMovement.destroy({ where: {}, truncate: true, cascade: true });
    await ProjectInventory.destroy({ where: {}, truncate: true, cascade: true });
    await Vendor.destroy({ where: {}, truncate: true, cascade: true });
    await ItemType.destroy({ where: {}, truncate: true, cascade: true });
    await Unit.destroy({ where: {}, truncate: true, cascade: true });
    await Project.destroy({ where: {}, truncate: true, cascade: true });

    console.log('✅ Database cleaned successfully! All sample data wiped. Ready for fresh step-by-step entry.');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
};

if (require.main === module) {
  resetData().then(() => process.exit(0));
}
