import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

function validateConnectionString(connectionString) {
  if (!connectionString) {
    throw new Error('DATABASE_URL or DATABASE_URL_POOL is required')
  }

  if (/xxxx|your_password|\[password\]|\[project\]/i.test(connectionString)) {
    throw new Error('DATABASE_URL still contains placeholder values. Add the real Supabase URI.')
  }

  try {
    new URL(connectionString)
  } catch {
    throw new Error('DATABASE_URL is not a valid URL. URL-encode the password before placing it in .env.')
  }
}

const connectionString = process.env.DATABASE_URL_POOL || process.env.DATABASE_URL

validateConnectionString(connectionString)

export const pool = new Pool({ connectionString })

export async function withDatabaseClient(callback) {
  const client = await pool.connect()
  try {
    return await callback(client)
  } finally {
    client.release()
  }
}