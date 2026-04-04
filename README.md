# SkyOps Mission Control

SkyOps Mission Control is a production-minded full-stack case study for managing a commercial drone fleet, inspection missions, maintenance cycles, and operational risk.

The solution is built as a TypeScript monorepo with a NestJS REST API, a React dashboard, PostgreSQL persistence, JWT authentication (owner-scoped data), automated tests, Docker support, and a free-tier deployment blueprint.

**Related docs**

- [CANDIDATE_CASE_STUDY.md](CANDIDATE_CASE_STUDY.md) — original requirements brief (what was asked for).
- [docs/BRANCHING.md](docs/BRANCHING.md) — branch naming and GitHub Flow–style workflow.
- [docs/RENDER.md](docs/RENDER.md) — Render env vars, `VITE_API_BASE_URL`, and post-deploy checklist.

## What the application contains

### Web dashboard (`apps/web`)

Single-page app with React Router. Main areas:

| Area              | Route(s)               | Purpose                                                                                          |
| ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| Sign in / sign up | `/sign-in`, `/sign-up` | Email + password; JWT stored for API calls                                                       |
| Dashboard         | `/dashboard`           | Fleet summary, maintenance watchlist, upcoming missions, recent activity                         |
| Drone registry    | `/drones`              | List, create drones; filters                                                                     |
| Drone detail      | `/drones/:id`          | Profile edit, mission and maintenance history, maintenance log form, danger zone (delete/retire) |
| Missions          | `/missions`            | List, create, edit, reassign, lifecycle transitions                                              |
| Not found         | `*`                    | 404 for unknown routes                                                                           |

UI patterns: React Query for server state, toast-style notifications for API feedback, forms co-located with features.

### Backend API (`apps/api`)

Domain modules (each with entities, DTOs, controllers, services):

| Module        | Responsibility                                                                             |
| ------------- | ------------------------------------------------------------------------------------------ |
| `auth`        | Register, login, `GET /me`; bcrypt password hashing; JWT strategy                          |
| `drones`      | CRUD, serial validation, status rules, retirement guards, maintenance field calculations   |
| `missions`    | Scheduling, overlap checks, state machine, completion updates flight hours and maintenance |
| `maintenance` | Maintenance log CRUD; recalculates drone maintenance fields                                |
| `reports`     | Fleet health aggregate (overdue maintenance, missions in next window, etc.)                |

Cross-cutting: global `ValidationPipe`, HTTP exception filter, TypeORM migrations (no `synchronize` in production paths), `/api/health` for probes.

### Data model (conceptual)

- **User** — owns drones, missions, and maintenance logs (multi-tenant by `ownerId`).
- **Drone** — serial, model, status, flight hours, last/next maintenance dates, `flightHoursAtLastMaintenance`.
- **Mission** — type, schedule, pilot, site, status lifecycle, optional abort reason, logged flight hours on completion.
- **MaintenanceLog** — linked drone, technician, notes, flight hours snapshot, maintenance type.

Business rules (50 flight hours **or** 90 days for maintenance due, overlap rules, retirement with active missions, etc.) are implemented in services and helpers such as `maintenance.utils` and drone rule helpers.

## Tech stack

| Layer           | Technologies                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| Runtime         | Node.js **≥ 22**                                                                                                  |
| Package manager | **pnpm** 10.x workspaces                                                                                          |
| Backend         | **NestJS**, **TypeORM**, **PostgreSQL**, **Swagger** (`/docs`), **Passport JWT**, **bcrypt**, **class-validator** |
| Frontend        | **React**, **Vite**, **TypeScript**, **React Router**, **TanStack React Query**                                   |
| Testing         | **Jest** (API unit/integration), **Playwright** (web e2e against preview + scripted API)                          |
| Tooling         | **ESLint**, **Prettier**, **Husky** / lint-staged, **Docker**, **GitHub Actions**                                 |

Database: PostgreSQL **16** in `docker-compose` (image `postgres:16-alpine`).

## Highlights

- Full drone registry flow with create, read, update, and delete safeguards
- Mission scheduling, mission reassignment, and lifecycle transition controls
- Maintenance logging with automatic due-date recalculation (calendar and flight-hour thresholds)
- Fleet health report with overdue maintenance and next-24-hour mission visibility
- JWT authentication; fleet data scoped per user
- API input validation, structured error responses, pagination, filters, and migrations
- Jest unit/integration coverage plus a Playwright black-box user flow
- Docker and Render deployment support

## Repository structure

```text
.
├── apps
│   ├── api     # NestJS REST API (@skyops/api)
│   └── web     # React dashboard (@skyops/web)
├── docs            # e.g. BRANCHING.md
├── scripts         # Local / CI helpers (e.g. e2e API + web startup)
├── render.yaml     # Production Blueprint (branch: master)
├── render.dev.yaml # Staging Blueprint (branch: dev)
└── docker-compose.yml
```

## Product scope

### Drone registry

- Serial number validation with the `SKY-XXXX-XXXX` format
- Supported models:
  - `PHANTOM_4`
  - `MATRICE_300`
  - `MAVIC_3_ENTERPRISE`
