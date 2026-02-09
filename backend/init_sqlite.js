const db = require('./src/config/db_sqlite');
const fs = require('fs');
const path = require('path');

async function initSqlite() {
    console.log('Initializing SQLite Database...');
    
    // Read schema but remove PostgreSQL specific syntax
    // 1. remove "SERIAL PRIMARY KEY" -> "INTEGER PRIMARY KEY AUTOINCREMENT"
    // 2. remove "timestamp DEFAULT CURRENT_TIMESTAMP" -> "DATETIME DEFAULT CURRENT_TIMESTAMP"
    // 3. remove "jsonb" -> "TEXT" (SQLite stores JSON as text)
    // 4. remove "CASCADE" in drop constraints (SQLite doesn't use it same way in CREATE) - actually, mostly standard SQL is fine apart from types.

    const client = await db.pool.connect();

    try {
        await client.query('PRAGMA foreign_keys = ON;');

        // Users
        await client.query(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'commander', 'logistics')),
            base_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Bases
        await client.query(`CREATE TABLE IF NOT EXISTS bases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Equipment Types
        await client.query(`CREATE TABLE IF NOT EXISTS equipment_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            unit TEXT NOT NULL
        )`);

        // Inventory
        await client.query(`CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            base_id INTEGER REFERENCES bases(id),
            equipment_type_id INTEGER REFERENCES equipment_types(id),
            current_balance INTEGER DEFAULT 0 CHECK(current_balance >= 0),
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(base_id, equipment_type_id)
        )`);

        // Purchases
        await client.query(`CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            base_id INTEGER REFERENCES bases(id),
            equipment_type_id INTEGER REFERENCES equipment_types(id),
            quantity INTEGER NOT NULL CHECK(quantity > 0),
            supplier TEXT,
            purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            created_by INTEGER REFERENCES users(id),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Transfers
        await client.query(`CREATE TABLE IF NOT EXISTS transfers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_base_id INTEGER REFERENCES bases(id),
            to_base_id INTEGER REFERENCES bases(id),
            equipment_type_id INTEGER REFERENCES equipment_types(id),
            quantity INTEGER NOT NULL CHECK(quantity > 0),
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
            notes TEXT,
            created_by INTEGER REFERENCES users(id),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Assignments
        await client.query(`CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            base_id INTEGER REFERENCES bases(id),
            equipment_type_id INTEGER REFERENCES equipment_types(id),
            assigned_to_user_id INTEGER REFERENCES users(id),
            quantity INTEGER NOT NULL CHECK(quantity > 0),
            type TEXT NOT NULL CHECK(type IN ('assigned', 'expended')),
            notes TEXT,
            created_by INTEGER REFERENCES users(id),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Audit Logs (simplified JSON handling)
        await client.query(`CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id INTEGER,
            old_values TEXT, 
            new_values TEXT,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        console.log('✅ SQLite Tables Initialized Successfully!');

    } catch (err) {
        console.error('❌ Initialization Failed:', err);
    }
}

initSqlite();
