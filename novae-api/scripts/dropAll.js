import 'dotenv/config'
import pg from 'pg'

const { Client } = pg

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}
if (/xxxx|your_password|\[password\]|\[project\]/i.test(process.env.DATABASE_URL)) {
  throw new Error('DATABASE_URL still contains placeholder values')
}

try {
  new URL(process.env.DATABASE_URL)
} catch {
  throw new Error('DATABASE_URL is not a valid URL. URL-encode the password before placing it in .env.')
}

if (process.env.ALLOW_DB_RESET !== 'true' || process.env.NODE_ENV === 'production') {
  throw new Error('db:fresh requires ALLOW_DB_RESET=true and is blocked in production')
}

const client = new Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

try {
  console.log('Dropping Novae Universe database objects...')
  await client.query(`
    DROP FUNCTION IF EXISTS register_novae_star_with_worlds(JSONB, JSONB);
    DROP TABLE IF EXISTS novae_binaries CASCADE;
    DROP TABLE IF EXISTS novae_worlds CASCADE;
    DROP TABLE IF EXISTS novae_stars CASCADE;
    DROP TABLE IF EXISTS pgmigrations CASCADE;
  `)
  console.log('Database objects dropped.')
} finally {
  await client.end()
}
