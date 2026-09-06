import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Project } from './Project';
import { ItemType } from './ItemType';

export interface ProjectBOQItemAttributes {
  id: number;
  project_id: number;
  item_type_id?: number | null;
  section_name?: string | null;
  item_code?: string | null;
  item_name: string;
  rating?: string | null;
  full_description?: string | null;
  cat_no?: string | null;
  make?: string | null;
  quantity: number;
  unit: string;
  unit_rate: number;
  discount_percent: number;
  total_amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectBOQItemCreationAttributes
  extends Optional<ProjectBOQItemAttributes, 'id' | 'item_type_id' | 'section_name' | 'item_code' | 'rating' | 'full_description' | 'cat_no' | 'make' | 'unit' | 'unit_rate' | 'discount_percent' | 'total_amount'> {}

export class ProjectBOQItem extends Model<ProjectBOQItemAttributes, ProjectBOQItemCreationAttributes> implements ProjectBOQItemAttributes {
  declare public id: number;
  declare public project_id: number;
  declare public item_type_id: number | null;
  declare public section_name: string | null;
  declare public item_code: string | null;
  declare public item_name: string;
  declare public rating: string | null;
  declare public full_description: string | null;
  declare public cat_no: string | null;
  declare public make: string | null;
  declare public quantity: number;
  declare public unit: string;
  declare public unit_rate: number;
  declare public discount_percent: number;
  declare public total_amount: number;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly project?: Project;
  declare public readonly item_type?: ItemType;
}

ProjectBOQItem.init(
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
      allowNull: true,
      references: {
        model: 'item_types',
        key: 'id',
      },
    },
    section_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    item_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    item_name: {
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
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1,
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
    discount_percent: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    total_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'project_boq_items',
    timestamps: true,
    underscored: true,
  }
);
