import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { GoodsReceiptNote } from './GoodsReceiptNote';
import { PurchaseOrderItem } from './PurchaseOrderItem';
import { ItemType } from './ItemType';
import { StorageShelf } from './StorageShelf';
import { StorageRack } from './StorageRack';

export interface GoodsReceiptNoteItemAttributes {
  id: number;
  grn_id: number;
  po_item_id?: number | null;
  item_type_id: number;
  received_qty: number;
  shelf_id?: number | null;
  rack_id?: number | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GoodsReceiptNoteItemCreationAttributes
  extends Optional<GoodsReceiptNoteItemAttributes, 'id' | 'po_item_id' | 'shelf_id' | 'rack_id' | 'notes'> {}

export class GoodsReceiptNoteItem
  extends Model<GoodsReceiptNoteItemAttributes, GoodsReceiptNoteItemCreationAttributes>
  implements GoodsReceiptNoteItemAttributes
{
  declare public id: number;
  declare public grn_id: number;
  declare public po_item_id: number | null;
  declare public item_type_id: number;
  declare public received_qty: number;
  declare public shelf_id: number | null;
  declare public rack_id: number | null;
  declare public notes: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly grn?: GoodsReceiptNote;
  declare public readonly po_item?: PurchaseOrderItem;
  declare public readonly item_type?: ItemType;
  declare public readonly shelf?: StorageShelf;
  declare public readonly rack?: StorageRack;
}

GoodsReceiptNoteItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    grn_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'goods_receipt_notes',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    po_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'purchase_order_items',
        key: 'id',
      },
    },
    item_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'item_types',
        key: 'id',
      },
    },
    received_qty: {
      type: DataTypes.FLOAT,
      allowNull: false,
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
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'goods_receipt_note_items',
    timestamps: true,
    underscored: true,
  }
);
