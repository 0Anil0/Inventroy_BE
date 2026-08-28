import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Project } from './Project';
import { ItemType } from './ItemType';
import { User } from './User';

export interface StockMovementAttributes {
  id: number;
  project_id: number;
  item_type_id: number;
  user_id?: number | null;
  type: 'IN' | 'OUT' | 'SET' | 'TRANSFER';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StockMovementCreationAttributes
  extends Optional<StockMovementAttributes, 'id' | 'user_id' | 'notes'> {}

export class StockMovement
  extends Model<StockMovementAttributes, StockMovementCreationAttributes>
  implements StockMovementAttributes
{
  declare public id: number;
  declare public project_id: number;
  declare public item_type_id: number;
  declare public user_id: number | null;
  declare public type: 'IN' | 'OUT' | 'SET' | 'TRANSFER';
  declare public quantity: number;
  declare public previous_quantity: number;
  declare public new_quantity: number;
  declare public notes: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly project?: Project;
  declare public readonly item_type?: ItemType;
  declare public readonly user?: User;
}

StockMovement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('IN', 'OUT', 'SET', 'TRANSFER'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    previous_quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    new_quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'stock_movements',
    timestamps: true,
    underscored: true,
  }
);
