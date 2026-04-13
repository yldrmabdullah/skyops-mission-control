# DevOps, Database & Deployment Rules

## Database

### TypeORM Configuration

- Production/staging: `migrationsRun: true` in TypeORM config — migrations run on API boot.
- `synchronize: false` always in production. Only `true` in test environments (pg-mem).
- Connection: `DATABASE_URL` (Render/Heroku) or discrete `DATABASE_*` vars (local Docker).
- SSL: auto-enabled when `DATABASE_URL` contains `sslmode` or when deployed (see `postgres-ssl.ts`).
- Numeric columns use `numericTransformer` to convert PostgreSQL `numeric` strings to JS numbers.

### Migrations

- Generate: `pnpm --filter @skyops/api typeorm migration:generate -d src/database/data-source.ts src/database/migrations/{Timestamp}-{Name}`
- Run: `pnpm --filter @skyops/api migration:run`
- Revert: `pnpm --filter @skyops/api migration:revert`
- **Never** edit a migration that has already been deployed. Create a new one.
- Migration timestamps must be monotonically increasing.

### Seeding

- Seed script: `pnpm --filter @skyops/api seed`
- **Destructive**: wipes drones, missions, maintenance logs, notifications, audit events.
- Creates 3 demo users: `ops@skyops.demo` (Manager), `pilot@skyops.demo` (Pilot), `tech@skyops.demo` (Technician).
- Password for all: `SkyOpsDemo1`.
- Demo-users only: `pnpm --filter @skyops/api seed:demo-users`
- Docker entrypoint auto-seeds on first boot (empty users table).

## Docker

### docker-compose.yml

- **postgres**: PostgreSQL 16 Alpine, port 5432, DB `skyops`.
- **api**: NestJS app, port 3000. Entrypoint runs migrations + conditional seed.
- **web**: Nginx serves built SPA on port 8080. Proxies `/api/` to API service.

### Docker Environment

- `DOCKER_SKIP_SEED=1` — disable auto-seeding.
- `DOCKER_FORCE_SEED=1` — force re-seed even if users exist.
- Web build requires `VITE_API_BASE_URL` at build time (baked into static assets).

## CI/CD (GitHub Actions)

### Pipeline Steps (`.github/workflows/ci.yml`)

```
1. Checkout → pnpm setup → Node 22
2. pnpm install --frozen-lockfile
3. Lint backend
4. Build backend
5. Backend unit tests (jest --runInBand)
6. Backend integration tests (jest --config ./test/jest-e2e.json --runInBand)
7. Lint frontend
8. Build frontend
9. Install Playwright browsers
10. Frontend E2E tests
```

- Triggers: push to `main`, `master`, `dev`, and all PRs.
- All steps are sequential (no matrix/parallel) — keeps it simple and avoids DB conflicts.

## Render Deployment

### Production (`render.yaml`, branch: `master`)

- PostgreSQL free instance
- API: Node web service (free), health check at `/api/health`
- Web: Static site, built SPA served by Render's CDN

### Staging (`render.dev.yaml`, branch: `dev`)

- Separate service names + separate DB
- Same architecture as production

### Key Environment Variables

**API:**
| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port (default 3000) |
| `JWT_SECRET` | ≥32 chars in production |
| `JWT_EXPIRES_IN` | Token TTL |
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ORIGIN` | Comma-separated allowed origins |
| `NODE_ENV` | `production` for deployed |

**Web:**
| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | API base URL (build-time) |
| `VITE_SHOW_DEMO_LOGIN` | Show demo credentials block |
| `VITE_DEMO_EMAIL` | Pre-fill demo email |
| `VITE_DEMO_PASSWORD` | Pre-fill demo password |

### Build Commands (Render)

```bash
# API build (scoped install for 512MB RAM limit)
pnpm install --filter @skyops/api... && NODE_OPTIONS="--max-old-space-size=384" pnpm --filter @skyops/api build

# Web build
pnpm install --filter @skyops/web... && VITE_API_BASE_URL=https://skyops-api.onrender.com/api pnpm --filter @skyops/web build
```

## Health Check

- Endpoint: `GET /api/health`
- Returns `{ status: 'ok', timestamp: '...' }`
- Used by Render, Docker, and monitoring.

## Security Checklist

- [ ] `JWT_SECRET` ≥ 32 characters in production
- [ ] `CORS_ORIGIN` explicitly set (not wildcard)
- [ ] `helmet` middleware active
- [ ] `ValidationPipe` with `whitelist: true` + `forbidNonWhitelisted: true`
- [ ] `ThrottlerGuard` active (120 req/min)
- [ ] `bcrypt` with 12 rounds for password hashing
- [ ] No `synchronize: true` in production
- [ ] `ParseUUIDPipe` on all ID params
- [ ] File upload: regex validation on stored filename
- [ ] Workspace data isolation via `fleetOwnerId` filter on all queries
