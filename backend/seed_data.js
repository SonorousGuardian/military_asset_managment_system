const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function seedData() {
  const client = await db.pool.connect();
  try {
    console.log('Seeding data...');
    
    // Clear existing
    await client.query('TRUNCATE users, bases, equipment_types, purchases, transfers, assignments, inventory RESTART IDENTITY CASCADE');

    // 1. Bases
    const basesRes = await client.query(`
      INSERT INTO bases (name, location) VALUES 
      ('Alpha Base', 'Nevada'),
      ('Bravo Base', 'Texas'),
      ('Delta Outpost', 'Germany')
      RETURNING *
    `);
    const [alpha, bravo, delta] = basesRes.rows;
    console.log('Bases created: Alpha, Bravo, Delta');

    // 2. Equipment Types
    const equipRes = await client.query(`
      INSERT INTO equipment_types (name, category, unit) VALUES 
      ('M1 Abrams Tank', 'Vehicle', 'units'),
      ('F-35 Lightning II', 'Vehicle', 'units'),
      ('M4 Carbine', 'Weapon', 'units'),
      ('5.56mm Ammo', 'Ammunition', 'rounds')
      RETURNING *
    `);
    const [tank, jet, rifle, ammo] = equipRes.rows;
    console.log('Equipment created: Tank, Jet, Rifle, Ammo');

    // 3. Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    const usersRes = await client.query(`
      INSERT INTO users (username, password_hash, role, base_id) VALUES 
      ('admin', $1, 'admin', null),
      ('commander_alpha', $1, 'commander', $2),
      ('logistics_bravo', $1, 'logistics', $3)
      RETURNING *
    `, [hashedPassword, alpha.id, bravo.id]);
    console.log('Users created: admin, commander_alpha, logistics_bravo (password: password123)');

    const admin = usersRes.rows[0];

    // 4. Initial Purchases (Seed Inventory)
    // Buy 10 Tanks for Alpha
    await client.query(`
        INSERT INTO purchases (base_id, equipment_type_id, quantity, supplier, purchase_date, created_by)
        VALUES ($1, $2, 10, 'General Dynamics', NOW(), $3)
    `, [alpha.id, tank.id, admin.id]);
    
    await client.query(`
        INSERT INTO inventory (base_id, equipment_type_id, current_balance)
        VALUES ($1, $2, 10)
    `, [alpha.id, tank.id]);

    // Buy 1000 Rifles for Bravo
    await client.query(`
        INSERT INTO purchases (base_id, equipment_type_id, quantity, supplier, purchase_date, created_by)
        VALUES ($1, $2, 1000, 'Colt Defense', NOW(), $3)
    `, [bravo.id, rifle.id, admin.id]);

    await client.query(`
        INSERT INTO inventory (base_id, equipment_type_id, current_balance)
        VALUES ($1, $2, 1000)
    `, [bravo.id, rifle.id]);

    console.log('Seed data inserted successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedData();
