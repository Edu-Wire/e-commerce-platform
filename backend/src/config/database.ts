import { Pool, PoolClient } from 'pg';
import { env } from './env';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 5,                          // Neon free tier: keep connections low
  min: 0,                          // Allow pool to shrink to 0 when idle
  idleTimeoutMillis: 10000,        // Release idle connections quickly (Neon sleeps them)
  connectionTimeoutMillis: 60000,  // 60s — generous for Neon cold starts
  ssl: { rejectUnauthorized: false }, // Required for Neon TLS
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/** Retry a DB operation up to `retries` times with exponential back-off.
 *  Catches transient Neon errors (EAI_AGAIN, ECONNRESET, auth timeout). */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('EAI_AGAIN') ||
        msg.includes('ECONNRESET') ||
        msg.includes('Authentication timed out') ||
        msg.includes('Connection terminated') ||
        msg.includes('connect ETIMEDOUT');
      if (!isTransient || attempt === retries) throw err;
      console.warn(`[DB] Transient error on attempt ${attempt}/${retries}, retrying in ${delayMs}ms…`, msg);
      await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }
  throw lastErr;
}

export async function query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]> {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (env.nodeEnv === 'development') {
    console.log('query', { text: text.slice(0, 80), duration, rows: res.rowCount });
  }
  return res.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
