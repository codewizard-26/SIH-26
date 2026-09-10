import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../config/env.js';
import * as schema from './schema.js';

const { Pool } = pg;

let pool = null;
let db = null;

if (env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
    });
    db = drizzle(pool, { schema });
  } catch (error) {
    console.warn('Database connection initialization failed:', error.message);
  }
} else {
  console.info('DATABASE_URL not configured. Running in stand-alone / memory mode for development.');
}

export { pool, db, schema };
