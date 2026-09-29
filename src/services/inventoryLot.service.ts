import { Op } from 'sequelize';
import { InventoryLot, ItemType, PurchaseOrder, Project, StorageShelf, StorageRack } from '../models';

export class InventoryLotService {
  /**
   * Get all active available stock lots for a target project assignment.
   * Eligible lots include:
   * 1. Lots purchased for the target project (or its sub-projects).
   * 2. Lots in General Stock (project_id is null or 0).
   */
  public static async getAvailableLots(params: {
    project_id?: number;
    item_type_id?: number;
  }) {
    const { project_id, item_type_id } = params;

    const whereClause: any = {
      available_qty: { [Op.gt]: 0 },
    };

    if (item_type_id) {
      whereClause.item_type_id = item_type_id;
    }

    if (project_id) {
      const targetProj = await Project.findByPk(project_id);
      const parentId = targetProj?.parent_id ? targetProj.parent_id : project_id;

      // Find parent project and all its child sub-projects
      const childProjects = await Project.findAll({
        where: { parent_id: parentId },
        attributes: ['id'],
      });
      const validProjectIds = Array.from(
        new Set([project_id, parentId, ...childProjects.map((p) => p.id)])
      );

      whereClause[Op.or] = [
        { project_id: null },
        { project_id: 0 },
        { project_id: { [Op.in]: validProjectIds } },
      ];
    } else {
      // If no target project specified, return General Stock lots (project_id null or 0)
      whereClause[Op.or] = [
        { project_id: null },
        { project_id: 0 },
      ];
    }

    return await InventoryLot.findAll({
      where: whereClause,
      include: [
        {
          model: ItemType,
          as: 'item_type',
        },
        {
          model: PurchaseOrder,
          as: 'purchase_order',
          attributes: ['id', 'po_number', 'status', 'project_id'],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'code'],
        },
        { model: StorageShelf, as: 'shelf' },
        { model: StorageRack, as: 'rack' },
      ],
      order: [['id', 'DESC']],
    });
  }
}
