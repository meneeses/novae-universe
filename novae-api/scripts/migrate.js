import 'dotenv/config'
import { readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runner } from 'node-pg-migrate'
import pg from 'pg'
import config from '../.node-pg-migrate.js'

const { Client } = pg
const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const migrationsDirectory = path.resolve(rootDirectory, config.dir)
const args = process.argv.slice(2)
const action = args[0]
const migrationLogger = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error(message, ...details) {
    // node-pg-migrate expects timestamp prefixes, while this project mandates NNN.
    if (typeof message === 'string' && /^Can't determine timestamp for \d{3}$/.test(message)) {
      return
    }
    console.error(message, ...details)
  }
}

function option(name, fallback) {
  const index = args.indexOf(`--${name}`)
  if (index === -1) return fallback
  return args[index + 1]
}

function requireDatabaseUrl() {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required. Add the Supabase PostgreSQL URI to .env.')
  }
  if (/xxxx|your_password|\[password\]|\[project\]/i.test(config.databaseUrl)) {
    throw new Error('DATABASE_URL still contains placeholder values. Add the real Supabase URI.')
  }

  return config.databaseUrl
}

function validateConnectionString(connectionString) {
  try {
    new URL(connectionString)
  } catch {
    throw new Error('DATABASE_URL is not a valid URL. URL-encode the password before placing it in .env.')
  }
}

function migrationOptions(direction, count = config.count) {
  return {
    databaseUrl: requireDatabaseUrl(),
    dir: migrationsDirectory,
    direction,
    migrationsTable: config.migrationsTable,
    schema: config.schema,
    ignorePattern: config.ignorePattern,
    count,
    decamelize: config.decamelize,
    verbose: config.verbose,
    logger: migrationLogger,
    checkOrder: true,
    singleTransaction: true
  }
}

function parseCount(defaultCount) {
  const count = Number(option('count', defaultCount))
  if (count !== Infinity && (!Number.isInteger(count) || count < 1)) {
    throw new Error('--count must be a positive integer')
  }
  return count
}

async function migrate(direction, defaultCount) {
  const count = parseCount(defaultCount)
  await runner(migrationOptions(direction, count))
}

async function redo() {
  const count = parseCount(1)
  await runner(migrationOptions('down', count))
  await runner(migrationOptions('up', count))
}

async function reset() {
  if (process.env.ALLOW_DB_RESET !== 'true' || process.env.NODE_ENV === 'production') {
    throw new Error('db:reset requires ALLOW_DB_RESET=true and is blocked in production')
  }

  await runner(migrationOptions('down', Infinity))
  await runner(migrationOptions('up', Infinity))
}

async function status() {
  const files = (await readdir(migrationsDirectory))
    .filter((file) => /^\d{3}_.+\.js$/.test(file))
    .sort()
  const connectionString = requireDatabaseUrl()
  validateConnectionString(connectionString)
  const client = new Client({ connectionString })
  await client.connect()

  try {
    const table = config.migrationsTable.replaceAll('"', '""')
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1 AND table_name = $2
    `, [config.schema, config.migrationsTable])
    const applied = result.rowCount
      ? new Set((await client.query(
          `SELECT name FROM "${config.schema}"."${table}" ORDER BY run_on, id`
        )).rows.map(({ name }) => name))
      : new Set()

    for (const file of files) {
      const migrationName = file.replace(/\.js$/, '')
      console.log(`${applied.has(migrationName) ? 'up  ' : 'down'} ${file}`)
    }
  } finally {
    await client.end()
  }
}

async function create() {
  const rawName = option('name', args[1])
  const name = rawName?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

  if (!name) {
    throw new Error('Migration name is required. Use migrate:create -- --name add_feature.')
  }

  const files = await readdir(migrationsDirectory)
  const nextNumber = files.reduce((highest, file) => {
    const number = Number.parseInt(file.match(/^(\d{3})_/)?.[1] ?? '0', 10)
    return Math.max(highest, number)
  }, 0) + 1
  const filename = `${String(nextNumber).padStart(3, '0')}_${name}.js`
  const template = `export const up = (pgm) => {\n  // Add migration operations.\n}\n\nexport const down = (pgm) => {\n  // Reverse migration operations.\n}\n`

  await writeFile(path.join(migrationsDirectory, filename), template, { flag: 'wx' })
  console.log(`Created migrations/${filename}`)
}

const actions = {
  up: () => migrate('up', Infinity),
  down: () => migrate('down', 1),
  redo,
  reset,
  status,
  create
}

if (!actions[action]) {
  throw new Error('Action must be one of: up, down, redo, reset, status, create')
}

await actions[action]()
