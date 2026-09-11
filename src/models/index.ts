import { sequelize } from '../config/database';
import { Role } from './Role';
import { User } from './User';
import { Make } from './Make';
import { Unit } from './Unit';
import { ItemType } from './ItemType';
import { Vendor } from './Vendor';
import { ItemDescription } from './ItemDescription';
import { TermsAndConditions } from './TermsAndConditions';
import { Project } from './Project';
import { ProjectInventory } from './ProjectInventory';
import { StockMovement } from './StockMovement';
import { PurchaseOrder } from './PurchaseOrder';
import { PurchaseOrderItem } from './PurchaseOrderItem';
import { MaterialIssue } from './MaterialIssue';
import { MaterialIssueItem } from './MaterialIssueItem';
import { POApprover } from './POApprover';
import { StorageShelf } from './StorageShelf';
import { StorageRack } from './StorageRack';
import { GoodsReceiptNote } from './GoodsReceiptNote';
import { GoodsReceiptNoteItem } from './GoodsReceiptNoteItem';
import { ProjectAssignment } from './ProjectAssignment';
import { ProjectAssignmentItem } from './ProjectAssignmentItem';
import { PurchaseRequisition } from './PurchaseRequisition';
import { PurchaseRequisitionItem } from './PurchaseRequisitionItem';

// User & Role Associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// Storage Location Associations
StorageShelf.hasMany(StorageRack, { foreignKey: 'shelf_id', as: 'racks', onDelete: 'CASCADE' });
StorageRack.belongsTo(StorageShelf, { foreignKey: 'shelf_id', as: 'shelf' });

// PO Approver Associations
POApprover.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(POApprover, { foreignKey: 'user_id', as: 'po_approver' });

// Make & ItemType Associations
Make.hasMany(ItemType, { foreignKey: 'make_id', as: 'items' });
ItemType.belongsTo(Make, { foreignKey: 'make_id', as: 'make_details' });

// Unit & ItemType Associations
Unit.hasMany(ItemType, { foreignKey: 'unit_id', as: 'item_types' });
ItemType.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit_details' });

// Purchase Requisition Associations
PurchaseRequisition.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Project.hasMany(PurchaseRequisition, { foreignKey: 'project_id', as: 'purchase_requisitions' });

PurchaseRequisition.belongsTo(User, { foreignKey: 'requested_by_id', as: 'requested_by_user' });
PurchaseRequisition.belongsTo(User, { foreignKey: 'reviewed_by_id', as: 'reviewed_by_user' });

PurchaseRequisition.hasMany(PurchaseRequisitionItem, { foreignKey: 'pr_id', as: 'items', onDelete: 'CASCADE' });
PurchaseRequisitionItem.belongsTo(PurchaseRequisition, { foreignKey: 'pr_id', as: 'requisition' });

PurchaseRequisitionItem.belongsTo(ItemType, { foreignKey: 'item_type_id', as: 'item_type' });
ItemType.hasMany(PurchaseRequisitionItem, { foreignKey: 'item_type_id', as: 'pr_items' });

// Purchase Order Associations
PurchaseOrder.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
Vendor.hasMany(PurchaseOrder, { foreignKey: 'vendor_id', as: 'purchase_orders' });

PurchaseOrder.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Project.hasMany(PurchaseOrder, { foreignKey: 'project_id', as: 'purchase_orders' });

// Project Parent-Child Hierarchy Associations
Project.belongsTo(Project, { foreignKey: 'parent_id', as: 'parent' });
Project.hasMany(Project, { foreignKey: 'parent_id', as: 'sub_projects' });

PurchaseOrder.belongsTo(TermsAndConditions, { foreignKey: 'terms_and_conditions_id', as: 'terms_and_conditions' });
TermsAndConditions.hasMany(PurchaseOrder, { foreignKey: 'terms_and_conditions_id', as: 'purchase_orders' });

