import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Project } from './Project';
import { ItemType } from './ItemType';

export interface ProjectInventoryAttributes {
  id: number;
  project_id: number;
  item_type_id: number;
  quantity: number;
  min_quantity?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectInventoryCreationAttributes extends Optional<ProjectInventoryAttributes, 'id' | 'quantity' | 'min_quantity'> {}

export class ProjectInventory extends Model<ProjectInventoryAttributes, ProjectInventoryCreationAttributes> implements ProjectInventoryAttributes {
  declare public id: number;
  declare public project_id: number;
  declare public item_type_id: number;
  declare public quantity: number;
  declare public min_quantity: number;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly project?: Project;
  declare public readonly item_type?: ItemType;
}

ProjectInventory.init(
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
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    min_quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'project_inventories',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['project_id', 'item_type_id'],
      },
    ],
  }
);
