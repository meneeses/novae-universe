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

- `JWT_SECRET`
- `JWT_EXPIRES_IN` (defaults to `7d`)
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `BACKEND_URL`
- `FRONTEND_URL`
- `DATABASE_URL`
- `DATABASE_URL_POOL` (optional, falls back to `DATABASE_URL`)

## Setup OAuth

1. Open [GitHub Developer Settings](https://github.com/settings/developers).
2. Create a new OAuth App named `Novae Universe`.
3. Set Homepage URL to `http://localhost:5173` in development, or the production frontend URL.
4. Set Authorization callback URL to `http://localhost:3000/auth/callback`.
5. Copy the Client ID and Client Secret into the backend `.env`.

Production OAuth callbacks must use HTTPS. Keep `GITHUB_CLIENT_SECRET` only in
the backend environment.

## Routes

- `GET /novae/health`
- `GET /auth/github`
- `GET /auth/callback`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /novae/github/:username`
- `GET /novae/stars`
- `GET /novae/stars/:username`
- `GET /novae/stars/:username/worlds`
- `GET /novae/worlds`
- `POST /novae/stars/register`
- `DELETE /novae/stars/:username`

All database changes are managed by the versioned files in `migrations/`.
