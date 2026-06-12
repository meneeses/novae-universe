# 🌌 DevUniverse

[![Live Demo](https://img.shields.io/badge/Live-Demo-7c4dff)](https://devuniverse.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/your-username/devuniverse)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

DevUniverse transforms public GitHub activity into an explorable 3D universe.
Every developer becomes a procedurally generated planet whose terrain, biome,
moons, rings, and atmosphere reflect their repositories and community.

The same username always produces the same planet. Developers can launch a
ship, explore the shared universe, approach other planets, and visit their
GitHub profiles without external textures or a traditional game engine.

## Features

- Deterministic procedural planets generated from GitHub data
- Custom GLSL terrain shaders and language-based biomes
- Shared universe backed by Supabase
- Guest exploration without mandatory login
- Central animated solar system with a procedural Earth landmark
- Teleport portals connecting the solar system and developer regions
- Controllable spacecraft with smooth manual physics
- Always-forward flight model with thrust, braking, yaw, and cinematic banking
- Empty-zone warning with automatic return to the solar system
- Cinematic follow camera, exhaust particles, starfield, fog, and minimap
- Planet proximity cards and GitHub profile links
- JWT-protected writes, rate limiting, RLS, CORS, and security headers
- Responsive landing page with staged loading and global error handling

## Tech Stack

- **Frontend:** React 18, Vite, Three.js, React Three Fiber, Drei, Zustand
- **Backend:** Node.js, Fastify, Supabase, GitHub API
- **Deploy:** Vercel for the frontend, Railway or Oracle Cloud for the backend

## Getting Started

### Prerequisites

- Node.js 20.19 or newer
- A Supabase project
- Optional GitHub personal access token for higher API rate limits

### Backend Setup

1. Execute [`devuniverse-api/supabase/schema.sql`](devuniverse-api/supabase/schema.sql)
   in the Supabase SQL editor.
2. Copy `devuniverse-api/.env.example` to `devuniverse-api/.env`.
3. Configure the backend environment variables.
4. Install dependencies and start the API:

```bash
cd devuniverse-api
npm install
npm run dev
```

The health check is available at `http://localhost:3333/health`.

### Frontend Setup

1. Copy `devuniverse-web/.env.example` to `devuniverse-web/.env`.
2. Set `VITE_API_URL` to the backend URL.
3. Install dependencies and start Vite:

```bash
cd devuniverse-web
npm install
npm run dev
```

### Environment Variables

| Variable | App | Required | Description |
| --- | --- | --- | --- |
| `PORT` | Backend | No | API port, defaults to `3333` |
| `JWT_SECRET` | Backend | Yes | Strong secret used to sign JWTs |
| `SUPABASE_URL` | Backend | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Yes | Server-only Supabase key |
| `GITHUB_TOKEN` | Backend | Recommended | Raises GitHub API limit from 60 to 5,000 requests/hour |
| `FRONTEND_URL` | Backend | Production | Exact Vercel frontend origin |
| `VITE_API_URL` | Frontend | Yes | Public URL of the deployed backend |

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend. The frontend accesses
GitHub only through the backend proxy.

## How Planets Are Generated

The username is hashed into a stable numeric seed that controls deterministic
visual properties and position. Repository count controls size, stars determine
rings, followers create up to four moons, account age controls atmosphere, and
language diversity changes terrain roughness.

The primary language selects the biome palette: JavaScript becomes ocean,
Python forest, Rust volcanic, TypeScript arctic, Java desert, C++ crystal, Ruby
crimson, and unknown languages use an alien palette. Terrain is rendered by a
custom GLSL shader using procedural FBM noise without external textures.

## Deploy

### Frontend on Vercel

1. Set the project root to `devuniverse-web`.
2. Add the `devuniverse_api_url` secret or set `VITE_API_URL`.
3. Deploy with the Vite defaults.

### Backend on Railway or Oracle Cloud

1. Deploy `devuniverse-api` using its `Dockerfile`.
2. Configure every backend environment variable.
3. Set `FRONTEND_URL` to the exact Vercel URL.
4. Confirm `/health` responds and Supabase RLS is active.

## Roadmap

- [ ] Phase 2: portals and constellations
- [ ] Phase 3: solar systems and ambient sound
- [ ] Phase 4: social profiles and leaderboard

## Pre-Deploy Checklist

- [ ] Frontend `npm run build` completes without warnings
- [ ] Production `VITE_API_URL` points to the deployed backend
- [ ] `FRONTEND_URL` points to the Vercel URL
- [ ] `GITHUB_TOKEN` is configured
- [ ] Supabase RLS is active on `planets`
- [ ] Backend `/health` responds successfully
