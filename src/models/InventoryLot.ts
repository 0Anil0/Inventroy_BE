import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ItemType } from './ItemType';
import { PurchaseOrder } from './PurchaseOrder';
import { PurchaseOrderItem } from './PurchaseOrderItem';
import { GoodsReceiptNote } from './GoodsReceiptNote';
import { Project } from './Project';
import { StorageShelf } from './StorageShelf';
import { StorageRack } from './StorageRack';

export interface InventoryLotAttributes {
  id: number;
  item_type_id: number;
  po_id?: number | null;
  po_item_id?: number | null;
  grn_id?: number | null;
  project_id?: number | null; // null or 0 = General Stock, >0 = Target Project Stock
  unit_price: number; // Purchase rate per unit
  received_qty: number;
  available_qty: number;
  assigned_qty: number;
  shelf_id?: number | null;
  rack_id?: number | null;
  lot_number?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InventoryLotCreationAttributes
  extends Optional<
    InventoryLotAttributes,
    'id' | 'po_id' | 'po_item_id' | 'grn_id' | 'project_id' | 'shelf_id' | 'rack_id' | 'lot_number' | 'assigned_qty'
  > {}

export class InventoryLot
  extends Model<InventoryLotAttributes, InventoryLotCreationAttributes>
  implements InventoryLotAttributes
{
  declare public id: number;
  declare public item_type_id: number;
  declare public po_id: number | null;
  declare public po_item_id: number | null;
  declare public grn_id: number | null;
  declare public project_id: number | null;
  declare public unit_price: number;
  declare public received_qty: number;
  declare public available_qty: number;
  declare public assigned_qty: number;
  declare public shelf_id: number | null;
  declare public rack_id: number | null;
  declare public lot_number: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly item_type?: ItemType;
  declare public readonly purchase_order?: PurchaseOrder;
  declare public readonly po_item?: PurchaseOrderItem;
  declare public readonly grn?: GoodsReceiptNote;
  declare public readonly project?: Project;
  declare public readonly shelf?: StorageShelf;
  declare public readonly rack?: StorageRack;
}

InventoryLot.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    item_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'item_types',
        key: 'id',
      },
    },
    po_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'purchase_orders',
        key: 'id',
      },
    },
    po_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'purchase_order_items',
        key: 'id',
      },
    },
    grn_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'goods_receipt_notes',
        key: 'id',
      },
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    unit_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    received_qty: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    available_qty: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    assigned_qty: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    shelf_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'storage_shelves',
        key: 'id',
      },
    },
    rack_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'storage_racks',
        key: 'id',
      },
    },
    lot_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'inventory_lots',
    timestamps: true,
    underscored: true,
  }
);
