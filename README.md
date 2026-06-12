# Novae Universe

A living universe built from GitHub.
Every developer is a Novae Star. Every repository, a Novae World.

## Structure

- `novae-web/` - React + Three.js + R3F frontend
- `novae-api/` - Node + Fastify backend

## Concepts

- **Novae Galaxy** - the main explorable universe
- **Novae System** - a developer's star system
- **Novae Star** - a developer
- **Novae World** - a repository
- **Novae Gate** - travel between regions
- **Novae Ship** - the player's spacecraft
- **Novae Pulse** - gravitational wave events
- **Novae HUD** - heads-up display
- **Novae Map** - navigation map

## Development

```bash
cd novae-api
npm install
npm run migrate:up
npm run dev
```

```bash
cd novae-web
npm install
npm run dev
```

The API health endpoint is `GET /novae/health`.
