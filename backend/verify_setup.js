const { Client } = require('pg');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
};

console.log('--- Database Connection Verification ---');
console.log(`Target: ${config.host}:${config.port}`);
console.log(`User:   ${config.user}`);
console.log('----------------------------------------');

const client = new Client(config);

async function checkConnection() {
  try {
    console.log('Attempting to connect...');
    await client.connect();
    console.log('✅ Connection Successful!');
    
    const res = await client.query('SELECT datname FROM pg_database WHERE datname = $1', [process.env.DB_NAME || 'military_assets']);
    if (res.rowCount > 0) {
        console.log(`✅ Database "${process.env.DB_NAME}" exists.`);
    } else {
        console.log(`❌ Database "${process.env.DB_NAME}" fails check (might not exist yet).`);
        console.log(`   Run 'node setup_db.js' to create it.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Connection Failed!');
    console.error('Error Details:', err.message);
    console.log('\nTroubleshooting Hints:');
    console.log('1. Ensure PostgreSQL service is started.');
    console.log('2. Verify username/password in backend/.env');
    console.log('3. Check if standard port 5432 is being used.');
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

checkConnection();
