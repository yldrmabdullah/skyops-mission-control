# SkyOps API (`@skyops/api`)

NestJS REST API for SkyOps Mission Control: drones, missions, maintenance logs, fleet health reports, and JWT authentication.

**Auth:** `GET /auth/status` (bootstrap gate), **`POST /auth/register`** (first Manager only), **`POST /auth/login`**, profile/password/notification endpoints, **`GET /auth/team/members`** (workspace directory for any member), and **`POST /auth/team/members`** (Manager-only invites with one-time password). Fleet data is scoped to the Manager’s workspace (`fleetOwnerId`).

**Docs:** Start from the monorepo [README.md](../../README.md). Production Swagger (when deployed): [https://skyops-mission-control-api.onrender.com/docs](https://skyops-mission-control-api.onrender.com/docs).

## Run from the monorepo root

See the root [README.md](../../README.md) for full setup (PostgreSQL, migrations, seed, `pnpm dev`, Docker, and tests).

### Package-only commands

```bash
pnpm --filter @skyops/api dev          # watch mode
pnpm --filter @skyops/api build
pnpm --filter @skyops/api migration:run
pnpm --filter @skyops/api seed
pnpm --filter @skyops/api lint
pnpm --filter @skyops/api exec jest --runInBand
```

Swagger is served at `/docs` when the API is running (default base: `http://localhost:3000`).
