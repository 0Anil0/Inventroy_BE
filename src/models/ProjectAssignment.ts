import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Project } from './Project';
import { User } from './User';
import { ProjectAssignmentItem } from './ProjectAssignmentItem';

export interface ProjectAssignmentAttributes {
  id: number;
  assignment_no: string;
  from_project_id?: number | null;
  to_project_id: number;
  assigned_to_person: string;
  created_by_user_id?: number | null;
  assignment_date?: Date;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectAssignmentCreationAttributes
  extends Optional<
    ProjectAssignmentAttributes,
    'id' | 'from_project_id' | 'created_by_user_id' | 'assignment_date' | 'notes'
  > {}

export class ProjectAssignment
  extends Model<ProjectAssignmentAttributes, ProjectAssignmentCreationAttributes>
  implements ProjectAssignmentAttributes
{
  declare public id: number;
  declare public assignment_no: string;
  declare public from_project_id: number | null;
  declare public to_project_id: number;
  declare public assigned_to_person: string;
  declare public created_by_user_id: number | null;
  declare public assignment_date: Date;
  declare public notes: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly to_project?: Project;
  declare public readonly from_project?: Project;
  declare public readonly user?: User;
  declare public readonly items?: ProjectAssignmentItem[];
}

ProjectAssignment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    assignment_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    from_project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    to_project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    assigned_to_person: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    created_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    assignment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'project_assignments',
    timestamps: true,
    underscored: true,
  }
);
