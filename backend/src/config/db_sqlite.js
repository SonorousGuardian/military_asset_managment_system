const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../military_assets.sqlite');
const db = new sqlite3.Database(dbPath);

console.log(`Connected to SQLite database at ${dbPath}`);

// Simple wrapper to mimic pg's query interface (basic support)
// Note: transforming $1, $2 to ?, ? is complex for robust cases, 
// so we'll do a simple regex replacement for this fallback implementation.

const query = (text, params = []) => {
    return new Promise((resolve, reject) => {
        // Convert $1, $2, etc to ?
        const sql = text.replace(/\$\d+/g, '?').replace(/FOR UPDATE/gi, '');
        
        // Determine method based on query type
        // Fix: INSERT/UPDATE with RETURNING need 'all' to get the returned rows
        const isSelect = text.trim().toUpperCase().startsWith('SELECT');
        const hasReturning = text.toUpperCase().includes('RETURNING');
        
        const method = (isSelect || hasReturning) ? 'all' : 'run';

        db[method](sql, params, function(err, rows) {
            if (err) {
                console.error('SQLite Error:', err.message, 'Query:', sql);
                return reject(err);
            }
            
            // Format result to match PG structure
            // For INSERT/UPDATE/DELETE, 'this' contains changes/lastID
            // For SELECT, 'rows' contains the data
            if (method === 'run') {
                resolve({ 
                    rows: rows || [], 
                    rowCount: this.changes, 
                    lastID: this.lastID // Custom field not in PG, but useful
                });
            } else {
                resolve({ rows: rows, rowCount: rows.length });
            }
        });
    });
};

// Start a transaction (not fully supported in this simple wrapper for async/await same way as pg pool client)
// We'll return a dummy client that just executes queries directly on the db connection for simplicity in this fallback.
// In a real app, you'd use a better transaction manager or ORM.
const getClient = async () => {
    return {
        query: query,
        release: () => {}, // No-op for SQLite
        // Basic transaction support
        query: async (text, params) => {
             if (text === 'BEGIN') return query('BEGIN TRANSACTION');
             if (text === 'COMMIT') return query('COMMIT');
             if (text === 'ROLLBACK') return query('ROLLBACK');
             return query(text, params);
        }
    };
};

module.exports = {
    query,
    pool: { connect: getClient }, // Mock pool interface
    dbPath
};
