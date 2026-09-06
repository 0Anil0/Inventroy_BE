import { sequelize } from '../config/database';
import { Role } from './Role';
import { User } from './User';
import { Make } from './Make';
import { Unit } from './Unit';
import { ItemType } from './ItemType';
import { Vendor } from './Vendor';

// User & Role Associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// Make & ItemType Associations
Make.hasMany(ItemType, { foreignKey: 'make_id', as: 'items' });
ItemType.belongsTo(Make, { foreignKey: 'make_id', as: 'make_details' });

// Unit & ItemType Associations
Unit.hasMany(ItemType, { foreignKey: 'unit_id', as: 'item_types' });
ItemType.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit_details' });

export {
  sequelize,
  Role,
  User,
  Make,
  Unit,
  ItemType,
  Vendor,
};
