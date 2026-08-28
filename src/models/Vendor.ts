import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface VendorAttributes {
  id: number;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tax_id?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VendorCreationAttributes
  extends Optional<VendorAttributes, 'id' | 'contact_person' | 'phone' | 'email' | 'address' | 'tax_id'> {}

export class Vendor
  extends Model<VendorAttributes, VendorCreationAttributes>
  implements VendorAttributes
{
  declare public id: number;
  declare public name: string;
  declare public contact_person: string | null;
  declare public phone: string | null;
  declare public email: string | null;
  declare public address: string | null;
  declare public tax_id: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Vendor.init(
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
    contact_person: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tax_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'vendors',
    timestamps: true,
    underscored: true,
  }
);
