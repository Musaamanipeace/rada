#!/usr/bin/env bash
set -e

# Resolve project root
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$DIR/.postgres"
PORT=5433

# Detect PostgreSQL binaries
if [ -x "/usr/lib/postgresql/16/bin/initdb" ]; then
  PG_BIN="/usr/lib/postgresql/16/bin"
elif command -v initdb >/dev/null 2>&1; then
  PG_BIN="$(dirname "$(command -v initdb)")"
else
  PG_BIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -n 1)
fi

if [ -z "$PG_BIN" ] || [ ! -x "$PG_BIN/initdb" ]; then
  echo "Error: PostgreSQL binaries (initdb/pg_ctl) not found."
  exit 1
fi

# 1. Initialize data directory if not already initialized
if [ ! -d "$DATA_DIR" ] || [ ! -f "$DATA_DIR/PG_VERSION" ]; then
  echo "Initializing PostgreSQL cluster in $DATA_DIR..."
  "$PG_BIN/initdb" -D "$DATA_DIR" -U postgres -A trust
fi

# 2. Start PostgreSQL if not already running
if "$PG_BIN/pg_isready" -h /tmp -p "$PORT" >/dev/null 2>&1 || "$PG_BIN/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; then
  echo "PostgreSQL is already running on port $PORT."
else
  echo "Starting PostgreSQL on port $PORT..."
  "$PG_BIN/pg_ctl" -D "$DATA_DIR" -l "$DATA_DIR/logfile" -o "-p $PORT -k /tmp" start
fi

# 3. Create 'rada' database if it doesn't exist
if ! "$PG_BIN/psql" -h /tmp -p "$PORT" -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw rada; then
  echo "Creating database 'rada'..."
  "$PG_BIN/createdb" -p "$PORT" -h /tmp -U postgres rada || true
fi

echo "PostgreSQL is ready on port $PORT (socket: /tmp)."
