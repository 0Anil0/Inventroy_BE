import { POApprover, User, Role } from '../models';

export class POApproverService {
  public static async getAll() {
    return await POApprover.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email'],
          include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
        },
      ],
      order: [['id', 'ASC']],
    });
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

  public static async isUserApprover(userId: number, roleName?: string): Promise<boolean> {
    if (roleName && roleName.toUpperCase() === 'ADMIN') {
      return true;
    }
    const approver = await POApprover.findOne({ where: { user_id: userId, is_active: true } });
    return !!approver;
  }
}
