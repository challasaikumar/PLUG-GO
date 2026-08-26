#!/bin/sh
# Start a project-local PostgreSQL 16 cluster for Plug and Go development.
# Does not use the machine's existing Postgres (port 5432) or its credentials.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$ROOT/.postgres-data"
PORT="${PNG_DEV_PG_PORT:-54329}"
USER_NAME="plugandgo"
DB_NAME="plugandgo"

if ! command -v initdb >/dev/null 2>&1; then
  echo "initdb not found. Install PostgreSQL 16 (Homebrew: postgresql@16)." >&2
  exit 1
fi

if [ ! -f "$DATA/PG_VERSION" ]; then
  mkdir -p "$DATA"
  initdb -D "$DATA" --username="$USER_NAME" --auth=trust --no-instructions >/dev/null
fi

if pg_isready -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; then
  echo "Plug and Go Postgres already accepting connections on 127.0.0.1:$PORT"
else
  pg_ctl -D "$DATA" -l "$DATA/pg.log" -o "-p $PORT -k $DATA" start >/dev/null
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if pg_isready -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; then
      break
    fi
    sleep 0.3
  done
fi

if ! psql -h 127.0.0.1 -p "$PORT" -U "$USER_NAME" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
  createdb -h 127.0.0.1 -p "$PORT" -U "$USER_NAME" "$DB_NAME"
fi

echo "postgresql://$USER_NAME@127.0.0.1:$PORT/$DB_NAME"
