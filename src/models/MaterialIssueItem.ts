import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ItemType } from './ItemType';

export interface MaterialIssueItemAttributes {
  id: number;
  material_issue_id: number;
  item_type_id: number;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MaterialIssueItemCreationAttributes
  extends Optional<MaterialIssueItemAttributes, 'id'> {}

export class MaterialIssueItem
  extends Model<MaterialIssueItemAttributes, MaterialIssueItemCreationAttributes>
  implements MaterialIssueItemAttributes
{
  declare public id: number;
  declare public material_issue_id: number;
  declare public item_type_id: number;
  declare public quantity: number;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly item_type?: ItemType;
}

MaterialIssueItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    material_issue_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'material_issues',
        key: 'id',
      },
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
    tableName: 'material_issue_items',
    timestamps: true,
    underscored: true,
  }
);
