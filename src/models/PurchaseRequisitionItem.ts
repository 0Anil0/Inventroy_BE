import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ItemType } from './ItemType';

export interface PurchaseRequisitionItemAttributes {
  id: number;
  pr_id: number;
  item_type_id: number;
  cat_no?: string | null;
  make?: string | null;
  hsn_code?: string | null;
  requested_qty: number;
  allowed_po_qty?: number | null;
  converted_po_qty?: number | null;
  estimated_unit_price?: number | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PurchaseRequisitionItemCreationAttributes
  extends Optional<
    PurchaseRequisitionItemAttributes,
    | 'id'
    | 'cat_no'
    | 'make'
    | 'hsn_code'
    | 'allowed_po_qty'
    | 'converted_po_qty'
    | 'estimated_unit_price'
    | 'notes'
  > {}

export class PurchaseRequisitionItem
  extends Model<PurchaseRequisitionItemAttributes, PurchaseRequisitionItemCreationAttributes>
  implements PurchaseRequisitionItemAttributes
{
  declare public id: number;
  declare public pr_id: number;
  declare public item_type_id: number;
  declare public cat_no: string | null;
  declare public make: string | null;
  declare public hsn_code: string | null;
  declare public requested_qty: number;
  declare public allowed_po_qty: number | null;
  declare public converted_po_qty: number | null;
  declare public estimated_unit_price: number | null;
  declare public notes: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly item_type?: ItemType;
}

PurchaseRequisitionItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    pr_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'purchase_requisitions',
        key: 'id',
      },
      onDelete: 'CASCADE',
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
    hsn_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    requested_qty: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    allowed_po_qty: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    converted_po_qty: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    estimated_unit_price: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'purchase_requisition_items',
    timestamps: true,
    underscored: true,
  }
);