PurchaseOrder.belongsTo(User, { foreignKey: 'created_by_id', as: 'created_by_user' });
PurchaseOrder.belongsTo(User, { foreignKey: 'approved_by_id', as: 'approved_by_user' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'po_id', as: 'items' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchase_order' });

PurchaseOrderItem.belongsTo(ItemType, { foreignKey: 'item_type_id', as: 'item_type' });
ItemType.hasMany(PurchaseOrderItem, { foreignKey: 'item_type_id', as: 'po_items' });

// Goods Receipt Note (GRN) Associations
GoodsReceiptNote.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchase_order' });
PurchaseOrder.hasMany(GoodsReceiptNote, { foreignKey: 'po_id', as: 'grns' });

GoodsReceiptNote.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Project.hasMany(GoodsReceiptNote, { foreignKey: 'project_id', as: 'grns' });

GoodsReceiptNote.belongsTo(User, { foreignKey: 'received_by_id', as: 'received_by_user' });

GoodsReceiptNote.hasMany(GoodsReceiptNoteItem, { foreignKey: 'grn_id', as: 'items', onDelete: 'CASCADE' });
GoodsReceiptNoteItem.belongsTo(GoodsReceiptNote, { foreignKey: 'grn_id', as: 'grn' });

GoodsReceiptNoteItem.belongsTo(PurchaseOrderItem, { foreignKey: 'po_item_id', as: 'po_item' });
GoodsReceiptNoteItem.belongsTo(ItemType, { foreignKey: 'item_type_id', as: 'item_type' });
GoodsReceiptNoteItem.belongsTo(StorageShelf, { foreignKey: 'shelf_id', as: 'shelf' });
GoodsReceiptNoteItem.belongsTo(StorageRack, { foreignKey: 'rack_id', as: 'rack' });

// Project Inventory Associations
ProjectInventory.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Project.hasMany(ProjectInventory, { foreignKey: 'project_id', as: 'inventory' });

ProjectInventory.belongsTo(ItemType, { foreignKey: 'item_type_id', as: 'item_type' });
ItemType.hasMany(ProjectInventory, { foreignKey: 'item_type_id', as: 'project_inventories' });

ProjectInventory.belongsTo(StorageShelf, { foreignKey: 'shelf_id', as: 'shelf' });
ProjectInventory.belongsTo(StorageRack, { foreignKey: 'rack_id', as: 'rack' });

// Stock Movement Associations
StockMovement.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
StockMovement.belongsTo(ItemType, { foreignKey: 'item_type_id', as: 'item_type' });
StockMovement.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Material Issue Associations
MaterialIssue.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
MaterialIssue.belongsTo(User, { foreignKey: 'issued_by_user_id', as: 'user' });
MaterialIssue.hasMany(MaterialIssueItem, { foreignKey: 'material_issue_id', as: 'items' });
MaterialIssueItem.belongsTo(MaterialIssue, { foreignKey: 'material_issue_id', as: 'material_issue' });
MaterialIssueItem.belongsTo(ItemType, { foreignKey: 'item_type_id', as: 'item_type' });

// Project Assignment Associations
ProjectAssignment.belongsTo(Project, { foreignKey: 'to_project_id', as: 'to_project' });
ProjectAssignment.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'user' });
ProjectAssignment.hasMany(ProjectAssignmentItem, { foreignKey: 'assignment_id', as: 'items', onDelete: 'CASCADE' });
ProjectAssignmentItem.belongsTo(ProjectAssignment, { foreignKey: 'assignment_id', as: 'assignment' });
ProjectAssignmentItem.belongsTo(ItemType, { foreignKey: 'item_type_id', as: 'item_type' });

export {
  sequelize,
  Role,
  User,
  Make,
  Unit,
  ItemType,
  Vendor,
  ItemDescription,
  TermsAndConditions,
  Project,
  ProjectInventory,
  StockMovement,
  PurchaseOrder,
  PurchaseOrderItem,
  MaterialIssue,
  MaterialIssueItem,
  POApprover,
  StorageShelf,
  StorageRack,
  GoodsReceiptNote,
  GoodsReceiptNoteItem,
  ProjectAssignment,
  ProjectAssignmentItem,
  PurchaseRequisition,
  PurchaseRequisitionItem,
};
