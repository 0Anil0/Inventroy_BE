import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ItemTypeAttributes {
  id: number;
  name: string;
  code: string;
  cat_no?: string | null;
  make?: string | null;
  rating?: string | null;
  switchgear_family?: string | null;
  full_description?: string | null;
  unit?: string; // e.g. pcs, kg, meters, boxes
  unit_id?: number | null;
  total_quantity?: number; // Central Catalog Stock Available
  description?: string | null;
  unit_rate?: number;
  discount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ItemTypeCreationAttributes extends Optional<ItemTypeAttributes, 'id' | 'total_quantity' | 'unit_id' | 'unit_rate' | 'discount'> {}

export class ItemType extends Model<ItemTypeAttributes, ItemTypeCreationAttributes> implements ItemTypeAttributes {
  declare public id: number;
  declare public name: string;
  declare public code: string;
  declare public cat_no: string | null;
  declare public make: string | null;
  declare public rating: string | null;
  declare public switchgear_family: string | null;
  declare public full_description: string | null;
  declare public unit: string;
  declare public unit_id: number | null;
  declare public total_quantity: number;
  declare public description: string | null;
  declare public unit_rate: number;
  declare public discount: number;

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
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    cat_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    make: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    rating: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    switchgear_family: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    full_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'pcs',
    },
    unit_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'units',
        key: 'id',
      },
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
    unit_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'item_types',
    timestamps: true,
    underscored: true,
  }
);
