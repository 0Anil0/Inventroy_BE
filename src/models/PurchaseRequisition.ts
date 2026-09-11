import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Project } from './Project';
import { User } from './User';

export type PRStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'REJECTED'
  | 'PO_CREATED'
  | 'CLOSED';

export type PRPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface PurchaseRequisitionAttributes {
  id: number;
  pr_number: string;
  project_id?: number | null;
  requested_by_id?: number | null;
  reviewed_by_id?: number | null;
  approved_at?: Date | null;
  status: PRStatus;
  priority: PRPriority;
  required_date?: Date | null;
  notes?: string | null;
  items?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PurchaseRequisitionCreationAttributes
  extends Optional<
    PurchaseRequisitionAttributes,
    | 'id'
    | 'project_id'
    | 'requested_by_id'
    | 'reviewed_by_id'
    | 'approved_at'
    | 'status'
    | 'priority'
    | 'required_date'
    | 'notes'
  > {}

export class PurchaseRequisition
  extends Model<PurchaseRequisitionAttributes, PurchaseRequisitionCreationAttributes>
  implements PurchaseRequisitionAttributes
{
  declare public id: number;
  declare public pr_number: string;
  declare public project_id: number | null;
  declare public requested_by_id: number | null;
  declare public reviewed_by_id: number | null;
  declare public approved_at: Date | null;
  declare public status: PRStatus;
  declare public priority: PRPriority;
  declare public required_date: Date | null;
  declare public notes: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly project?: Project;
  declare public readonly requested_by_user?: User;
  declare public readonly reviewed_by_user?: User;
  declare public readonly items?: any[];
}

PurchaseRequisition.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    pr_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    requested_by_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reviewed_by_id: {
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
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'PENDING_APPROVAL',
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'MEDIUM',
    },
    required_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'purchase_requisitions',
    timestamps: true,
    underscored: true,
  }
);
