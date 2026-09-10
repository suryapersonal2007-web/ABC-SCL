import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/abc_school'

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 10,
  connectionTimeoutMillis: 10000,
})

export function getDatabase() {
  return pool
}

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      role VARCHAR(20) NOT NULL,
      username VARCHAR(100) NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      school TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (role, username)
    )
  `)
}

export async function closeDatabase() {
  await pool.end()
}
