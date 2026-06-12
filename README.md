# Novae Universe

![License](https://img.shields.io/badge/license-Novae%20v1.0-blueviolet)
![Status](https://img.shields.io/badge/status-in%20development-blue)
![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen)

A living universe built from GitHub.
Every developer is a Novae Star. Every repository, a Novae World.

<!-- GIF or screenshot placeholder -->

## About

Novae Universe transforms GitHub profiles into living star systems. Each
developer is a **Novae Star**. Each repository orbits as a **Novae World**.
Commits define world mass. Stars define moons. Collaborations create binary
systems. **Novae Pulses** propagate with every event across the **Novae Galaxy**.

## Features

- **Novae Galaxy** — explorable 3D universe
- **Novae Ship** — navigable spacecraft with physics
- **Novae System** — one star system per developer
- **Novae World** — procedurally generated from each repository
- **Novae Pulse** — visual gravitational waves on events
- **Novae Gate** — portals between regions
- GitHub OAuth login
- Shared universe visitable by anyone

## Tech Stack

| Layer    | Technologies                                              |
| -------- | --------------------------------------------------------- |
| Frontend | React, Vite, Three.js, React Three Fiber, Zustand        |
| Backend  | Node.js, Fastify, JWT                                    |
| Database | Supabase (PostgreSQL)                                     |
| Deploy   | Vercel (web), Railway (api)                               |

## Getting Started

```bash
# Clone
git clone https://github.com/meneeses/novae-universe.git
cd novae-universe

# API
cd novae-api
cp .env.example .env
npm install
npm run migrate:up
npm run dev

# Web (new terminal)
cd novae-web
cp .env.example .env
npm install
npm run dev
```

Health check: `GET /novae/health`

The web app runs at `http://localhost:5173`. The API runs at
`http://localhost:3000`.

## Environment Variables

### novae-api

| Variable            | Required | Description                                              |
| ------------------- | -------- | -------------------------------------------------------- |
| `PORT`              | No       | API port (default: `3000`)                               |
| `JWT_SECRET`        | Yes      | Secret for signing session tokens                        |
| `JWT_EXPIRES_IN`    | No       | Token lifetime (default: `7d`)                           |
| `BACKEND_URL`       | Yes      | Public API URL used for OAuth callback                   |
| `FRONTEND_URL`      | Yes      | Frontend origin for CORS and post-login redirects        |
| `GITHUB_CLIENT_ID`  | Yes      | GitHub OAuth App client ID                               |
| `GITHUB_CLIENT_SECRET` | Yes   | GitHub OAuth App client secret                           |
| `GITHUB_TOKEN`      | No       | Optional token for public guest GitHub lookups           |
| `DATABASE_URL`      | Yes      | Supabase PostgreSQL connection URI for migrations      |
| `DATABASE_URL_POOL` | No       | Pooled connection URI (falls back to `DATABASE_URL`)   |

See [`novae-api/.env.example`](./novae-api/.env.example) for placeholders.

### novae-web

| Variable         | Required | Description                          |
| ---------------- | -------- | ------------------------------------ |
| `NOVAE_API_URL`  | Yes      | Backend API base URL                 |

See [`novae-web/.env.example`](./novae-web/.env.example).

## Setup GitHub OAuth

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
2. Application name: **Novae Universe**
3. Homepage URL: `http://localhost:5173`
4. Authorization callback URL: `http://localhost:3000/auth/callback`
5. Copy Client ID and Client Secret into `novae-api/.env`

Production callbacks must use HTTPS. Never commit secrets to the repository.

## Branch Strategy

```
main      → production, protected, owner merge only
dev       → active development
feat/*    → new features
fix/*     → bug fixes
docs/*    → documentation
```

Recommended branch protection on `main`:

- Require pull request before merging
- Require approvals: 1 (owner only)
- Require status checks: `lint`, `build`
- No force push
- No direct push

## Repository Structure

```
novae-universe/
├── novae-web/        ← React + Three.js + R3F
├── novae-api/        ← Node + Fastify
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── pull_request_template.md
│   └── workflows/
├── LICENSE
├── CONTRIBUTING.md
├── README.md
└── .gitignore
```

## Nomenclature

| Term          | Meaning                              |
| ------------- | ------------------------------------ |
| Novae Galaxy  | The main explorable universe         |
| Novae System  | A developer's star system            |
| Novae Star    | A developer                          |
| Novae World   | A repository                         |
| Novae Gate    | Portal between regions               |
| Novae Ship    | The player's spacecraft              |
| Novae Pulse   | Gravitational wave of events         |
| Novae HUD     | Heads-up display                     |
| Novae Map     | Navigation map                       |

## Contributing

Contributions are welcome via pull request. Read [CONTRIBUTING.md](./CONTRIBUTING.md)
before opening a PR.

## License

The code is visible and contributions are welcome, but commercial use and
redistribution are prohibited without written permission. See [LICENSE](./LICENSE).

## Author

**João Meneses**

- GitHub: [@meneeses](https://github.com/meneeses)
- Commercial licensing: meneses-joao@hotmail.com
