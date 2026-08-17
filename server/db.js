import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Support both DATABASE_URL and discrete connection environment variables
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        database: process.env.POSTGRES_DB || 'livingdex'
      }
);

// Initialize DB schema automatically
export async function initDb() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL Database');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create pokemon_caught table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pokemon_caught (
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        pokemon_id INT NOT NULL,
        caught BOOLEAN DEFAULT FALSE,
        status VARCHAR(32) DEFAULT 'uncaught',
        notes TEXT,
        caught_in_game VARCHAR(64),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, pokemon_id)
      );
    `);

    // Ensure status column exists if updating existing database
    await client.query(`
      ALTER TABLE pokemon_caught ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'uncaught';
    `);

    client.release();
    console.log('✅ PostgreSQL Schema initialized successfully');
  } catch (err) {
    console.error('⚠️ PostgreSQL Connection/Initialization Warning:', err.message);
  }
}

export default pool;
