import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface StorageRackAttributes {
  id: number;
  shelf_id: number;
  rack_code: string;
  name: string;
  capacity_notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StorageRackCreationAttributes
  extends Optional<StorageRackAttributes, 'id' | 'capacity_notes'> {}

export class StorageRack
  extends Model<StorageRackAttributes, StorageRackCreationAttributes>
  implements StorageRackAttributes
{
  declare public id: number;
  declare public shelf_id: number;
  declare public rack_code: string;
  declare public name: string;
  declare public capacity_notes: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

StorageRack.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    shelf_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'storage_shelves',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    rack_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    capacity_notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'storage_racks',
    timestamps: true,
    underscored: true,
  }
);
