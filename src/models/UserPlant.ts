import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export interface UserPlantAttributes {
  user_id: number;
  plant_id: number;
}

export class UserPlant extends Model<UserPlantAttributes> implements UserPlantAttributes {
  declare public user_id: number;
  declare public plant_id: number;
}

UserPlant.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      primaryKey: true,
    },
    plant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'plants',
        key: 'id',
      },
      primaryKey: true,
    },
  },
  {
    sequelize,
    tableName: 'user_plants',
    timestamps: false,
    underscored: true,
  }
);
