export default {
  databaseUrl: process.env.DATABASE_URL,
  dir: 'migrations',
  direction: 'up',
  migrationsTable: 'pgmigrations',
  schema: 'public',
  ignorePattern: '(?!\\d{3}_.+\\.js$).*',
  count: Infinity,
  decamelize: true,
  verbose: true
}
