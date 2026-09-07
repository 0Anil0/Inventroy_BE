import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { PurchaseOrder } from './PurchaseOrder';
import { Project } from './Project';
import { User } from './User';

export interface GoodsReceiptNoteAttributes {
  id: number;
  grn_number: string;
  po_id: number;
  project_id?: number | null;
  received_date: string;
  challan_no?: string | null;
  vehicle_no?: string | null;
  received_by_id?: number | null;
  remarks?: string | null;
  status: 'RECEIVED' | 'CANCELLED';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GoodsReceiptNoteCreationAttributes
  extends Optional<
    GoodsReceiptNoteAttributes,
    'id' | 'project_id' | 'challan_no' | 'vehicle_no' | 'received_by_id' | 'remarks' | 'status'
  > {}

export class GoodsReceiptNote
  extends Model<GoodsReceiptNoteAttributes, GoodsReceiptNoteCreationAttributes>
  implements GoodsReceiptNoteAttributes
{
  declare public id: number;
  declare public grn_number: string;
  declare public po_id: number;
  declare public project_id: number | null;
  declare public received_date: string;
  declare public challan_no: string | null;
  declare public vehicle_no: string | null;
  declare public received_by_id: number | null;
  declare public remarks: string | null;
  declare public status: 'RECEIVED' | 'CANCELLED';

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly purchase_order?: PurchaseOrder;
  declare public readonly project?: Project;
  declare public readonly received_by_user?: User;
}

GoodsReceiptNote.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    grn_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    po_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'purchase_orders',
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
    received_date: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    challan_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    vehicle_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    received_by_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('RECEIVED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'RECEIVED',
    },
  },
  {
    sequelize,
    tableName: 'goods_receipt_notes',
    timestamps: true,
    underscored: true,
  }
);
