import { sequelize } from '../config/database';
import { Role } from './Role';
import { User } from './User';

// User & Role Associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

export {
  sequelize,
  Role,
  User,
};
