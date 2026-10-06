import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Project } from './Project';
import { ItemType } from './ItemType';
import { StorageShelf } from './StorageShelf';
import { StorageRack } from './StorageRack';

export interface ProjectInventoryAttributes {
  id: number;
  plant_id: number;
  project_id?: number | null;
  item_type_id: number;
  shelf_id?: number | null;
  rack_id?: number | null;
  quantity: number;
  min_quantity?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectInventoryCreationAttributes
  extends Optional<ProjectInventoryAttributes, 'id' | 'project_id' | 'shelf_id' | 'rack_id' | 'quantity' | 'min_quantity'> {}

export class ProjectInventory
  extends Model<ProjectInventoryAttributes, ProjectInventoryCreationAttributes>
  implements ProjectInventoryAttributes
{
  declare public id: number;
  declare public plant_id: number;
  declare public project_id: number | null;
  declare public item_type_id: number;
  declare public shelf_id: number | null;
  declare public rack_id: number | null;
  declare public quantity: number;
  declare public min_quantity: number;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly project?: Project;
  declare public readonly item_type?: ItemType;
  declare public readonly shelf?: StorageShelf;
  declare public readonly rack?: StorageRack;
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
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    plant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'plants',
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
    shelf_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'storage_shelves',
        key: 'id',
      },
    },
    rack_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'storage_racks',
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
  }
);
