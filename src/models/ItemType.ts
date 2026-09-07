import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ItemTypeAttributes {
  id: number;
  code: string; // Item Number (input) e.g. 1001
  name: string; // Item (input) e.g. MCB
  rating?: string | null; // Item description e.g. 2A / 4P
  switchgear_family?: string | null;
  full_description?: string | null; // Full description (input) e.g. MCB 2A 4P
  cat_no?: string | null; // Cat No (input unique) e.g. DS1A7A1
  make?: string | null; // Make (master) e.g. ABB, SCHNEIDER
  make_id?: number | null;
  unit?: string;
  unit_id?: number | null;
  unit_rate?: number;
  discount?: number;
  total_quantity?: number;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ItemTypeCreationAttributes
  extends Optional<ItemTypeAttributes, 'id' | 'rating' | 'switchgear_family' | 'full_description' | 'cat_no' | 'make' | 'make_id' | 'unit' | 'unit_id' | 'unit_rate' | 'discount' | 'total_quantity' | 'description'> {}

export class ItemType extends Model<ItemTypeAttributes, ItemTypeCreationAttributes> implements ItemTypeAttributes {
  declare public id: number;
  declare public code: string;
  declare public name: string;
  declare public rating: string | null;
  declare public switchgear_family: string | null;
  declare public full_description: string | null;
  declare public cat_no: string | null;
  declare public make: string | null;
  declare public make_id: number | null;
  declare public unit: string;
  declare public unit_id: number | null;
  declare public unit_rate: number;
  declare public discount: number;
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
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    rating: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    full_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cat_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    make: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    make_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'makes',
        key: 'id',
      },
    },
    unit: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'pcs',
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
