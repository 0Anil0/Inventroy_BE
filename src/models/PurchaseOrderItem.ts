import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ItemType } from './ItemType';

export interface PurchaseOrderItemAttributes {
  id: number;
  po_id: number;
  item_type_id: number;
  cat_no?: string | null;
  make?: string | null;
  rating?: string | null;
  ordered_qty: number;
  received_qty?: number;
  unit_price?: number;
  discount_percent?: number;
  gst_percent?: number;
  tax_amount?: number;
  total_price?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PurchaseOrderItemCreationAttributes
  extends Optional<
    PurchaseOrderItemAttributes,
    'id' | 'received_qty' | 'unit_price' | 'discount_percent' | 'gst_percent' | 'tax_amount' | 'total_price'
  > {}

export class PurchaseOrderItem
  extends Model<PurchaseOrderItemAttributes, PurchaseOrderItemCreationAttributes>
  implements PurchaseOrderItemAttributes
{
  declare public id: number;
  declare public po_id: number;
  declare public item_type_id: number;
  declare public cat_no: string | null;
  declare public make: string | null;
  declare public rating: string | null;
  declare public ordered_qty: number;
  declare public received_qty: number;
  declare public unit_price: number;
  declare public discount_percent: number;
  declare public gst_percent: number;
  declare public tax_amount: number;
  declare public total_price: number;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly item_type?: ItemType;
}

PurchaseOrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    po_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'purchase_orders',
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
    cat_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    make: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    rating: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    ordered_qty: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    received_qty: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    unit_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    discount_percent: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    gst_percent: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 18,
    },
    tax_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    total_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'purchase_order_items',
    timestamps: true,
    underscored: true,
  }
);
