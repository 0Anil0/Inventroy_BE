import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Vendor } from './Vendor';
import { Project } from './Project';
import { PurchaseOrderItem } from './PurchaseOrderItem';
import { User } from './User';

export type POStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED' | 'REJECTED';

export interface PurchaseOrderAttributes {
  id: number;
  po_number: string;
  vendor_id: number;
  project_id?: number | null;
  terms_and_conditions_id?: number | null;
  created_by_id?: number | null;
  approved_by_id?: number | null;
  approved_at?: Date | null;
  rejected_by_id?: number | null;
  rejected_at?: Date | null;
  rejection_reason?: string | null;
  status: POStatus;
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
    | 'id'
    | 'project_id'
    | 'terms_and_conditions_id'
    | 'created_by_id'
    | 'approved_by_id'
    | 'approved_at'
    | 'rejected_by_id'
    | 'rejected_at'
    | 'rejection_reason'
    | 'status'
    | 'total_amount'
    | 'order_date'
    | 'expected_date'
    | 'notes'
  > {}

export class PurchaseOrder
  extends Model<PurchaseOrderAttributes, PurchaseOrderCreationAttributes>
  implements PurchaseOrderAttributes
{
  declare public id: number;
  declare public po_number: string;
  declare public vendor_id: number;
  declare public project_id: number | null;
  declare public terms_and_conditions_id: number | null;
  declare public created_by_id: number | null;
  declare public approved_by_id: number | null;
  declare public approved_at: Date | null;
  declare public rejected_by_id: number | null;
  declare public rejected_at: Date | null;
  declare public rejection_reason: string | null;
  declare public status: POStatus;
  declare public total_amount: number;
  declare public order_date: Date;
  declare public expected_date: Date | null;
  declare public notes: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly vendor?: Vendor;
  declare public readonly project?: Project;
  declare public readonly terms_and_conditions?: any;
  declare public readonly items?: PurchaseOrderItem[];
  declare public readonly created_by_user?: User;
  declare public readonly approved_by_user?: User;
  declare public readonly rejected_by_user?: User;
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
    terms_and_conditions_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'terms_and_conditions',
        key: 'id',
      },
    },
    created_by_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approved_by_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejected_by_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejection_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'PENDING_APPROVAL',
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
