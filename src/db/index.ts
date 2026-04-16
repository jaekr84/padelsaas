import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE?.includes('build')) {
  throw new Error('DATABASE_URL is not set');
}

// During build, we might not have the URL, but we need to satisfy the type
const sql = neon(databaseUrl || "");
export const db = drizzle(sql, { schema });
