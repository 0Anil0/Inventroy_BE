import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ItemTypeAttributes {
  id: number;
  name: string;
  code: string;
  unit: string; // e.g. pcs, kg, meters, boxes
  total_quantity?: number; // Central Catalog Stock Available
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ItemTypeCreationAttributes extends Optional<ItemTypeAttributes, 'id' | 'total_quantity'> {}

export class ItemType extends Model<ItemTypeAttributes, ItemTypeCreationAttributes> implements ItemTypeAttributes {
  declare public id: number;
  declare public name: string;
  declare public code: string;
  declare public unit: string;
  declare public total_quantity: number;
  declare public description: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

ItemType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    unit: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'pcs',
    },
    total_quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'item_types',
    timestamps: true,
    underscored: true,
  }
);
