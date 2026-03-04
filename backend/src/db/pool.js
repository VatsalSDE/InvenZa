import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;

function buildPoolConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    };
  }

  const hasDiscreteDbConfig = [
    process.env.PGHOST,
    process.env.PGDATABASE,
    process.env.PGUSER,
    process.env.PGPASSWORD
  ].every(Boolean);

  if (!hasDiscreteDbConfig) {
    throw new Error(
      'Database configuration missing. Set DATABASE_URL (recommended for Supabase) or provide PGHOST, PGDATABASE, PGUSER, and PGPASSWORD.'
    );
  }

  return {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  };
}

export const pool = new Pool({
  ...buildPoolConfig(),
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Increased timeout to 10 seconds
  statement_timeout: 10000, // Statement timeout
  query_timeout: 10000, // Query timeout
});

// Add error handling
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}


