import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Project } from './Project';
import { User } from './User';
import { MaterialIssueItem } from './MaterialIssueItem';

export interface MaterialIssueAttributes {
  id: number;
  issue_number: string;
  project_id: number;
  issued_to: string;
  issued_by_user_id?: number | null;
  issue_date?: Date;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MaterialIssueCreationAttributes
  extends Optional<MaterialIssueAttributes, 'id' | 'issued_by_user_id' | 'issue_date' | 'notes'> {}

export class MaterialIssue
  extends Model<MaterialIssueAttributes, MaterialIssueCreationAttributes>
  implements MaterialIssueAttributes
{
  declare public id: number;
  declare public issue_number: string;
  declare public project_id: number;
  declare public issued_to: string;
  declare public issued_by_user_id: number | null;
  declare public issue_date: Date;
  declare public notes: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly project?: Project;
  declare public readonly user?: User;
  declare public readonly items?: MaterialIssueItem[];
}

MaterialIssue.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    issue_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    issued_to: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    issued_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    issue_date: {
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
    tableName: 'material_issues',
    timestamps: true,
    underscored: true,
  }
);
