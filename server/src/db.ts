import { config } from 'dotenv';
import { Pool, type PoolClient, type PoolConfig } from 'pg';

config();

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value && value.trim().length > 0);
}

function parseConnectionConfig(raw: string): PoolConfig {
  const trimmed = raw.trim();

  if (/^postgres(ql)?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    const sslMode = url.searchParams.get('sslmode');
    const host = url.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    return {
      host,
      port: url.port ? Number(url.port) : 5432,
      database: decodeURIComponent(url.pathname.replace(/^\//, '')),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      ssl: isLocal || sslMode === 'disable' ? false : { rejectUnauthorized: false },
    };
  }

  const parts = Object.fromEntries(
    trimmed
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        return [part.slice(0, index).toLowerCase(), part.slice(index + 1)];
      }),
  );

  const host = parts.host || parts.server || 'localhost';
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';

  return {
    host,
    port: parts.port ? Number(parts.port) : 5432,
    database: parts.database || parts.db,
    user: parts.username || parts.user || parts.uid,
    password: parts.password || parts.pwd,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  };
}

const connectionString =
  firstNonEmpty(process.env.DATABASE_URL, process.env.ConnectionStrings__DefaultConnection) ||
  'postgresql://postgres:postgres@localhost:5432/drivekendra_db';

if (!process.env.DATABASE_URL && !process.env.ConnectionStrings__DefaultConnection) {
  console.warn(
    '[DB] DATABASE_URL is not configured in server/.env. Defaulting to local postgresql://postgres:postgres@localhost:5432/drivekendra_db',
  );
}

export const pool = new Pool({
  ...parseConnectionConfig(connectionString),
  max: 10,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 15_000,
  application_name: 'DriveKendraMobileApi',
});

export async function withPublicClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function pingDatabase(): Promise<void> {
  await withPublicClient(async (client) => {
    await client.query('SELECT 1');
  });
}
