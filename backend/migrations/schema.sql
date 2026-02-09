-- Enable UUID extension if needed, though we use SERIAL/INTEGER for IDs as per plan
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bases Table
CREATE TABLE IF NOT EXISTS bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'commander', 'logistics')) NOT NULL,
    base_id INTEGER REFERENCES bases(id) ON DELETE SET NULL, -- Nullable for Admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Types Table
CREATE TABLE IF NOT EXISTS equipment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Vehicle, Weapon, Ammunition
    unit VARCHAR(20) NOT NULL -- units, rounds, etc.
);

-- Inventory Table (Current Balance)
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    base_id INTEGER REFERENCES bases(id) ON DELETE CASCADE,
    equipment_type_id INTEGER REFERENCES equipment_types(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(base_id, equipment_type_id)
);

-- Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    base_id INTEGER REFERENCES bases(id) ON DELETE CASCADE,
    equipment_type_id INTEGER REFERENCES equipment_types(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    purchase_date DATE DEFAULT CURRENT_DATE,
    supplier VARCHAR(255),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transfers Table
CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,
    from_base_id INTEGER REFERENCES bases(id) ON DELETE CASCADE,
    to_base_id INTEGER REFERENCES bases(id) ON DELETE CASCADE,
    equipment_type_id INTEGER REFERENCES equipment_types(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    transfer_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignments & Expenditures Table
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    base_id INTEGER REFERENCES bases(id) ON DELETE CASCADE,
    equipment_type_id INTEGER REFERENCES equipment_types(id) ON DELETE CASCADE,
    assigned_to_user_id INTEGER REFERENCES users(id), -- Can be null if expended without assignment
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    assignment_date DATE DEFAULT CURRENT_DATE,
    type VARCHAR(20) CHECK (type IN ('assigned', 'expended')),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_values JSONB, -- Requires JSONB support in PG
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
