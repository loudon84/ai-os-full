#!/usr/bin/env bash
#
# Backup the Portal PostgreSQL database using pg_dump.
#
# Usage:
#   scripts/backup-db.sh                          # backup with default name
#   scripts/backup-db.sh --name my-backup         # custom backup name
#   scripts/backup-db.sh --output /path/to/dir    # custom output directory
#
# Environment:
#   DATABASE_URL   — PostgreSQL connection string (required)
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORTAL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKUP_NAME=""
OUTPUT_DIR="$PORTAL_ROOT/.portal/backups"

while [ $# -gt 0 ]; do
  case "$1" in
    --name)
      shift
      [ $# -gt 0 ] || { echo "Error: --name requires a value" >&2; exit 1; }
      BACKUP_NAME="$1"
      ;;
    --output)
      shift
      [ $# -gt 0 ] || { echo "Error: --output requires a directory" >&2; exit 1; }
      OUTPUT_DIR="$1"
      ;;
    -h|--help)
      echo "Usage: scripts/backup-db.sh [--name NAME] [--output DIR]"
      exit 0
      ;;
    *)
      echo "Error: unexpected argument: $1" >&2
      exit 1
      ;;
  esac
  shift
done

DATABASE_URL="${DATABASE_URL:-}"

if [ -z "$DATABASE_URL" ]; then
  if [ -f "$PORTAL_ROOT/.env" ]; then
    DATABASE_URL="$(grep -E '^DATABASE_URL=' "$PORTAL_ROOT/.env" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set. Set it in environment or .env file." >&2
  exit 1
fi

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_NAME="${BACKUP_NAME:-portal-db-$TIMESTAMP}"
BACKUP_FILE="$OUTPUT_DIR/$BACKUP_NAME.sql.gz"

mkdir -p "$OUTPUT_DIR"

echo "Backing up Portal database..."
echo "  Output: $BACKUP_FILE"

pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip > "$BACKUP_FILE"

FILE_SIZE="$(du -h "$BACKUP_FILE" | cut -f1)"
echo "  Done. Size: $FILE_SIZE"
echo "  To restore: gunzip -c $BACKUP_FILE | psql \$DATABASE_URL"
