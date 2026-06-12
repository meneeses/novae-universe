# Novae API

Backend for Novae Universe. It stores each developer as a Novae Star and each
repository as a Novae World.

## Setup

```bash
npm install
npm run migrate:up
npm run dev
```

Required runtime variables:

- `NOVAE_JWT_SECRET`
- `NOVAE_SUPABASE_URL`
- `NOVAE_SUPABASE_KEY`
- `DATABASE_URL`

## Routes

- `GET /novae/health`
- `POST /novae/auth/login`
- `GET /novae/github/:username`
- `GET /novae/stars`
- `GET /novae/stars/:username`
- `GET /novae/stars/:username/worlds`
- `GET /novae/worlds`
- `POST /novae/stars/register`
- `DELETE /novae/stars/:username`

All database changes are managed by the versioned files in `migrations/`.
