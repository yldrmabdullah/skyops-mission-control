#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

export VITE_API_BASE_URL=http://127.0.0.1:3000/api

pnpm --filter @skyops/web dev --host 127.0.0.1 --port 4173
