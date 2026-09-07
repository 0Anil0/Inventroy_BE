import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface StorageShelfAttributes {
  id: number;
  code: string;
  name: string;
  zone?: string | null;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StorageShelfCreationAttributes
  extends Optional<StorageShelfAttributes, 'id' | 'zone' | 'description'> {}

export class StorageShelf
  extends Model<StorageShelfAttributes, StorageShelfCreationAttributes>
  implements StorageShelfAttributes
{
  declare public id: number;
  declare public code: string;
  declare public name: string;
  declare public zone: string | null;
  declare public description: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

StorageShelf.init(
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
    zone: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'storage_shelves',
    timestamps: true,
    underscored: true,
  }
);