- Supported statuses:
  - `AVAILABLE`
  - `IN_MISSION`
  - `MAINTENANCE`
  - `RETIRED`
- Next maintenance due derived from **90-day** and **50 flight-hour** rules (whichever is earlier)
- Dashboard maintenance watchlist highlights drones due within **7 days** or at/above the **50-hour** threshold since last maintenance
- Deletion guard to preserve auditable operational history

### Mission management

- Mission creation with drone availability enforcement
- Mission list filtering by status, drone, and date range
- Overlap prevention for the same drone among **active** schedules (`PLANNED`, `PRE_FLIGHT_CHECK`, `IN_PROGRESS`)
- Planned mission editing and reassignment support
- Lifecycle enforcement:
  - `PLANNED -> PRE_FLIGHT_CHECK -> IN_PROGRESS -> COMPLETED`
  - `ABORTED` allowed from valid intermediate states
- Completion updates drone flight hours and maintenance due date, then reconciles drone status

### Maintenance

- Maintenance logging with technician attribution and notes
- Flight-hour consistency tolerance validation
- Drone maintenance fields recalculated on every maintenance entry

### Dashboard

- Fleet overview and dispatch readiness
- Maintenance watchlist for due and overdue drones
- Upcoming mission panel
- Recent mission activity panel
- Drone detail page with mission and maintenance history

## Architecture notes

### Backend

Key backend decisions:

- Validation is enforced at the API boundary with a global `ValidationPipe`
- Errors are normalized through a global HTTP exception filter
- TypeORM migrations are used instead of schema auto-sync for deployable environments
- Mission and maintenance business rules live in service methods and focused utility functions
- A lightweight `/api/health` endpoint supports deployment health checks

### Frontend

The dashboard is intentionally built as an internal operations tool rather than a marketing UI. The focus is fast scanning, clear operational status, direct access to critical actions, and low friction during demos.

## Authentication

- **Register** / **login** issue a JWT; the web app sends `Authorization: Bearer <token>` on API requests.
- Drones, missions, maintenance logs, and reports are filtered by **authenticated user** (`ownerId`).
- After **seed**, you can sign in as:
  - **ops@skyops.demo** / **SkyOpsDemo1** (demo fleet data is owned by this user).

Playwright uses a dedicated e2e user created by `scripts/start-e2e-api.sh` (not the main seed).

## Git workflow

Integration happens on **`dev`**; **production** (including Render) tracks **`master`**. Short-lived `feature/*`, `fix/*`, and `chore/*` branches branch from `dev` and merge back via PR. Promote to production by merging `dev` → `master`. See [docs/BRANCHING.md](docs/BRANCHING.md) for commands, staging (`render.dev.yaml`), and branch protection tips.

## Prerequisites

- **Node.js** ≥ 22
- **pnpm** 10.x (see root `package.json` `packageManager`)
- **Docker** (recommended for PostgreSQL, or use your own Postgres and match `.env`)

## Local setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create environment files

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env`: set `JWT_SECRET` (long random string, ≥ 32 characters) and database variables. For Docker Postgres defaults, the examples usually work as-is.

Edit `apps/web/.env`: `VITE_API_BASE_URL` must match where the API is served (default `http://localhost:3000/api`).

### 3. Start PostgreSQL

```bash
docker compose up postgres -d
```

### 4. Run migrations

```bash
pnpm --filter @skyops/api migration:run
```

### 5. Seed demo data

```bash
pnpm --filter @skyops/api seed
```

The seed prints demo sign-in credentials and creates sample drones, missions, and maintenance logs.

### 6. Start the full stack

```bash
pnpm dev
```

This runs API and web in parallel (see root `package.json` `dev` script).

