# SkyOps API (`@skyops/api`)

NestJS REST API for SkyOps Mission Control: drones, missions, maintenance logs, fleet health reports, and JWT authentication.

**Domain highlights (implementation):**

- **Missions:** `MissionStateMachine` / `mission-transition.utils.ts` — single transition graph; invalid transitions return **400** (`BadRequestException`). Create/update scheduling runs in a **transaction** with **pessimistic lock** on the assigned drone; overlap queries ignore terminal mission rows (`mission-overlap.where.ts` + `ACTIVE_SCHEDULING_MISSION_STATUSES`).
- **Maintenance:** Shared rules in `drones/utils/maintenance.utils.ts`; entity methods delegate there. **`MaintenanceDueSchedulerService`** (`@Cron` daily) sets `MAINTENANCE` for **AVAILABLE** drones that satisfy the due rule; cron is **disabled** when `NODE_ENV=test` (Jest / e2e API).
- **Reports:** `ReportsService.getFleetHealthReport` uses **TypeORM `QueryBuilder`** aggregates (not per-drone mission count loops); “missions in next 24h” uses a **24-hour window** from request time and active mission statuses.

**Auth:** All routes are under the global prefix **`/api`**. Examples: `GET /api/auth/status` (client hint), **`POST /api/auth/register`** (new **Manager** per unused email), **`POST /api/auth/login`**, profile/password/notification endpoints, **`GET /api/auth/team/members`** (workspace directory for any member), and **`POST /api/auth/team/members`** (Manager-only invites with one-time password). Fleet data is scoped to the Manager’s workspace (`fleetOwnerId`).

**Docs:** Start from the monorepo [README.md](../../README.md). Production Swagger (when deployed): [https://skyops-mission-control-api.onrender.com/docs](https://skyops-mission-control-api.onrender.com/docs).

## Run from the monorepo root

See the root [README.md](../../README.md) for full setup (PostgreSQL, migrations, seed, `pnpm dev`, Docker, and tests).

### Package-only commands

```bash
pnpm --filter @skyops/api dev          # watch mode
pnpm --filter @skyops/api build
pnpm --filter @skyops/api migration:run
pnpm --filter @skyops/api seed
pnpm --filter @skyops/api seed:demo-users   # only demo accounts; no fleet truncate
pnpm --filter @skyops/api lint
pnpm --filter @skyops/api exec jest --runInBand
pnpm --filter @skyops/api openapi:export   # repo-root contracts/openapi.json (needs DB + env; see root README → OpenAPI contract)
```

Swagger is served at `/docs` when the API is running (default base: `http://localhost:3000`).
