import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface UnitAttributes {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UnitCreationAttributes extends Optional<UnitAttributes, 'id'> {}

export class Unit extends Model<UnitAttributes, UnitCreationAttributes> implements UnitAttributes {
  declare public id: number;
  declare public name: string;
  declare public code: string;
  declare public description: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Unit.init(
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
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'units',
    timestamps: true,
    underscored: true,
  }
);
