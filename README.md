# SkyOps Mission Control

Internal **operations console** for a commercial drone fleet: **registry**, **inspection missions** (schedule, lifecycle, reassignment), and **maintenance** logging with rules tied to calendar and flight hours. Access is **JWT**-based: a **workspace Manager** bootstraps the first account (or you use seed/demo data); the Manager then invites **Pilots** and **Technicians** from **Settings**. Fleet data (drones, missions, logs, reports) is scoped to that **workspace** (the Manager’s fleet), not to each user’s personal silo.

Built as a **TypeScript monorepo**: NestJS REST API, React (Vite) SPA, PostgreSQL via TypeORM migrations, Swagger, Jest + Playwright, Docker Compose, GitHub Actions, and **Render** Blueprints (`dev` for integration, `master` for production deploys).

## Live environment (Render)

| Resource              | URL                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Web dashboard**     | [skyops-mission-control-web.onrender.com](https://skyops-mission-control-web.onrender.com/)                      |
| **API health**        | [skyops-mission-control-api.onrender.com/api/health](https://skyops-mission-control-api.onrender.com/api/health) |
| **Swagger (OpenAPI)** | [skyops-mission-control-api.onrender.com/docs](https://skyops-mission-control-api.onrender.com/docs)             |

On Render’s free web tier the API **sleeps after idle time**; the first request after sleep may take **~30–60 seconds**. The hosted database is **not** seeded by default. For an empty database, use **Sign up as Manager** on the sign-in screen (when offered) to open **`/sign-up`** (alias **`/workspace/bootstrap`**), or run the **seed** script against that environment if you want demo data and a ready-made Manager login.

## Documentation map

| Document                                 | What it covers                                                                | When to open it                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **This README**                          | Full product + stack summary, local/Docker run, tests, CI, deploy overview    | Onboarding, running the project, understanding what shipped                |
| [docs/BRANCHING.md](docs/BRANCHING.md)   | `dev` vs `master`, `feature/*` / `fix/*` / `chore/*`, release & Render wiring | Creating branches, PRs, merging to prod                                    |
| [docs/RENDER.md](docs/RENDER.md)         | Env vars (`DATABASE_URL`, `VITE_API_BASE_URL`), Blueprint quirks, checklists  | Deploying or debugging Render (URLs, rebuild static site after API rename) |
| [apps/api/README.md](apps/api/README.md) | API-only pnpm commands                                                        | Working inside `apps/api`                                                  |
| [apps/web/README.md](apps/web/README.md) | Web-only pnpm commands                                                        | Working inside `apps/web`                                                  |

## Contents

- [Live environment (Render)](#live-environment-render)
- [Documentation map](#documentation-map)
- [What the application contains](#what-the-application-contains)
- [Tech stack](#tech-stack)
- [Highlights](#highlights)
- [Repository structure](#repository-structure)
- [Product scope](#product-scope)
- [Architecture notes](#architecture-notes)
- [Authentication](#authentication)
- [Git workflow](#git-workflow)
- [Local setup](#local-setup)
- [Docker](#docker-full-stack)
- [Environment variables](#environment-variables-summary)
- [Testing](#testing)
- [API surface](#api-surface)
- [CI](#ci)
- [Deployment (Render)](#free-deployment-render)
- [Walkthrough](#walkthrough)
- [Trade-offs and next steps](#trade-offs-and-next-steps)

## What the application contains

### Web dashboard (`apps/web`)

Single-page app with React Router. Main areas:

| Area                       | Route(s)                                      | Purpose                                                                                          |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Sign in                    | `/sign-in`                                    | Email + password; JWT stored for API calls                                                       |
| Workspace bootstrap        | `/workspace/bootstrap` (`/sign-up` → same)    | **Only when the API reports no users:** create the first **Manager** account                   |
| First password change      | `/account/change-password`                    | Shown after login when the user must replace a **one-time** password (invited team members)      |
| Dashboard                  | `/dashboard`                                  | Fleet summary, maintenance watchlist, upcoming missions, recent activity                         |
| Drone registry             | `/drones`                                     | List, create drones; filters                                                                     |
| Drone detail               | `/drones/:id`                                 | Profile edit, mission and maintenance history, maintenance log form, danger zone (delete/retire) |
| Missions                   | `/missions`                                   | List, create, edit, reassign, lifecycle transitions                                              |
| Settings                   | `/settings`                                   | Profile and password; **Team members** table for everyone; **invites** (Manager only): Pilot / Technician + one-time password |
| Audit log                  | `/audit`                                      | Operational audit trail                                                                          |
| Not found                  | `*`                                           | 404 for unknown routes                                                                           |

UI patterns: React Query for server state, toast-style notifications for API feedback, forms co-located with features.

### Backend API (`apps/api`)

Domain modules (each with entities, DTOs, controllers, services):

| Module        | Responsibility                                                                             |
| ------------- | ------------------------------------------------------------------------------------------ |
| `auth`        | Bootstrap first Manager, login, profile/password, notification prefs, **team** CRUD (invites); bcrypt; JWT; workspace-scoped fleet via `fleetOwnerId` |
| `drones`      | CRUD, serial validation, status rules, retirement guards, maintenance field calculations   |
| `missions`    | Scheduling, overlap checks, state machine, completion updates flight hours and maintenance |
| `maintenance` | Maintenance log CRUD; recalculates drone maintenance fields                                |
| `reports`     | Fleet health aggregate (overdue maintenance, missions in next window, etc.)                |

Cross-cutting: global `ValidationPipe`, HTTP exception filter, TypeORM migrations (no `synchronize` in production paths), `/api/health` for probes.

### Data model (conceptual)

- **User** — **Manager** (workspace owner) or invited **Pilot** / **Technician**. Drones, missions, and maintenance logs belong to the **workspace** (`ownerId` = the root Manager’s user id). Invited users carry `workspaceOwnerId` pointing at that Manager.
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
- JWT authentication; fleet data scoped per **workspace** (Manager fleet)
- Workspace bootstrap, Manager-led invites, and forced password change after one-time credentials
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

The dashboard is intentionally built as an internal operations tool rather than a marketing UI. The focus is fast scanning, clear operational status, direct access to critical actions, and low friction during day-to-day operations.

## Authentication

- **Login** always issues a JWT; the SPA sends `Authorization: Bearer <token>` on API requests.
- **First user in the database:** `POST /api/auth/register` (and the **`/sign-up`** UI) creates the **workspace Manager** only. There is **no** public self-service choice of Pilot/Technician at registration.
- **Manager** invites **Pilots** and **Technicians** from **Settings** (`POST /api/auth/team/members`). The API returns a **one-time password** once; the invitee must **change password** after first sign-in (`mustChangePassword` → UI **`/account/change-password`**).
- Drones, missions, maintenance logs, and reports are filtered by **workspace** (fleet owner), not by the invitee’s user id alone.
- After **seed**, sign in as the demo **Manager**:
  - **ops@skyops.demo** / **SkyOpsDemo1** (all seeded fleet data is owned by this workspace).

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

Edit `apps/api/.env`: set `JWT_SECRET` (long random string, ≥ 32 characters) and database variables. For Docker Postgres defaults, the examples usually work as-is. **`POST /api/auth/register`** is **bootstrap-only**: it succeeds only while **no users exist** and always creates a **Manager**. Additional accounts are created by that Manager via **`POST /api/auth/team/members`** (Pilot or Technician). Use strong secrets and HTTPS in production.

Edit `apps/web/.env`: `VITE_API_BASE_URL` must match where the API is served (default `http://localhost:3000/api`).

### 3. Start PostgreSQL

```bash
docker compose up postgres -d
```

### 4. Run migrations

```bash
pnpm --filter @skyops/api migration:run
```

### 5. Seed sample data

```bash
pnpm --filter @skyops/api seed
```

The seed prints operator sign-in credentials and creates sample drones, missions, and maintenance logs.

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

Data is varied so filters, dashboard alerts, and detail screens show meaningful states. A **User** is created or reused for `ops@skyops.demo`.

## API surface

**Health**

- `GET /api/health`

**Auth**

- `GET /api/auth/status` — public; `{ bootstrapAvailable }` (true only when user count is zero)
- `POST /api/auth/register` — public; **bootstrap only** (first Manager)
- `POST /api/auth/login` — public
- `GET /api/auth/me` — JWT
- `PATCH /api/auth/me/profile` — JWT
- `PATCH /api/auth/me/password` — JWT
- `PATCH /api/auth/me/notification-preferences` — JWT
- `POST /api/auth/team/members` — JWT, **workspace Manager** only (Pilot/Technician invite)
- `GET /api/auth/team/members` — JWT, any workspace member (directory: email, name, role; Manager also sees invitee first-sign-in status)

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

**Current production URLs** are listed under [Live environment (Render)](#live-environment-render). To change hostnames, update the static site’s **`VITE_API_BASE_URL`** and redeploy the frontend (build-time env).

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

## Walkthrough

1. **Access:** If the database is empty, open **`/sign-up`** (linked from sign-in when available) and create the **Manager**. If you ran **seed**, sign in as **ops@skyops.demo** / **SkyOpsDemo1**. Invited users sign in with email + one-time password, then complete **Change password**.
2. **(Optional)** As Manager, open **Settings** and invite a Pilot or Technician; copy the one-time password shown once.
3. Open the **dashboard** (fleet readiness, maintenance alerts).
4. **Register** a new drone in the registry.
5. **Schedule** a mission for that drone.
6. **Edit** the planned mission and confirm reassignment rules (availability, overlap).
7. **Move** the mission through its lifecycle to completion and observe maintenance-driven drone status when rules require it.
8. Open the **drone detail** page and add a maintenance log to refresh the maintenance window.

## Trade-offs and next steps

Today’s scope includes **JWT authentication**, **per-user data isolation**, and an operations-oriented dashboard. The architecture is modular by domain (`auth`, `drones`, `missions`, `maintenance`, `reports`) so new behavior can land in the right service without cross-cutting rewrites.

**Priorities for changes:** keep domain rules and migrations explicit, extend tests when you change transitions or maintenance math, and preserve deployability (health checks, env validation, Blueprint-friendly commands).

Plausible extensions:

- Finer-grained RBAC or per-resource policies beyond Pilot / Technician / Manager
- Mission audit trail events
- File attachments for maintenance evidence
- Push or email alerts for overdue maintenance and schedule conflicts
- Deeper analytics (flight-hour trends, technician workload)
