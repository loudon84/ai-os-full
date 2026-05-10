#!/usr/bin/env bash
#
# Build the Portal frontend and copy it into backend/public-frontend.
# This keeps @portal/server publish artifacts self-contained for static frontend serving.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORTAL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIST="$PORTAL_ROOT/frontend/.next"
BACKEND_PUBLIC="$PORTAL_ROOT/backend/public-frontend"

echo "  -> Building @portal/web..."
pnpm --dir "$PORTAL_ROOT" --filter @portal/web build

if [ ! -d "$FRONTEND_DIST" ]; then
  echo "Error: Frontend build output missing at $FRONTEND_DIST"
  exit 1
fi

rm -rf "$BACKEND_PUBLIC"
mkdir -p "$BACKEND_PUBLIC"

cp -r "$FRONTEND_DIST" "$BACKEND_PUBLIC/.next"

if [ -d "$PORTAL_ROOT/frontend/public" ]; then
  cp -r "$PORTAL_ROOT/frontend/public" "$BACKEND_PUBLIC/public"
fi

echo "  -> Copied frontend/.next to backend/public-frontend"
