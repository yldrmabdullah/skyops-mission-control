#!/bin/sh
set -e
cd "$(dirname "$0")"
node dist/database/docker-entry.js
exec node dist/main
