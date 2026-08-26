#!/bin/sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$ROOT/.postgres-data"
if [ -d "$DATA" ]; then
  pg_ctl -D "$DATA" stop -m fast >/dev/null 2>&1 || true
fi
echo "Stopped project-local Postgres (if it was running)."
