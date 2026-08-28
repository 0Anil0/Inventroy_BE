import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Vendor } from './Vendor';
import { Project } from './Project';
import { PurchaseOrderItem } from './PurchaseOrderItem';

export interface PurchaseOrderAttributes {
  id: number;
  po_number: string;
  vendor_id: number;
  project_id?: number | null;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  total_amount?: number;
  order_date?: Date;
  expected_date?: Date | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PurchaseOrderCreationAttributes
  extends Optional<
    PurchaseOrderAttributes,
    'id' | 'project_id' | 'status' | 'total_amount' | 'order_date' | 'expected_date' | 'notes'
  > {}

export class PurchaseOrder
  extends Model<PurchaseOrderAttributes, PurchaseOrderCreationAttributes>
  implements PurchaseOrderAttributes
{
  declare public id: number;
  declare public po_number: string;
  declare public vendor_id: number;
  declare public project_id: number | null;
  declare public status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  declare public total_amount: number;
  declare public order_date: Date;
  declare public expected_date: Date | null;
  declare public notes: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly vendor?: Vendor;
  declare public readonly project?: Project;
  declare public readonly items?: PurchaseOrderItem[];
}

PurchaseOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    po_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vendors',
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
    status: {
      type: DataTypes.ENUM('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'ORDERED',
    },
    total_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expected_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'purchase_orders',
    timestamps: true,
    underscored: true,
  }
);
