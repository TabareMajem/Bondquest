import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection to become available
});

// Test the database connection but don't keep it open
(async () => {
  const client = await pool.connect();
  try {
    console.log('Connected to PostgreSQL database');
  } catch (err) {
    console.error('Database connection error:', err instanceof Error ? err.message : String(err));
  } finally {
    client.release(); // Important: Release the client back to the pool
  }
})().catch(err => console.error('Database initialization error:', err instanceof Error ? err.message : String(err)));

export const db = drizzle(pool, { schema });