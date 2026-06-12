# Database migrations

`node-pg-migrate` manages the PostgreSQL schema directly through
`DATABASE_URL`. Docker and the Supabase CLI are not required.

## Setup

Copy the direct PostgreSQL connection URI from Supabase:

`Settings > Database > Connection string > URI`

If the password contains reserved characters such as `#`, `@` or `$`, URL-encode
the password before pasting the URI into `.env`. If your local driver rejects
the certificate chain, use `sslmode=no-verify` for the migration URI.

Add it to `.env`:

```dotenv
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres?sslmode=no-verify
DATABASE_URL_POOL=postgresql://postgres:[password]@db.[project].supabase.co:6543/postgres?sslmode=no-verify
```

Use the direct connection on port `5432` for migrations. The pooler URL is
intended for application traffic, not schema migrations.

## Commands

```bash
npm run migrate:status
npm run migrate:up
npm run migrate:down
npm run migrate:down -- --count 2
npm run migrate:redo
npm run migrate:create -- --name add_novae_world_texture_seed
```

Destructive development commands require `ALLOW_DB_RESET=true` and are blocked
when `NODE_ENV=production`:

```bash
ALLOW_DB_RESET=true npm run db:reset
ALLOW_DB_RESET=true npm run db:fresh
```

## Rules

- Never edit an applied migration. Create a new numbered migration.
- Every migration must implement `up` and `down`.
- Migrations run in a transaction and are tracked in `public.pgmigrations`.
- Run migrations before deploying a backend version that depends on them.
