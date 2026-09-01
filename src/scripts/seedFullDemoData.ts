import { sequelize } from '../config/database';
import {
  Unit,
  ItemType,
  Vendor,
  Project,
  ProjectInventory,
  PurchaseOrder,
  PurchaseOrderItem,
  MaterialIssue,
  MaterialIssueItem,
  StockMovement,
  User,
  Role,
} from '../models';
import { UserService } from '../services/user.service';

export const seedFullDemoData = async () => {
  console.log('🚀 Starting Full Enterprise Demo Data Seeding...');

  // Ensure default roles and admin exist
  await UserService.seedRolesAndAdmin();
  const adminUser = await User.findOne({ where: { username: 'admin' } });
  const adminId = adminUser ? adminUser.id : 1;

  // 1. Create Units of Measurement
  const unitsData = [
    { name: 'Bags', code: 'BAGS', description: 'Standard 50kg bags' },
    { name: 'Kilograms', code: 'KG', description: 'Metric kilograms' },
    { name: 'Metric Ton', code: 'MT', description: '1000 Kilograms' },
    { name: 'Meters', code: 'MTR', description: 'Linear meters' },
    { name: 'Pieces', code: 'PCS', description: 'Individual unit pieces' },
    { name: 'Liters', code: 'LTR', description: 'Liquid volume liters' },
  ];

  const unitsMap: Record<string, Unit> = {};
  for (const u of unitsData) {
    const [unit] = await Unit.findOrCreate({
      where: { code: u.code },
      defaults: u,
    });
    unitsMap[u.code] = unit;
  }
  console.log('✅ Created 6 Units of Measure');

  // 2. Create Catalog Item Types
  const itemTypesData = [
    { name: 'Cement 50kg Bag', code: 'ITM-CMT-50', unit: 'BAGS', total_quantity: 450, description: 'Portland Pozzolana Cement' },
    { name: 'TMT Steel Bars 12mm', code: 'ITM-STL-12', unit: 'MT', total_quantity: 120, description: 'Fe550 Grade High Strength Steel' },
    { name: 'Structural Steel Beams', code: 'ITM-STL-BM', unit: 'MT', total_quantity: 45, description: 'Heavy Duty I-Beams' },
    { name: 'Ready Mix Concrete M30', code: 'ITM-RMC-30', unit: 'MT', total_quantity: 80, description: 'M30 Grade Concrete Mix' },
    { name: 'Red Clay Bricks', code: 'ITM-BRK-RED', unit: 'PCS', total_quantity: 15000, description: 'Kiln Fired Red Bricks' },
    { name: 'Sand - Fine River Sand', code: 'ITM-SND-RVR', unit: 'MT', total_quantity: 200, description: 'Washed Fine River Sand' },
    { name: 'Coarse Aggregate 20mm', code: 'ITM-AGG-20', unit: 'MT', total_quantity: 180, description: '20mm Crushed Blue Metal Aggregate' },
    { name: 'PVC Conduit Pipes 25mm', code: 'ITM-PIP-PVC', unit: 'MTR', total_quantity: 600, description: 'Heavy Duty Rigid PVC Conduit' },
    { name: 'Waterproofing Chemical 20L', code: 'ITM-WPR-20', unit: 'LTR', total_quantity: 350, description: 'Liquid Acrylic Polymer Waterproof Compound' },
    { name: 'Electrical Copper Cable 4sqmm', code: 'ITM-CBL-4SQ', unit: 'MTR', total_quantity: 1200, description: 'Flame Retardant Flexible Copper Wire' },
  ];

  const itemTypesList: ItemType[] = [];
  for (const it of itemTypesData) {
    const [itemType] = await ItemType.findOrCreate({
      where: { code: it.code },
      defaults: it,
    });
    await itemType.update({ total_quantity: it.total_quantity });
    itemTypesList.push(itemType);
  }
  console.log('✅ Created 10 Catalog Item Types');

  // 3. Create Suppliers / Vendors
  const vendorsData = [
    { name: 'UltraTech Cement Co.', contact_person: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@ultratech.com', tax_id: 'GST27ULTRA1234' },
    { name: 'Tata Steel Construction Ltd.', contact_person: 'Anil Sharma', phone: '9163504021', email: 'anil.sharma@tatasteel.com', tax_id: 'GST27TATA5678' },
    { name: 'ACC Concrete Solutions', contact_person: 'Suresh Patel', phone: '9822012345', email: 'suresh@acc-concrete.com', tax_id: 'GST27ACC9911' },
    { name: 'Supreme Pipe Industries', contact_person: 'Vikram Singh', phone: '9711098765', email: 'sales@supremepipes.com', tax_id: 'GST27SUPR4422' },
    { name: 'Havells Electricals India', contact_person: 'Pooja Mehta', phone: '9988776655', email: 'pooja@havells.com', tax_id: 'GST27HAVL3311' },
    { name: 'Asian Paints & Chemicals', contact_person: 'Deepak Joshi', phone: '9844556677', email: 'deepak@asianpaints.com', tax_id: 'GST27ASIAN8844' },
  ];

  const vendorsList: Vendor[] = [];
  for (const v of vendorsData) {
    const [vendor] = await Vendor.findOrCreate({
      where: { name: v.name },
      defaults: v,
    });
    vendorsList.push(vendor);
  }
  console.log('✅ Created 6 Suppliers / Vendors');

  // 4. Create Project Sites
  const projectsData = [
    { name: 'Central Warehouse (HQ)', code: 'PRJ-WH-01', location: 'Industrial Corridor Zone A', description: 'Central Distribution Depot' },
    { name: 'Bridge Site A - North Highway', code: 'PRJ-BRG-A', location: 'NH-44 North Expressway', description: 'Flyover & Viaduct Construction' },
    { name: 'Commercial Complex Tower B', code: 'PRJ-TWR-B', location: 'Tech Park Financial District', description: '18-Story Commercial Tower' },
    { name: 'Metro Line Station 4', code: 'PRJ-MTR-04', location: 'Central Junction Station', description: 'Underground Metro Rail Station' },
    { name: 'Residential Colony Phase 2', code: 'PRJ-RES-02', location: 'Green Valley Township', description: '24 Villa Residential Complex' },
  ];

  const projectsList: Project[] = [];
  for (const p of projectsData) {
    const [project] = await Project.findOrCreate({
      where: { code: p.code },
      defaults: p,
    });
    projectsList.push(project);
  }
  console.log('✅ Created 5 Project Sites');

  // 5. Seed 30 Project Inventory Allocations across sites
  console.log('📦 Allocating stock across project inventory tables...');
  for (const p of projectsList) {
    for (const it of itemTypesList) {
      // Deterministic random quantity for realistic testing
      const seedVal = (p.id * 17 + it.id * 31) % 100;
      let qty = 0;
      let minQty = 15;

      if (seedVal > 70) {
        qty = (seedVal * 3) + 20; // 🟢 In Stock
      } else if (seedVal > 30) {
        qty = Math.floor(seedVal / 4); // 🟡 Low Stock
        minQty = qty + 10;
      } else {
        qty = 0; // 🔴 Out of Stock
        minQty = 20;
      }

      await ProjectInventory.findOrCreate({
        where: { project_id: p.id, item_type_id: it.id },
        defaults: {
          project_id: p.id,
          item_type_id: it.id,
          quantity: qty,
          min_quantity: minQty,
        },
      });
    }
  }
  console.log('✅ Created 30+ Project Inventory Stock Records');

  // 6. Create 8 Purchase Orders & Line Items
  console.log('🛒 Generating 8 Purchase Orders...');
  const poDates = ['2026-08-10', '2026-08-14', '2026-08-18', '2026-08-20', '2026-08-22', '2026-08-24', '2026-08-26', '2026-08-28'];

  for (let i = 0; i < 8; i++) {
    const vendor = vendorsList[i % vendorsList.length];
    const poNum = `PO-2026-000${i + 1}`;
    const status = i % 2 === 0 ? 'RECEIVED' : 'ORDERED';

    const [po] = await PurchaseOrder.findOrCreate({
      where: { po_number: poNum },
      defaults: {
        po_number: poNum,
        vendor_id: vendor.id,
        status: status as any,
        total_amount: (i + 1) * 35000,
        order_date: new Date(poDates[i]),
        notes: `Supply of construction materials for PO batch #${i + 1}`,
      },
    });

    // Add 2 PO Items
    const item1 = itemTypesList[i % itemTypesList.length];
    const item2 = itemTypesList[(i + 3) % itemTypesList.length];

    await PurchaseOrderItem.findOrCreate({
      where: { po_id: po.id, item_type_id: item1.id },
      defaults: {
        po_id: po.id,
        item_type_id: item1.id,
        ordered_qty: 150 + i * 20,
        unit_price: 350 + i * 10,
        total_price: (150 + i * 20) * (350 + i * 10),
      },
    });

    await PurchaseOrderItem.findOrCreate({
      where: { po_id: po.id, item_type_id: item2.id },
      defaults: {
        po_id: po.id,
        item_type_id: item2.id,
        ordered_qty: 50 + i * 10,
        unit_price: 1200 + i * 50,
        total_price: (50 + i * 10) * (1200 + i * 50),
      },
    });
  }
  console.log('✅ Created 8 Purchase Orders with Line Items');

  // 7. Create 8 Material Issues & Line Items
  console.log('📋 Generating 8 Material Issue Vouchers...');
  const recipients = [
    'Contractor Subteam A (Foundation Work)',
    'Engineering Team Alpha (Pier Castings)',
    'Subcontractor B (Structural Framing)',
    'Plumbing & Drainage Crew',
    'Electrical Installation Subteam',
    'Roofing & Masonry Crew D',
    'Finishing Works Contractor',
    'Site Repair & Maintenance Team',
  ];

  for (let i = 0; i < 8; i++) {
    const project = projectsList[i % projectsList.length];
    const issueNum = `MR-2026-000${i + 1}`;

    const [issue] = await MaterialIssue.findOrCreate({
      where: { issue_number: issueNum },
      defaults: {
        issue_number: issueNum,
        project_id: project.id,
        issued_to: recipients[i],
        issued_by_user_id: adminId,
        issue_date: new Date(poDates[i]),
        notes: `Material issue voucher sanctioned for ${project.name}`,
      },
    });

    const item1 = itemTypesList[(i + 1) % itemTypesList.length];
    const item2 = itemTypesList[(i + 4) % itemTypesList.length];

    await MaterialIssueItem.findOrCreate({
      where: { material_issue_id: issue.id, item_type_id: item1.id },
      defaults: {
        material_issue_id: issue.id,
        item_type_id: item1.id,
        quantity: 25 + i * 5,
      },
    });

    await MaterialIssueItem.findOrCreate({
      where: { material_issue_id: issue.id, item_type_id: item2.id },
      defaults: {
        material_issue_id: issue.id,
        item_type_id: item2.id,
        quantity: 10 + i * 2,
      },
    });
  }
  console.log('✅ Created 8 Material Issue Vouchers with Line Items');

  // 8. Create 30 Audit Movement Logs
  console.log('📜 Generating 30 Audit Movement Logs...');
  const movementTypes: Array<'IN' | 'OUT' | 'TRANSFER' | 'SET'> = ['IN', 'OUT', 'TRANSFER', 'SET'];

  for (let i = 1; i <= 30; i++) {
    const project = projectsList[i % projectsList.length];
    const item = itemTypesList[i % itemTypesList.length];
    const type = movementTypes[i % movementTypes.length];
    const qty = 15 + (i * 3);

    await StockMovement.create({
      project_id: project.id,
      item_type_id: item.id,
      user_id: adminId,
      type,
      quantity: qty,
      previous_quantity: Math.max(0, qty - 10),
      new_quantity: qty,
      notes: `Audit trail entry #${i}: Stock shift of ${qty} ${item.unit} at ${project.name}`,
      createdAt: new Date(Date.now() - (30 - i) * 86400000), // Spaced out over past 30 days
    });
  }
  console.log('✅ Created 30 Audit Movement Logs');

  console.log('🎉 Enterprise Demo Data Seeding Completed Successfully!');
};

if (require.main === module) {
  seedFullDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
