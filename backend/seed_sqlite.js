const db = require('./src/config/db_sqlite');
const bcrypt = require('bcryptjs');

async function seedSqlite() {
    console.log('Seeding SQLite Data...');
    const client = await db.pool.connect();

    try {
        // Clear existing data
        await client.query('DELETE FROM users');
        await client.query('DELETE FROM bases');
        await client.query('DELETE FROM equipment_types');
        await client.query('DELETE FROM inventory');
        await client.query('DELETE FROM purchases');
        await client.query('DELETE FROM transfers');
        await client.query('DELETE FROM assignments');
        // Reset sequences
        await client.query('DELETE FROM sqlite_sequence');

        // 1. Bases
        await client.query("INSERT INTO bases (name, location) VALUES ('Alpha Base', 'Nevada')");
        await client.query("INSERT INTO bases (name, location) VALUES ('Bravo Base', 'Texas')");
        await client.query("INSERT INTO bases (name, location) VALUES ('Delta Outpost', 'Germany')");

        // Get IDs
        const bases = (await client.query("SELECT * FROM bases")).rows;
        const [alpha, bravo, delta] = bases;

        // 2. Equipment
        await client.query("INSERT INTO equipment_types (name, category, unit) VALUES ('M1 Abrams Tank', 'Vehicle', 'units')");
        await client.query("INSERT INTO equipment_types (name, category, unit) VALUES ('F-35 Lightning II', 'Vehicle', 'units')");
        await client.query("INSERT INTO equipment_types (name, category, unit) VALUES ('M4 Carbine', 'Weapon', 'units')");
        await client.query("INSERT INTO equipment_types (name, category, unit) VALUES ('5.56mm Ammo', 'Ammunition', 'rounds')");

        const equipment = (await client.query("SELECT * FROM equipment_types")).rows;
        const [tank, jet, rifle, ammo] = equipment;

        // 3. Users
        const passwordHash = await bcrypt.hash('password123', 10);
        
        await client.query("INSERT INTO users (username, password_hash, role, base_id) VALUES (?, ?, 'admin', NULL)", ['admin', passwordHash]);
        const adminId = (await client.query("SELECT last_insert_rowid() as id")).rows[0].lastID || 1; // get proper ID from sqlite3 wrapper output logic if needed, or re-select. 
        // Note: my wrapper returns lastID in the result object for 'run'.
        
        // Actually, for my wrapper:
        // 'INSERT' returns { rows: [], rowCount: 1, lastID: 1 }
        
        await client.query("INSERT INTO users (username, password_hash, role, base_id) VALUES (?, ?, 'commander', ?)", ['commander_alpha', passwordHash, alpha.id]);
        await client.query("INSERT INTO users (username, password_hash, role, base_id) VALUES (?, ?, 'logistics', ?)", ['logistics_bravo', passwordHash, bravo.id]);

        console.log('Users created: admin, commander_alpha, logistics_bravo');

        // 4. Purchases & Inventory
        // 10 Tanks for Alpha
        await client.query("INSERT INTO purchases (base_id, equipment_type_id, quantity, supplier, created_by) VALUES (?, ?, 10, 'General Dynamics', ?)", [alpha.id, tank.id, adminId]);
        await client.query("INSERT INTO inventory (base_id, equipment_type_id, current_balance) VALUES (?, ?, 10)", [alpha.id, tank.id]);

        // 1000 Rifles for Bravo
        await client.query("INSERT INTO purchases (base_id, equipment_type_id, quantity, supplier, created_by) VALUES (?, ?, 1000, 'Colt Defense', ?)", [bravo.id, rifle.id, adminId]);
        await client.query("INSERT INTO inventory (base_id, equipment_type_id, current_balance) VALUES (?, ?, 1000)", [bravo.id, rifle.id]);

        console.log('✅ SQLite Database Seeded Successfully!');

    } catch (err) {
        console.error('❌ Seeding Failed:', err);
    }
}

seedSqlite();
