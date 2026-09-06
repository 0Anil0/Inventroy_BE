import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface TermsAndConditionsAttributes {
  id: number;
  title: string;
  payment_terms?: string | null;
  inco_terms?: string | null;
  content: string;
  is_default: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TermsAndConditionsCreationAttributes
  extends Optional<TermsAndConditionsAttributes, 'id' | 'payment_terms' | 'inco_terms' | 'is_default'> {}

export class TermsAndConditions
  extends Model<TermsAndConditionsAttributes, TermsAndConditionsCreationAttributes>
  implements TermsAndConditionsAttributes
{
  declare public id: number;
  declare public title: string;
  declare public payment_terms: string | null;
  declare public inco_terms: string | null;
  declare public content: string;
  declare public is_default: boolean;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

TermsAndConditions.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    payment_terms: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    inco_terms: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'terms_and_conditions',
    timestamps: true,
    underscored: true,
  }
);
