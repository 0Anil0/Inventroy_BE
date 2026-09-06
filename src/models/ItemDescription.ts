import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ItemDescriptionAttributes {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ItemDescriptionCreationAttributes extends Optional<ItemDescriptionAttributes, 'id' | 'code' | 'description'> {}

export class ItemDescription extends Model<ItemDescriptionAttributes, ItemDescriptionCreationAttributes> implements ItemDescriptionAttributes {
  declare public id: number;
  declare public name: string;
  declare public code: string | null;
  declare public description: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

ItemDescription.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'item_descriptions',
    timestamps: true,
    underscored: true,
  }
);
