# Deploying on Render

**How to use this doc:** Open it when you deploy with Blueprints, set **`VITE_API_BASE_URL`**, interpret **`DATABASE_URL`**, or troubleshoot OOM / static-site plan issues. High-level onboarding stays in the root [README.md](../README.md).

This repo is set up for [Render Blueprints](https://render.com/docs/infrastructure-as-code) using [`render.yaml`](../render.yaml) (production, branch **`master`**) and [`render.dev.yaml`](../render.dev.yaml) (staging, branch **`dev`**).

## Production (live)

These are the **current** public URLs for this project’s production Blueprint (confirm in your Render dashboard if you renamed services):

| Resource  | URL                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------ |
| Dashboard | [https://skyops-mission-control-web.onrender.com](https://skyops-mission-control-web.onrender.com/)                      |
| API base  | `https://skyops-mission-control-api.onrender.com`                                                                        |
| Health    | [https://skyops-mission-control-api.onrender.com/api/health](https://skyops-mission-control-api.onrender.com/api/health) |
| Swagger   | [https://skyops-mission-control-api.onrender.com/docs](https://skyops-mission-control-api.onrender.com/docs)             |

If Render assigns a **different** hostname, update **`VITE_API_BASE_URL`** on the static site and trigger a **new deploy** so the SPA bundle points at the correct API. Always double-check hostnames in the Render dashboard after provisioning.

## API Web Service — environment

Render injects these from the Blueprint or the database resource:

| Variable       | Source / notes                                                                 |
| -------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL` | From managed Postgres (`fromDatabase` in `render.yaml`). **Required** in prod. |
| `JWT_SECRET`   | Blueprint `generateValue: true` — treat as secret; do not commit.              |
| `NODE_ENV`     | `production`                                                                   |
| `NODE_VERSION` | `22`                                                                           |
| `PORT`         | Render sets (e.g. `10000`); Nest uses `process.env.PORT`.                      |
| `CORS_ORIGIN`  | **Required for browser traffic:** comma-separated origin(s) of the static site, e.g. `https://skyops-mission-control-web.onrender.com`. If unset, the API only allows localhost dev origins (`main.ts`). Blueprint sets this in `render.yaml`. |

The API accepts **either** `DATABASE_URL` **or** discrete `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME` (local Docker). On Render you only need `DATABASE_URL`.

Optional local-style vars: `JWT_EXPIRES_IN` (default in app if unset).

Health check path: `/api/health` (global prefix is `api`, so full path is correct in Blueprint).

**Database / users:** On deploy, TypeORM runs **migrations** only (`migrationsRun: true` in `typeorm.config.ts`). There is **no** automatic seed on Render. Existing Postgres data is **not** wiped; new migrations alter the schema in place.

To add demo logins against a hosted DB from your machine, use the **External** `DATABASE_URL` from the Render Postgres dashboard (full hostname). From `apps/api` with `.env` containing `DATABASE_URL` (or export it in the shell):

- **`pnpm seed`** — truncates demo fleet tables and repopulates drones/missions/logs **plus** upserts demo users (destructive to demo-scoped data).
- **`pnpm seed:demo-users`** — **only** creates/updates the three demo users (`SEED_DEMO_USERS_ONLY=true`); does **not** truncate fleet data.

Alternatively use **Sign up** (`POST /auth/register`) or restore a dump.

## Static Site — `VITE_API_BASE_URL`

The React app is built with Vite; **`VITE_API_BASE_URL` is baked in at build time**. It must be the **public HTTPS base URL of the API**, including the `/api` path:

```text
https://<your-api-service-name>.onrender.com/api
```

Rules:

- Use **`https://`**, not `http://`.
- **No trailing slash** after `/api`.
- After renaming services or the first deploy, if the API hostname differs from `render.yaml`, update this variable on the **static site** in Render and **trigger a new deploy** (rebuild) so the bundle picks up the value.

### CORS

Origins come from **`CORS_ORIGIN`** (comma-separated). Set the static site’s **exact** `https://…` origin (no path). Custom domains: add the new origin in Render env and redeploy the API.

## Blueprint quirks (free tier)

- **Static site `plan: free`:** Render may reject `plan: free` for `runtime: static` in YAML; this repo omits `plan` on the static service. Adjust instance type in the dashboard if needed.
- **Web service RAM (~512 MB):** Builds use `pnpm install --filter @skyops/api...` (or `web...`) and a capped Node heap. Migrations run at API startup via TypeORM (`migrationsRun`), not a separate CLI step. If builds still OOM, use a paid instance or build elsewhere.

## Staging (`render.dev.yaml`)

Second Blueprint, branch **`dev`**, file **`render.dev.yaml`**. Uses separate DB and `-dev` service names. Set **`VITE_API_BASE_URL`** on the dev static site to the **dev** API URL shown in the dashboard (often `https://skyops-mission-control-api-dev.onrender.com/api` if names match the file).

## Post-deploy checklist

1. API **Logs**: no crash loop; migrations applied.
2. Open `https://<api>/api/health` — expect JSON OK.
3. Static site: sign-in and **`/sign-up`** (when the API reports an empty user table) hit the correct API (browser **Network** tab); confirm `GET …/auth/status` and `POST …/auth/login` or `register` as expected.
4. If auth fails with network error, recheck **`VITE_API_BASE_URL`** and redeploy the static site.

## “Network Error” / “Request failed” after recreating the Blueprint

Axios shows **Network Error** when the browser never gets a normal API response (blocked request, wrong host, API down, or CORS rejection).

1. **Confirm the real public URLs** in the Render dashboard (**each** service → top URL). Service **names** can stay `skyops-mission-control-api` while the **hostname** still matches; if Render ever assigns a different subdomain, `render.yaml` defaults are wrong until you fix env.
2. **Static site → Environment**: `VITE_API_BASE_URL` must be exactly  
   `https://<API public hostname>/api`  
   (HTTPS, **no** trailing slash after `api`). Then **Manual Deploy → Clear build cache & deploy** so Vite rebuilds the bundle.
3. **API → Environment**: `CORS_ORIGIN` must be exactly the static site origin, e.g.  
   `https://skyops-mission-control-web.onrender.com`  
   (no path, no trailing slash). Redeploy the API after changing it.
4. **Sanity check in the browser**: DevTools → **Network** → failed login request. If the request URL is `https://skyops-mission-control-web.onrender.com/api/...`, the SPA was built **without** `VITE_API_BASE_URL` and is calling the wrong host — fix step 2.
5. **Free tier**: first request after sleep can take ~30–60s; retry once. If the API **Logs** show crashes, fix DB/`JWT_SECRET` first.

## Related files

- [`render.yaml`](../render.yaml) — production
- [`render.dev.yaml`](../render.dev.yaml) — staging
- [README.md](../README.md) — “Free deployment (Render)” summary
