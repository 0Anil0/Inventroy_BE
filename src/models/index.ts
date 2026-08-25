import { sequelize } from '../config/database';
import { Role } from './Role';
import { User } from './User';
import { ItemType } from './ItemType';
import { Project } from './Project';
import { ProjectInventory } from './ProjectInventory';
import { Unit } from './Unit';

// User & Role Associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// Project & Inventory Associations
Project.hasMany(ProjectInventory, { foreignKey: 'project_id', as: 'inventories' });
ProjectInventory.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// ItemType & Inventory Associations
ItemType.hasMany(ProjectInventory, { foreignKey: 'item_type_id', as: 'inventories' });
ProjectInventory.belongsTo(ItemType, { foreignKey: 'item_type_id', as: 'item_type' });

// Unit & ItemType Associations
Unit.hasMany(ItemType, { foreignKey: 'unit_id', as: 'item_types' });
ItemType.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit_details' });

export { sequelize, Role, User, ItemType, Project, ProjectInventory, Unit };

