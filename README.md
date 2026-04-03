# SkyOps Mission Control

SkyOps Mission Control is a production-minded full-stack case study for managing a commercial drone fleet, inspection missions, maintenance cycles, and operational risk.

The solution is built as a TypeScript monorepo with a NestJS REST API, a React dashboard, PostgreSQL persistence, automated tests, Docker support, and a free-tier deployment blueprint.

## Highlights

- Full drone registry flow with create, read, update, and delete safeguards
- Mission scheduling, mission reassignment, and lifecycle transition controls
- Maintenance logging with automatic due-date recalculation
- Fleet health report with overdue maintenance and next-24-hour mission visibility
- API input validation, structured error responses, pagination, filters, and migrations
- Jest unit/integration coverage plus a Playwright black-box user flow
- Docker and Render deployment support

## Tech stack

- Backend: NestJS, TypeORM, PostgreSQL, Swagger
- Frontend: React, Vite, TypeScript, React Query, React Router
- Testing: Jest, Playwright
- Tooling: pnpm workspaces, ESLint, Prettier, Docker, GitHub Actions

## Repository structure

```text
.
├── apps
│   ├── api    # NestJS REST API
│   └── web    # React dashboard
├── scripts    # Local helpers for end-to-end execution
├── render.yaml
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
- Automatic maintenance scheduling based on the 90-day rule
- Maintenance due detection based on both date and flight-hour thresholds
- Deletion guard to preserve auditable operational history

### Mission management

- Mission creation with drone availability enforcement
- Mission list filtering by status, drone, and date range
- Mission overlap prevention for the same drone
- Planned mission editing and reassignment support
- Lifecycle enforcement:
  - `PLANNED -> PRE_FLIGHT_CHECK -> IN_PROGRESS -> COMPLETED`
  - `ABORTED` allowed from valid intermediate states
- Completion updates drone flight hours and maintenance state automatically

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

The API is organized by domain modules:

- `drones`
- `missions`
- `maintenance`
- `reports`

Each module keeps DTOs, entities, controllers, and services together to keep domain behavior easy to navigate during a live walkthrough.

Key backend decisions:

- Validation is enforced at the API boundary with a global `ValidationPipe`
- Errors are normalized through a global HTTP exception filter
- TypeORM migrations are used instead of schema auto-sync
- Mission and maintenance business rules live in service methods and focused utility functions
- A lightweight `/api/health` endpoint supports deployment health checks

### Frontend

The dashboard is intentionally built as an internal operations tool rather than a marketing UI. The focus is:

- fast scanning
- clear operational status
- direct access to critical actions
- minimal friction during live demo flows

React Query is used for server state, while page-level forms keep local state close to where it is used.

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

### 6. Start the full stack

```bash
pnpm dev
```

Applications:

- API: [http://localhost:3000/api](http://localhost:3000/api)
- Swagger: [http://localhost:3000/docs](http://localhost:3000/docs)
- Web: [http://localhost:5173](http://localhost:5173)

## Docker

Run the whole stack with Docker:

```bash
docker compose up --build
```

This starts:

- PostgreSQL
- NestJS API
- React frontend

## Testing

### Backend

Run linting, build, unit tests, and integration tests:

```bash
pnpm --filter @skyops/api lint
pnpm --filter @skyops/api build
pnpm --filter @skyops/api exec jest --runInBand
pnpm --filter @skyops/api exec jest --config ./test/jest-e2e.json --runInBand
```

Backend coverage includes:

- serial number validation
- maintenance calculation rules
- mission transition rules
- mission reassignment validation
- fleet health reporting logic
- full mission lifecycle integration

### Frontend

Run linting, production build, and Playwright:

```bash
pnpm --filter @skyops/web lint
pnpm --filter @skyops/web build
pnpm --filter @skyops/web test:e2e
```

The Playwright scenario covers:

- creating a drone
- scheduling a mission
- moving the mission through lifecycle states
- verifying that the drone is pushed into maintenance after completion

## Seed data

The seed script creates realistic operational data:

- 20 drones
- 50 missions
- 30 maintenance logs

The generated data is intentionally varied so list filters, dashboard alerts, and detail screens all show meaningful states.

## API surface

Main endpoints:

- `GET /api/health`
- `GET /api/drones`
- `POST /api/drones`
- `GET /api/drones/:id`
- `PATCH /api/drones/:id`
- `DELETE /api/drones/:id`
- `GET /api/missions`
- `POST /api/missions`
- `GET /api/missions/:id`
- `PATCH /api/missions/:id`
- `PATCH /api/missions/:id/transition`
- `GET /api/maintenance-logs`
- `POST /api/maintenance-logs`
- `GET /api/reports/fleet-health`

## CI

GitHub Actions runs:

- backend lint
- backend build
- backend unit tests
- backend integration tests
- frontend lint
- frontend build
- Playwright end-to-end tests

Workflow file:

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## Free deployment

The repository includes a Render Blueprint at [`render.yaml`](render.yaml).

Provisioned services:

- free PostgreSQL database
- free Node web service for the API
- free static site for the React dashboard

### Deploy steps

1. Push the repository to GitHub.
2. In Render, create a new Blueprint instance from the repository.
3. Render provisions the database and both services automatically.
4. Once the API URL is live, the static frontend points to `https://skyops-mission-control-api.onrender.com/api`.

Health check endpoint:

- `GET /api/health`

## Demo walkthrough suggestion

For the live review session, a strong walkthrough is:

1. Open the dashboard and explain fleet readiness plus maintenance alerts.
2. Create a new drone in the registry.
3. Schedule a mission for that drone.
4. Show planned mission editing and reassignment constraints.
5. Transition the mission to completion and show the drone moving into maintenance.
6. Open the drone detail page and add a maintenance log to reset the maintenance window.

## Trade-offs and next steps

If this were extended further, the next sensible additions would be:

- authentication and role-based permissions
- mission audit trail events
- file attachments for maintenance evidence
- alert notifications for overdue maintenance and schedule conflicts
- more advanced analytics for flight-hour trends and technician workload

## Submission note

This implementation intentionally prioritizes correctness of business rules, testability, and demo readiness. The codebase is structured to make a live walkthrough, feature extension, or debugging exercise straightforward.
