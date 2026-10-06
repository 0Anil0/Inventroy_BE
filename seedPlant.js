const { Client } = require('pg');
const client = new Client('postgres://postgres:test@localhost:5432/Inventory_Management');
client.connect().then(() => {
  return client.query("INSERT INTO plants (name, code, address, status, created_at, updated_at) VALUES ('Main Plant', 'P01', '123 Main St', 'active', NOW(), NOW()) ON CONFLICT (code) DO NOTHING;");
}).then(() => {
  console.log("Seeded plant.");
  client.end();
}).catch(console.error);
