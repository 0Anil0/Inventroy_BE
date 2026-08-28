import { sequelize } from '../config/database';
import { Role } from './Role';
import { User } from './User';
import { ItemType } from './ItemType';
import { Project } from './Project';
import { ProjectInventory } from './ProjectInventory';
import { Unit } from './Unit';
import { StockMovement } from './StockMovement';
import { Vendor } from './Vendor';
import { PurchaseOrder } from './PurchaseOrder';
import { PurchaseOrderItem } from './PurchaseOrderItem';
import { MaterialIssue } from './MaterialIssue';
import { MaterialIssueItem } from './MaterialIssueItem';

// User & Role Associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// Project & Inventory Associations
Project.hasMany(ProjectInventory, { foreignKey: 'project_id', as: 'inventories' });
ProjectInventory.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// ItemType & Inventory Associations
ItemType.hasMany(ProjectInventory, { foreignKey: 'item_type_id', as: 'inventories' });
ProjectInventory.belongsTo(ItemType, { foreignKey: 'item_type_id', as: 'item_type' });

// Unit & ItemType Associations
Unit.hasMany(ItemType, { foreignKey: 'unit_id', as: 'item_types' });
ItemType.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit_details' });

// StockMovement Associations
StockMovement.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
StockMovement.belongsTo(ItemType, { foreignKey: 'item_type_id', as: 'item_type' });
StockMovement.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Project.hasMany(StockMovement, { foreignKey: 'project_id', as: 'stock_movements' });
ItemType.hasMany(StockMovement, { foreignKey: 'item_type_id', as: 'stock_movements' });
User.hasMany(StockMovement, { foreignKey: 'user_id', as: 'stock_movements' });

// Vendor Associations
Vendor.hasMany(PurchaseOrder, { foreignKey: 'vendor_id', as: 'purchase_orders' });
PurchaseOrder.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

// PurchaseOrder Associations
PurchaseOrder.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Project.hasMany(PurchaseOrder, { foreignKey: 'project_id', as: 'purchase_orders' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'po_id', as: 'items' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchase_order' });

ItemType.hasMany(PurchaseOrderItem, { foreignKey: 'item_type_id', as: 'po_items' });
PurchaseOrderItem.belongsTo(ItemType, { foreignKey: 'item_type_id', as: 'item_type' });

// MaterialIssue Associations
MaterialIssue.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Project.hasMany(MaterialIssue, { foreignKey: 'project_id', as: 'material_issues' });

MaterialIssue.belongsTo(User, { foreignKey: 'issued_by_user_id', as: 'user' });
User.hasMany(MaterialIssue, { foreignKey: 'issued_by_user_id', as: 'material_issues' });

MaterialIssue.hasMany(MaterialIssueItem, { foreignKey: 'material_issue_id', as: 'items' });
MaterialIssueItem.belongsTo(MaterialIssue, { foreignKey: 'material_issue_id', as: 'material_issue' });

ItemType.hasMany(MaterialIssueItem, { foreignKey: 'item_type_id', as: 'issue_items' });
MaterialIssueItem.belongsTo(ItemType, { foreignKey: 'item_type_id', as: 'item_type' });

export {
  sequelize,
  Role,
  User,
  ItemType,
  Project,
  ProjectInventory,
  Unit,
  StockMovement,
  Vendor,
  PurchaseOrder,
  PurchaseOrderItem,
  MaterialIssue,
  MaterialIssueItem,
};
