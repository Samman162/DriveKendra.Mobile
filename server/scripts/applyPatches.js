import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server/.env
config({ path: path.resolve(__dirname, '../.env') });

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://postgres:${process.env.POSTGRES_PASSWORD || '321'}@localhost:5432/car_rental_db`;

const pool = new pg.Pool({
  connectionString,
  ssl: false,
});

async function run() {
  const patchesDir = path.resolve(__dirname, '../../database/patches');
  console.log(`[Patches] Connecting to PostgreSQL at ${connectionString.replace(/:[^:@]+@/, ':****@')}...`);
  
  const client = await pool.connect();
  try {
    const files = fs
      .readdirSync(patchesDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`[Patches] Found ${files.length} patches to apply:`, files);

    for (const file of files) {
      const filePath = path.join(patchesDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`[Patches] Applying ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`[Patches] ✓ Successfully applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Patches] ✗ Error applying ${file}:`, err.message);
        throw err;
      }
    }

    console.log('[Patches] All patches applied successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('[Patches] Fatal error:', err);
  process.exit(1);
});
