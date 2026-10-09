import { Op } from 'sequelize';
import { POApprover, User, Role } from '../models';

export class POApproverService {
  public static async getAll(params?: { page?: number; limit?: number; search?: string }) {
    const whereUser: any = {};
    if (params?.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      whereUser[Op.or] = [
        { username: { [Op.iLike]: q } },
        { email: { [Op.iLike]: q } },
      ];
    }

    const approvers = await POApprover.findAll({
      include: [
        {
          model: User,
          as: 'user',
          where: params?.search ? whereUser : undefined,
          attributes: ['id', 'username', 'email'],
          include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
        },
      ],
      order: [['id', 'ASC']],
    });

    const total = approvers.length;
    let pageItems = approvers;

    if (params?.page && params?.limit) {
      const page = params.page > 0 ? params.page : 1;
      const limit = params.limit > 0 ? params.limit : 10;
      pageItems = approvers.slice((page - 1) * limit, page * limit);
    }

    return {
      approvers: pageItems,
      total,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: params?.limit ? Math.ceil(total / params.limit) || 1 : 1,
    };
  }

  public static async addApprover(data: { user_id: number; min_amount?: number; max_amount?: number }) {
    const existing = await POApprover.findOne({ where: { user_id: data.user_id } });
    if (existing) {
      if (!existing.is_active) {
        await existing.update({ is_active: true, min_amount: data.min_amount || 0, max_amount: data.max_amount || null });
        return existing;
      }
      throw new Error('User is already configured as an active PO Approver');
    }

    return await POApprover.create({
      user_id: data.user_id,
      min_amount: data.min_amount || 0,
      max_amount: data.max_amount || null,
      is_active: true,
    });
  }

  public static async removeApprover(id: number) {
    const approver = await POApprover.findByPk(id);
    if (!approver) throw new Error('Approver configuration not found');
    await approver.destroy();
    return { success: true };
  }

  public static async updateApprover(
    id: number,
    data: { min_amount?: number; max_amount?: number | null; is_active?: boolean }
  ) {
    const approver = await POApprover.findByPk(id);
    if (!approver) throw new Error('Approver configuration not found');

    await approver.update({
      ...(data.min_amount !== undefined && { min_amount: data.min_amount }),
      ...(data.max_amount !== undefined && { max_amount: data.max_amount }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
    });

    return approver;
  }

  public static async isUserApprover(userId: number, roleName?: string, poAmount?: number): Promise<boolean> {
    const approver = await POApprover.findOne({ where: { user_id: userId, is_active: true } });
    if (!approver) return false;

    if (poAmount !== undefined && poAmount !== null) {
      if (approver.min_amount !== null && approver.min_amount !== undefined && poAmount < approver.min_amount) {
        return false;
      }
      if (approver.max_amount !== null && approver.max_amount !== undefined && poAmount > approver.max_amount) {
        return false;
      }
    }
    return true;
  }
}
