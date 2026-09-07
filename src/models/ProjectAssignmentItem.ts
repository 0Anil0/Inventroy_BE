import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ItemType } from './ItemType';

export interface ProjectAssignmentItemAttributes {
  id: number;
  assignment_id: number;
  item_type_id: number;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectAssignmentItemCreationAttributes
  extends Optional<ProjectAssignmentItemAttributes, 'id'> {}

export class ProjectAssignmentItem
  extends Model<ProjectAssignmentItemAttributes, ProjectAssignmentItemCreationAttributes>
  implements ProjectAssignmentItemAttributes
{
  declare public id: number;
  declare public assignment_id: number;
  declare public item_type_id: number;
  declare public quantity: number;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly item_type?: ItemType;
}

ProjectAssignmentItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    assignment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'project_assignments',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    item_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'item_types',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'project_assignment_items',
    timestamps: true,
    underscored: true,
  }
);
