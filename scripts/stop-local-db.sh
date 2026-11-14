#!/usr/bin/env bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$DIR/.postgres"
PORT=5433

# Detect PostgreSQL binaries
if [ -x "/usr/lib/postgresql/16/bin/pg_ctl" ]; then
  PG_BIN="/usr/lib/postgresql/16/bin"
elif command -v pg_ctl >/dev/null 2>&1; then
  PG_BIN="$(dirname "$(command -v pg_ctl)")"
else
  PG_BIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -n 1)
fi

if "$PG_BIN/pg_isready" -h /tmp -p "$PORT" >/dev/null 2>&1 || "$PG_BIN/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; then
  echo "Stopping PostgreSQL on port $PORT..."
  "$PG_BIN/pg_ctl" -D "$DATA_DIR" stop
else
  echo "PostgreSQL is not running on port $PORT."
fi
