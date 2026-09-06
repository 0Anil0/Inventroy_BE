import { sequelize } from '../config/database';
import { Role } from './Role';
import { User } from './User';
import { Make } from './Make';
import { Unit } from './Unit';
import { ItemType } from './ItemType';
import { Project } from './Project';
import { ProjectBOQItem } from './ProjectBOQItem';

// User & Role Associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// Make & ItemType Associations
Make.hasMany(ItemType, { foreignKey: 'make_id', as: 'items' });
ItemType.belongsTo(Make, { foreignKey: 'make_id', as: 'make_details' });

// Unit & ItemType Associations
Unit.hasMany(ItemType, { foreignKey: 'unit_id', as: 'item_types' });
ItemType.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit_details' });

// Project & BOQ Associations
Project.hasMany(ProjectBOQItem, { foreignKey: 'project_id', as: 'boq_items' });
ProjectBOQItem.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

ItemType.hasMany(ProjectBOQItem, { foreignKey: 'item_type_id', as: 'boq_items' });
ProjectBOQItem.belongsTo(ItemType, { foreignKey: 'item_type_id', as: 'item_type' });

export {
  sequelize,
  Role,
  User,
  Make,
  Unit,
  ItemType,
  Project,
  ProjectBOQItem,
};
