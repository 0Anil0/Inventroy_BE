import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PlantAttributes {
  id: number;
  name: string;
  code: string;
  address?: string | null;
  status?: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlantCreationAttributes extends Optional<PlantAttributes, 'id'> {}

export class Plant extends Model<PlantAttributes, PlantCreationAttributes> implements PlantAttributes {
  declare public id: number;
  declare public name: string;
  declare public code: string;
  declare public address: string | null;
  declare public status: 'active' | 'inactive';

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Plant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    tableName: 'plants',
    timestamps: true,
    underscored: true,
  }
);
