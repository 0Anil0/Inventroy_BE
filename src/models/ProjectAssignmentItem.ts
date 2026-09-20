import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ItemType } from './ItemType';
import { InventoryLot } from './InventoryLot';
import { PurchaseOrder } from './PurchaseOrder';

export interface ProjectAssignmentItemAttributes {
  id: number;
  assignment_id: number;
  item_type_id: number;
  lot_id?: number | null;
  po_id?: number | null;
  unit_price?: number | null;
  total_cost?: number | null;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectAssignmentItemCreationAttributes
  extends Optional<ProjectAssignmentItemAttributes, 'id' | 'lot_id' | 'po_id' | 'unit_price' | 'total_cost'> {}

export class ProjectAssignmentItem
  extends Model<ProjectAssignmentItemAttributes, ProjectAssignmentItemCreationAttributes>
  implements ProjectAssignmentItemAttributes
{
  declare public id: number;
  declare public assignment_id: number;
  declare public item_type_id: number;
  declare public lot_id: number | null;
  declare public po_id: number | null;
  declare public unit_price: number | null;
  declare public total_cost: number | null;
  declare public quantity: number;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  declare public readonly item_type?: ItemType;
  declare public readonly lot?: InventoryLot;
  declare public readonly purchase_order?: PurchaseOrder;
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
    lot_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'inventory_lots',
        key: 'id',
      },
    },
    po_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'purchase_orders',
        key: 'id',
      },
    },
    unit_price: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    total_cost: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
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
