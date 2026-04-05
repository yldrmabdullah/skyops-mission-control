# SkyOps Web (`@skyops/web`)

React + Vite dashboard for SkyOps Mission Control (fleet registry, missions, maintenance, dashboard).

**Access model:** Sign in at **`/sign-in`**. New **Managers** self-register at **`/sign-up`** (alias **`/workspace/bootstrap`**) with an unused email. Each **Manager** invites Pilots and Technicians from **`/settings`**; invitees sign in with a one-time password and are prompted to set a new password at **`/account/change-password`**.

**Docs:** Start from the monorepo [README.md](../../README.md). Production UI (when deployed): [https://skyops-mission-control-web.onrender.com](https://skyops-mission-control-web.onrender.com/).

## Run from the monorepo root

See the root [README.md](../../README.md) for environment variables, `pnpm dev`, Docker, and Playwright e2e.

### Package-only commands

```bash
pnpm --filter @skyops/web dev         # Vite dev server (default http://localhost:5173)
pnpm --filter @skyops/web build
pnpm --filter @skyops/web lint
pnpm --filter @skyops/web types:openapi  # openapi-typescript from ../../contracts/openapi.json → src/lib/api/generated/openapi.d.ts
pnpm --filter @skyops/web test:e2e    # starts API + preview via ../../scripts/
```

Set `VITE_API_BASE_URL` in `apps/web/.env` to point at the API (e.g. `http://localhost:3000/api`).
