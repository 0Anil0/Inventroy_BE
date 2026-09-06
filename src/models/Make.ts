import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface MakeAttributes {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MakeCreationAttributes extends Optional<MakeAttributes, 'id' | 'code' | 'description'> {}

export class Make extends Model<MakeAttributes, MakeCreationAttributes> implements MakeAttributes {
  declare public id: number;
  declare public name: string;
  declare public code: string | null;
  declare public description: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Make.init(
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
    tableName: 'makes',
    timestamps: true,
    underscored: true,
  }
);
