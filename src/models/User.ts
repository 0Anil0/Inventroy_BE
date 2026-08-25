import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Role } from './Role';

export interface UserAttributes {
  id: number;
  username: string;
  email?: string | null;
  password_hash: string;
  role_id?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare public id: number;
  declare public username: string;
  declare public email: string | null;
  declare public password_hash: string;
  declare public role_id: number | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly role?: Role;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
  }
);
