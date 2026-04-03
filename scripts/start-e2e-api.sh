#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

pnpm --filter @skyops/api start:e2e
