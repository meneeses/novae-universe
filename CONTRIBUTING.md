# Contributing to Novae Universe

Thanks for your interest in contributing! Novae Universe is an indie project
maintained by a single developer. The code is public and pull requests are
welcome — read the [license terms](./LICENSE) before you start.

## Setup

```bash
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

The web app runs on [http://localhost:5173](http://localhost:5173).
The API runs on [http://localhost:3000](http://localhost:3000).

Health check: `GET /novae/health`

## Requirements

- Node.js 20+
- A Supabase project (free tier works)
- A GitHub OAuth App (for login)
- A GitHub personal access token (optional, for guest lookups)

## Environment Variables

### novae-api

Copy `novae-api/.env.example` to `novae-api/.env` and fill in the values:

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port (default: `3000`) |
| `JWT_SECRET` | Yes | Secret for signing session tokens |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `7d`) |
| `BACKEND_URL` | Yes | Public API URL used for OAuth callback |
| `FRONTEND_URL` | Yes | Frontend origin for CORS and redirects |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth App client secret |
| `GITHUB_TOKEN` | Optional | Token for public guest GitHub lookups |
| `DATABASE_URL` | Yes | Supabase PostgreSQL URI for migrations |
| `DATABASE_URL_POOL` | Optional | Pooled connection URI |

### novae-web

Copy `novae-web/.env.example` to `novae-web/.env`:

| Variable | Required | Description |
| --- | --- | --- |
| `NOVAE_API_URL` | Yes | Backend API base URL |

> **Tip:** For local development you only need the Supabase database URL,
> JWT secret, GitHub OAuth credentials, and the two base URLs. `GITHUB_TOKEN`
> is optional unless you are working on guest-mode GitHub lookups.

### Where to find the Supabase values

Open your Supabase project dashboard, then go to `Project Settings -> Database`.

- `DATABASE_URL`: Connection string URI (direct connection)
- `DATABASE_URL_POOL`: Connection pooler URI (optional, recommended for production)

URL-encode the password if it contains reserved characters.

### Where to find the GitHub OAuth values

Open GitHub and go to `Settings -> Developer settings -> OAuth Apps`.

1. Create a new OAuth App named **Novae Universe**
2. Homepage URL: `http://localhost:5173`
3. Authorization callback URL: `http://localhost:3000/auth/callback`
4. Copy the Client ID and Client Secret into `novae-api/.env`

Production callbacks must use HTTPS. Never commit secrets to the repository.

## Code Style

- JavaScript (ES modules) across the monorepo
- React + Vite for the frontend
- React Three Fiber (R3F) + drei for 3D
- Fastify for the API
- Zustand for client state

Run `npm run lint` in `novae-api/` and `novae-web/` before submitting.

## Making Changes

1. Fork the repo
2. Create a branch from `dev` (`git checkout -b feat/novae-gate-animation`)
3. Make your changes
4. Run `npm run lint` in the packages you touched
5. Commit with a clear message (e.g. `feat: add Novae Gate particle trail`)
6. Open a Pull Request against `dev` with a clear description

## What Is Welcome

- Bug fixes
- Performance improvements (frontend or backend)
- New Novae World types (biomes, shaders)
- Improvements to the Novae HUD or Novae Map
- Accessibility improvements
- Documentation and translations

## What Will Not Be Accepted

- Changes to the license or contribution terms
- Features that conflict with the project's direction
- PRs without description or context
- Heavy dependencies without clear justification
- Any change that exposes credentials or breaks security

## Intellectual Property

By submitting a pull request, you agree that:

1. Your contribution will be licensed under the [Novae Universe License v1.0](./LICENSE)
2. All intellectual property rights transfer to the project owner upon merge
3. You have the right to make the contribution

## Commit Messages

Start with a type prefix. Single line, present tense, concise.

| Type | When |
| --- | --- |
| `feat` | New features |
| `fix` | Bug fixes |
| `refactor` | Code restructuring |
| `docs` | Documentation |
| `style` | Formatting, renaming |
| `perf` | Performance |
| `chore` | Maintenance |
| `test` | Tests |
| `ci` | CI/CD |

**Examples:**

```
feat: add Novae Gate warp animation
fix: resolve Novae Star shader on dark backgrounds
docs: add GitHub OAuth setup guide
```

## Project Structure

```
novae-universe/
├── novae-web/        # React + Three.js + R3F frontend
├── novae-api/        # Node + Fastify backend
├── .github/          # Issue templates, PR template, CI workflows
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

## 3D / Three.js

The Novae Galaxy is rendered with React Three Fiber. Key areas:

- `novae-web/src/components/space/` — Novae Galaxy, Novae System, Novae World, Novae Ship
- `novae-web/src/components/ui/` — Novae HUD, Novae Map
- `novae-web/src/store/novaeStore.js` — Galaxy state and navigation

If you are adding a new Novae World biome or shader, start in
`novae-web/src/utils/novaeWorldGenerator.js`.

## Branch Strategy

| Branch | Purpose |
| --- | --- |
| `main` | Production — protected, owner merge only |
| `dev` | Active development |
| `feat/*` | New features |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation |

## Troubleshooting

**`npm run migrate:up` fails with a database error**
Make sure `DATABASE_URL` is set correctly in `novae-api/.env` and the password
is URL-encoded.

**GitHub OAuth redirect fails**
Verify `BACKEND_URL`, `FRONTEND_URL`, and the callback URL in your GitHub
OAuth App all match your local or production setup.

**The web app cannot reach the API**
Check that `NOVAE_API_URL` in `novae-web/.env` points to your running API
(default: `http://localhost:3000`).

**ESLint errors after pulling latest changes**
Run `npm install` in both `novae-api/` and `novae-web/` to pick up new
dependencies.

## Questions?

Open an issue before starting large changes. For commercial licensing, see
[LICENSE](./LICENSE) or contact meneses-joao@hotmail.com.
