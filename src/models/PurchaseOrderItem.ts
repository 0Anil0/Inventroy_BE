import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ItemType } from './ItemType';

export interface PurchaseOrderItemAttributes {
  id: number;
  po_id: number;
  item_type_id: number;
  ordered_qty: number;
  received_qty?: number;
  unit_price?: number;
  total_price?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PurchaseOrderItemCreationAttributes
  extends Optional<PurchaseOrderItemAttributes, 'id' | 'received_qty' | 'unit_price' | 'total_price'> {}

export class PurchaseOrderItem
  extends Model<PurchaseOrderItemAttributes, PurchaseOrderItemCreationAttributes>
  implements PurchaseOrderItemAttributes
{
  declare public id: number;
  declare public po_id: number;
  declare public item_type_id: number;
  declare public ordered_qty: number;
  declare public received_qty: number;
  declare public unit_price: number;
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
