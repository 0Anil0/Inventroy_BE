import { Vendor } from '../models';

export class VendorService {
  public static async getAll() {
    return await Vendor.findAll({ order: [['id', 'ASC']] });
  }

  public static async getById(id: number) {
    const vendor = await Vendor.findByPk(id);
    if (!vendor) throw new Error('Vendor not found');
    return vendor;
  }

  public static async create(data: {
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    tax_id?: string;
  }) {
    return await Vendor.create(data);
  }

  public static async update(
    id: number,
    data: {
      name?: string;
      contact_person?: string;
      phone?: string;
      email?: string;
      address?: string;
      tax_id?: string;
    }
  ) {
    const vendor = await this.getById(id);
    return await vendor.update(data);
  }

  public static async delete(id: number) {
    const vendor = await this.getById(id);
    await vendor.destroy();
    return { success: true, message: 'Vendor deleted successfully' };
  }

  public static async seedDefaultVendors() {
    const defaults = [
      {
        name: 'Apex Building Supplies Ltd',
        contact_person: 'Rajesh Kumar',
        phone: '+91 98765 43210',
        email: 'sales@apexsupplies.com',
        address: '102 Industrial Zone, Area 4',
        tax_id: 'GSTIN27AAACA0000A1Z5',
      },
      {
        name: 'UltraTech Cement Distributors',
        contact_person: 'Anil Sharma',
        phone: '+91 98111 22233',
        email: 'orders@ultratechdist.com',
        address: 'Sector 18, Supply Hub',
        tax_id: 'GSTIN27BBBCB1111B1Z2',
      },
    ];

    for (const d of defaults) {
      await Vendor.findOrCreate({ where: { name: d.name }, defaults: d });
    }
  }
}