| Service    | URL                                                      |
| ---------- | -------------------------------------------------------- |
| API        | [http://localhost:3000/api](http://localhost:3000/api)   |
| Swagger    | [http://localhost:3000/docs](http://localhost:3000/docs) |
| Web (Vite) | [http://localhost:5173](http://localhost:5173)           |

## Docker (full stack)

Build and run API, web, and PostgreSQL:

```bash
docker compose up --build
```

| Service    | Host port | Notes                                                                           |
| ---------- | --------- | ------------------------------------------------------------------------------- |
| PostgreSQL | 5432      | DB `skyops`, user/password `postgres`                                           |
| API        | 3000      | Nest listens on container port 3000                                             |
| Web        | **8080**  | Nginx serves the built SPA; open [http://localhost:8080](http://localhost:8080) |

Point the browser at the web URL above. If the API is only reachable at `localhost:3000`, ensure any production-like `VITE_API_BASE_URL` baked into the web image matches your deployment (the compose build should align with how `apps/web` is built for that environment).

## Environment variables (summary)

**API** (`apps/api/.env` — see `apps/api/.env.example`):

- `PORT` — HTTP port (default 3000)
- `JWT_SECRET`, `JWT_EXPIRES_IN` — signing and TTL for tokens
- `DATABASE_*` or `DATABASE_URL` — Postgres connection

**Web** (`apps/web/.env` — see `apps/web/.env.example`):

- `VITE_API_BASE_URL` — base URL for REST calls (must include `/api` path as used by the client)

## Useful monorepo commands

| Goal                                       | Command         |
| ------------------------------------------ | --------------- |
| Dev (API + web)                            | `pnpm dev`      |
| Lint all packages                          | `pnpm lint`     |
| Build all                                  | `pnpm build`    |
| Web e2e (starts API + preview via scripts) | `pnpm test:e2e` |

## Testing

### Backend

```bash
pnpm --filter @skyops/api lint
pnpm --filter @skyops/api build
pnpm --filter @skyops/api exec jest --runInBand
pnpm --filter @skyops/api exec jest --config ./test/jest-e2e.json --runInBand
```

Coverage themes: serial validation, maintenance calculations, mission transitions and overlap, reassignment, fleet health, auth-backed flows where applicable.

### Frontend

```bash
pnpm --filter @skyops/web lint
pnpm --filter @skyops/web build
pnpm --filter @skyops/web test:e2e
```

Playwright (`apps/web/playwright.config.ts`) starts:

1. API + test DB via `scripts/start-e2e-api.sh`
2. Preview server via `scripts/start-e2e-web.sh`

The scenario signs in, creates a drone and mission, advances the mission through states, checks the dashboard (e.g. Total drones, Maintenance watchlist), and asserts the drone enters maintenance after completion.

## Seed data

The seed script creates realistic operational data:

- 20 drones
- 50 missions
- 30 maintenance logs

Data is varied so filters, dashboard alerts, and detail screens show meaningful states. A demo **User** is created or reused for `ops@skyops.demo`.

## API surface

**Health**

- `GET /api/health`

**Auth** (no JWT required for register/login)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (JWT required)

**Domain** (JWT required)

- `GET/POST /api/drones`, `GET/PATCH/DELETE /api/drones/:id`
- `GET/POST /api/missions`, `GET/PATCH /api/missions/:id`, `PATCH /api/missions/:id/transition`
- `GET/POST /api/maintenance-logs`
- `GET /api/reports/fleet-health`

## CI

GitHub Actions runs:

- backend lint, build, unit tests, integration tests
- frontend lint, build
- Playwright end-to-end tests

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## Free deployment (Render)

### Production (`master`)

Blueprint: [`render.yaml`](render.yaml). Both web services set **`branch: master`** so Render deploys only when **`master`** updates.

Provisioned services:

- free PostgreSQL database
- free Node web service for the API
- free static site for the React dashboard

**Deploy steps**

1. Ensure **`master`** contains the commit you want in production (merge from `dev` when ready).
2. In Render, create a Blueprint from this repo and select **`render.yaml`** (or the default blueprint path your team uses).
3. Render provisions the database and services. If the API hostname differs from the example, set **`VITE_API_BASE_URL`** on the static site to `https://<your-api-service>.onrender.com/api`.

Health check: `GET /api/health`

**Blueprint note:** Render may reject `plan: free` on services with `runtime: static`. The repo’s `render.yaml` omits `plan` for the frontend static site so the Blueprint validates; if the dashboard shows a paid instance type, switch that static site to the free/static-appropriate tier there.

**Free web service RAM (~512MB):** Blueprint build/start commands use a scoped `pnpm install` (`--filter @skyops/api...` / `@skyops/web...`), a capped Node heap for builds, and **no separate `migration:run`** (migrations run when the API boots via TypeORM `migrationsRun`). If deploys still hit OOM, upgrade the API to a paid instance or build in CI and deploy a container artifact.

### Staging (`dev`)

Blueprint: [`render.dev.yaml`](render.dev.yaml). Uses **`branch: dev`** and separate service names plus a **dev database** so staging does not touch production data. Create a **second** Blueprint in Render pointing at `render.dev.yaml`, then verify **`VITE_API_BASE_URL`** matches the dev API URL shown in the dashboard after the first deploy.

Full tables and troubleshooting: [docs/RENDER.md](docs/RENDER.md).

## Demo walkthrough suggestion

1. Sign in as the demo user and open the dashboard (fleet readiness, maintenance alerts).
2. Create a new drone in the registry.
3. Schedule a mission for that drone.
4. Show planned mission editing and reassignment constraints.
5. Transition the mission to completion and show the drone moving into maintenance when rules require it.
6. Open the drone detail page and add a maintenance log to reset the maintenance window.

## Trade-offs and next steps

Implemented beyond the original brief in places: **JWT authentication**, **per-user data isolation**, and operational polish on the dashboard.

Reasonable next increments:

- Role-based permissions (pilot vs technician vs manager)
- Mission audit trail events
- File attachments for maintenance evidence
- Push/email alerts for overdue maintenance and schedule conflicts
- Deeper analytics (flight-hour trends, technician workload)

## Submission note

This implementation prioritizes correctness of business rules, testability, and demo readiness. The codebase is structured to make a live walkthrough, feature extension, or debugging exercise straightforward.
