import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

export interface POApproverAttributes {
  id: number;
  user_id: number;
  min_amount?: number;
  max_amount?: number | null;
  is_active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface POApproverCreationAttributes
  extends Optional<POApproverAttributes, 'id' | 'min_amount' | 'max_amount' | 'is_active'> {}

export class POApprover
  extends Model<POApproverAttributes, POApproverCreationAttributes>
  implements POApproverAttributes
{
  declare public id: number;
  declare public user_id: number;
  declare public min_amount: number;
  declare public max_amount: number | null;
  declare public is_active: boolean;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly user?: User;
}

POApprover.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    min_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    max_amount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'po_approvers',
    timestamps: true,
    underscored: true,
  }
);
