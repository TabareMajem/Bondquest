import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

// For development, we'll use in-memory storage instead of requiring a database
const DATABASE_URL = process.env.DATABASE_URL;

let db: any = null;

if (DATABASE_URL) {
  // Production database connection
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });
  
  db = drizzle(pool, { schema });
  console.log('✅ Connected to PostgreSQL database');
} else {
  // Development mode - use in-memory storage
  console.log('🔧 Development mode: Using in-memory storage (no database required)');
  db = null; // Will use MemStorage instead
}

export { db };