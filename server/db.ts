import * as schema from '../shared/schema';

// For development, we'll use in-memory storage instead of requiring a database
const DATABASE_URL = process.env.DATABASE_URL;

let db: any = null;

// Development mode - always use in-memory storage for now
console.log('🔧 Development mode: Using in-memory storage (no database required)');
db = null; // Will use MemStorage instead

// Note: To use PostgreSQL in production, set DATABASE_URL environment variable

export { db };