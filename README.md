# Novae Universe

**A living universe built from GitHub. Every developer is a Novae Star. Every repository, a Novae World.**

---

## What is Novae Universe?

Novae Universe transforms every GitHub profile into a living star system. Each
developer becomes a **Novae Star**. Each repository orbits as a **Novae World**.
The more you contribute, the more mass your worlds gain. Explore the **Novae
Galaxy** in 3D, pilot your **Novae Ship**, and discover systems from developers
around the world.

## Features

- **Novae Galaxy** — Explorable 3D universe shared by all visitors
- **Novae Ship** — Navigable spacecraft with physics and proximity detection
- **Novae System** — One star system per developer, generated from their GitHub profile
- **Novae World** — Procedurally generated worlds from repositories (biomes, rings, moons)
- **Novae Pulse** — Gravitational wave visuals that propagate on GitHub events
- **Novae Gate** — Portals to travel between regions of the galaxy
- **Novae HUD / Novae Map** — In-flight navigation and system overview
- **GitHub OAuth** — Sign in to claim your Novae Star and register your system

## How Star Systems Work

| Metric | Affects | Example |
| --- | --- | --- |
| Commits | Novae World mass | More commits → larger world |
| Stars | Novae World moons | More stars → more moons orbiting |
| Public repos | Worlds in system | Each repo → one Novae World |
| Collaborations | Binary systems | Shared work → linked Novae Stars |
| Recent activity | Novae Pulse intensity | New events → stronger gravitational waves |

Worlds are rendered with React Three Fiber. Close systems show full detail —
atmospheres, rings, and moon orbits; distant objects use simplified geometry
for performance.

## Tech Stack

- **Frontend:** [React](https://react.dev) + [Vite](https://vite.dev), [Three.js](https://threejs.org) via [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) + [drei](https://github.com/pmndrs/drei)
- **State:** [Zustand](https://github.com/pmndrs/zustand)
- **Backend:** [Node.js](https://nodejs.org) + [Fastify](https://fastify.dev), JWT sessions
- **Database:** [Supabase](https://supabase.com) (PostgreSQL)
- **Hosting:** [Vercel](https://vercel.com) (web), [Railway](https://railway.app) (api)

## Getting Started

```bash
# Clone the repo
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

Open [http://localhost:5173](http://localhost:5173) to enter the Novae Galaxy.

Health check: `GET http://localhost:3000/novae/health`

## Environment Setup

After copying the `.env.example` files, fill in these values:

- `JWT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — required for auth
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `NOVAE_API_URL` — backend URL for the web app

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full variable reference.

### Where to find the Supabase values

Open your Supabase project dashboard, then go to `Project Settings -> Database`.

- `DATABASE_URL`: direct connection URI
- `DATABASE_URL_POOL`: pooler URI (optional, recommended for production)

### Where to find the GitHub OAuth values

Open GitHub and go to `Settings -> Developer settings -> OAuth Apps`.

1. Create a new OAuth App named **Novae Universe**
2. Homepage URL: `http://localhost:5173`
3. Authorization callback URL: `http://localhost:3000/auth/callback`
4. Copy the Client ID and Client Secret into `novae-api/.env`

### Where to find the GitHub token

Open GitHub and go to `Settings -> Developer settings -> Personal access tokens`.

- Fine-grained tokens are recommended for minimum required access
- Classic tokens also work if that fits your setup better

Create a token and place it in `GITHUB_TOKEN` inside `novae-api/.env`. This is
optional — only needed for guest-mode GitHub lookups.

## Contributing

Pull requests are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before
opening a PR.

## License

[Novae Universe License v1.0](./LICENSE) — You can view the code and contribute
via pull requests, but hosting, redistributing, or using this software
commercially requires written permission from the copyright holder.

---

<p align="center">
  Built by <a href="https://github.com/meneeses">@meneeses</a>
</p>
