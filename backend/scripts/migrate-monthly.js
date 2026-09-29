const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: process.argv[2] || '.env', quiet: true });
const { Pool } = require('pg');
// Migrations require a direct connection, never PgBouncer session state.
const url = new URL(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
url.hostname = url.hostname.replace('-pooler.', '.');
const pool = new Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: true } });
(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query('SELECT pg_advisory_xact_lock(9032026)');
    await client.query(fs.readFileSync(path.join(__dirname, '../migrations/001_resumen_mensual.sql'), 'utf8'));
    await client.query('COMMIT');
    console.log('Migración mensual aplicada; registros existentes conservados.');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
})().catch(error => { console.error('Migración fallida:', error.code || error.message); process.exitCode = 1; }).finally(() => pool.end());
