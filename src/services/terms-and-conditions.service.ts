import { Op } from 'sequelize';
import { TermsAndConditions } from '../models';

export interface TermsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export class TermsAndConditionsService {
  public static async getAll(params: TermsQueryParams = {}) {
    const page = params.page && Number(params.page) > 0 ? Number(params.page) : 1;
    const limit = params.limit && Number(params.limit) > 0 ? Number(params.limit) : 50;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      const q = `%${params.search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.iLike]: q } },
        { payment_terms: { [Op.iLike]: q } },
        { inco_terms: { [Op.iLike]: q } },
        { content: { [Op.iLike]: q } },
      ];
    }

    const { count, rows } = await TermsAndConditions.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['is_default', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    return {
      templates: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  public static async getById(id: number) {
    const template = await TermsAndConditions.findByPk(id);
    if (!template) throw new Error('Terms and conditions template not found');
    return template;
  }

  public static async getDefault() {
    let template = await TermsAndConditions.findOne({ where: { is_default: true } });
    if (!template) {
      template = await TermsAndConditions.findOne({ order: [['id', 'ASC']] });
    }
    return template;
  }

  public static async create(data: {
    title: string;
    payment_terms?: string;
    inco_terms?: string;
    content: string;
    is_default?: boolean;
  }) {
    if (data.is_default) {
      await TermsAndConditions.update({ is_default: false }, { where: {} });
    }

    const created = await TermsAndConditions.create({
      title: data.title,
      payment_terms: data.payment_terms || null,
      inco_terms: data.inco_terms || null,
      content: data.content,
      is_default: data.is_default || false,
    });

    return created;
  }

  public static async update(
    id: number,
    data: {
      title?: string;
      payment_terms?: string;
      inco_terms?: string;
      content?: string;
      is_default?: boolean;
    }
  ) {
    const template = await TermsAndConditions.findByPk(id);
    if (!template) throw new Error('Terms and conditions template not found');

    if (data.is_default) {
      await TermsAndConditions.update({ is_default: false }, { where: {} });
    }

    await template.update({
      title: data.title !== undefined ? data.title : template.title,
      payment_terms: data.payment_terms !== undefined ? data.payment_terms : template.payment_terms,
      inco_terms: data.inco_terms !== undefined ? data.inco_terms : template.inco_terms,
      content: data.content !== undefined ? data.content : template.content,
      is_default: data.is_default !== undefined ? data.is_default : template.is_default,
    });

    return template;
  }

  public static async setDefault(id: number) {
    const template = await TermsAndConditions.findByPk(id);
    if (!template) throw new Error('Terms and conditions template not found');

    await TermsAndConditions.update({ is_default: false }, { where: {} });
    await template.update({ is_default: true });

    return template;
  }

  public static async delete(id: number) {
    const template = await TermsAndConditions.findByPk(id);
    if (!template) throw new Error('Terms and conditions template not found');

    await template.destroy();
    return { success: true, message: 'Terms and conditions template deleted successfully' };
  }

  public static async seedDefaultTerms() {
    const count = await TermsAndConditions.count();
    if (count === 0) {
      const defaultContent = `Material Must be same as per Ordered, otherwise it will be rejected by us.
Original invoice must be submitted along with materials, otherwise it will be not accepted.
Mention Purchase order/work order No on invoice against supply of materials or submission of Invoice.
Actual Payment Will be done as per actual measurement/qty/weight slip/Final Verification.

1. ACKNOWLEDGEMENT
This Order Confirmation to be forwarded H-185, IID CENTER, RIICO INDUSTRIAL AREA, ROAD NO.3 KALADWAS, UDAIPUR-313003, In the absence of receipt of communication within fortnight from the date of this Purchase order, it will be deemed to have been accepted in to.

2. QUALITY
All Material are to be supplied strictly in accordance to with specification/Samples/Drawing given, no departure from specification/Samples/Drawing is permitted without our prior agreement in writing, if any sub standard.

3. INSPECTION
Goods will be accepted only after final examination, test & Quality approval by company, if they are not in accordance with our specification or do not fulfil the purpose, we reserve rights to reject the goods and to cancel the order if we deem it necessary. The supplier shall collect at his cost the rejected goods within 15 days of receipt of intimation of such rejection. If supplier will fail to do so, the company shall be at liberty to dispose of the material in the manner it chooses.

4. PRICE
Price set out in this order is firm and no increase will be entertained without a written request giving reason for the increases, for an open order, the price is subject to the current market rate ruling at the time of delivery and subject to verification.

5. OTHER CHARGES
Price to include all incidental charges if any, unless otherwise agreed in to the order plus GST as applicable on the date of supply.

6. DAMAGE
All material supplied must be specified as regards to Quantity, Quality, weight, dimension etc. and will be subject to inspection and approval by us after delivery. We reserve the rights to Reject and return the Damage material within 15 days of receipt of material at the risk and expenses of the supplier and any advances against that supply will be 100% refund by supplier on immediate basis.

7. GURANTEE / WARRANTY
The Equipment /Instrument/Component/material as the case may be shall be guaranteed for a period of twelve calendar months of reliable working of the equipment’s from the date of the unit going into regular operation, you shall be liable to replace any parts/equipment/Instrument/component that may fail or show signs of defects due to faulty designed, materials or workmanship, or erection of from any acts of omission by you & All such replacement of Equipment /Component/Parts/Material shall be made free of cost at site by you and removal of defective part shall be your responsibility.

8. INSURANCE
NIL

9. GENERAL
A. Tax Invoice, E-way bills, Duplicate Copy/Transporters copy required at our stores.
B. Wherever the freight is to be borne by us the consignment to be dispatched through approved transport only.
C. All payment will be made by our accounts department by crossed cheque /RTGS/NEFT only.
D. We reserve the right to suspend dispatches of the material covered by this order in the event of strikes or other contingencies beyond the control of the company.
E. The seller shall submit a sample free of charge prior to execution of order when an advance sample is required to be approved by company.
F. All specification, drawing, tools & fixtures and other data supplied by the company are to be used exclusively for our company and these are to be returned to the company on demand.
G. Payment of GST taxes and filling return thereof on GST portal should be made on time for availing of GST credit by us, else we will be forced to raise debit note to that effect for non-payment of GST Taxes and or the tax component will be withholding while making final payment.
H. Acceptance of Invoice of GST portal will not amount to acceptance of goods and payment liability.
I. This PO will be valid till 10 days offer passing the delivery date.`;

      await TermsAndConditions.create({
        title: 'Standard Purchase Order Terms & Conditions (Udaipur Plant)',
        payment_terms: '20% Advance with PO',
        inco_terms: 'Freight on Road',
        content: defaultContent,
        is_default: true,
      });

      console.log('Default Purchase Order Terms & Conditions seeded successfully.');
    }
  }
}
