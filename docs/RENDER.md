# Deploying on Render

This repo is set up for [Render Blueprints](https://render.com/docs/infrastructure-as-code) using [`render.yaml`](../render.yaml) (production, branch **`master`**) and [`render.dev.yaml`](../render.dev.yaml) (staging, branch **`dev`**).

## Production URLs

After the first deploy, open each service in the Render dashboard and copy its **onrender.com** hostname. Defaults in `render.yaml` assume:

| Service        | Typical URL pattern                               |
| -------------- | ------------------------------------------------- |
| API (Web)      | `https://skyops-mission-control-api.onrender.com` |
| Frontend (CDN) | `https://skyops-mission-control-web.onrender.com` |

If Render assigns a different slug, update configuration to match (see below).

## API Web Service — environment

Render injects these from the Blueprint or the database resource:

| Variable       | Source / notes                                                                 |
| -------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL` | From managed Postgres (`fromDatabase` in `render.yaml`). **Required** in prod. |
| `JWT_SECRET`   | Blueprint `generateValue: true` — treat as secret; do not commit.              |
| `NODE_ENV`     | `production`                                                                   |
| `NODE_VERSION` | `22`                                                                           |
| `PORT`         | Render sets (e.g. `10000`); Nest uses `process.env.PORT`.                      |

The API accepts **either** `DATABASE_URL` **or** discrete `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME` (local Docker). On Render you only need `DATABASE_URL`.

Optional local-style vars: `JWT_EXPIRES_IN` (default in app if unset).

Health check path: `/api/health` (global prefix is `api`, so full path is correct in Blueprint).

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

The API calls `enableCors()` without a narrow origin list, so the static site on another `*.onrender.com` host can call the API. For custom domains later, restrict origins in `apps/api/src/main.ts`.

## Blueprint quirks (free tier)

- **Static site `plan: free`:** Render may reject `plan: free` for `runtime: static` in YAML; this repo omits `plan` on the static service. Adjust instance type in the dashboard if needed.
- **Web service RAM (~512 MB):** Builds use `pnpm install --filter @skyops/api...` (or `web...`) and a capped Node heap. Migrations run at API startup via TypeORM (`migrationsRun`), not a separate CLI step. If builds still OOM, use a paid instance or build elsewhere.

## Staging (`render.dev.yaml`)

Second Blueprint, branch **`dev`**, file **`render.dev.yaml`**. Uses separate DB and `-dev` service names. Set **`VITE_API_BASE_URL`** on the dev static site to the **dev** API URL shown in the dashboard (often `https://skyops-mission-control-api-dev.onrender.com/api` if names match the file).

## Post-deploy checklist

1. API **Logs**: no crash loop; migrations applied.
2. Open `https://<api>/api/health` — expect JSON OK.
3. Static site: sign-in / register hits the correct API (browser **Network** tab).
4. If auth fails with network error, recheck **`VITE_API_BASE_URL`** and redeploy the static site.

## Related files

- [`render.yaml`](../render.yaml) — production
- [`render.dev.yaml`](../render.dev.yaml) — staging
- [README.md](../README.md) — “Free deployment (Render)” summary
