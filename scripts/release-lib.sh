#!/usr/bin/env bash
#
# Release helper library for Portal.
# Sourced by release.sh — provides versioning, tagging, and npm publish utilities.
#

if [ -z "${PORTAL_ROOT:-}" ]; then
  PORTAL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

release_info() {
  echo "$@"
}

release_warn() {
  echo "Warning: $*" >&2
}

release_fail() {
  echo "Error: $*" >&2
  exit 1
}

git_remote_exists() {
  git -C "$PORTAL_ROOT" remote get-url "$1" >/dev/null 2>&1
}

resolve_release_remote() {
  for remote in origin upstream; do
    if git_remote_exists "$remote"; then
      echo "$remote"
      return 0
    fi
  done
  release_fail "no git remote found (tried origin, upstream)"
}

fetch_release_remote() {
  local remote="$1"
  git -C "$PORTAL_ROOT" fetch "$remote" --tags --quiet 2>/dev/null || true
}

git_current_branch() {
  git -C "$PORTAL_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo ""
}

require_on_master_branch() {
  local branch
  branch="$(git_current_branch)"
  if [ "$branch" != "master" ] && [ "$branch" != "main" ]; then
    release_fail "canary releases must be on master/main, currently on: $branch"
  fi
}

require_clean_worktree() {
  local dirty
  dirty="$(git -C "$PORTAL_ROOT" status --porcelain 2>/dev/null || true)"
  if [ -n "$dirty" ]; then
    release_fail "working tree has uncommitted changes. Commit or stash before releasing."
  fi
}

utc_date_iso() {
  date -u +%Y-%m-%d
}

get_last_stable_tag() {
  git -C "$PORTAL_ROOT" tag --list 'v*' --sort=-version:refname 2>/dev/null | head -1 || echo ""
}

get_current_stable_version() {
  node -e "console.log(require('$PORTAL_ROOT/package.json').version)"
}

next_stable_version() {
  local release_date="$1"
  shift
  local year month day patch

  year="$(echo "$release_date" | cut -d- -f1)"
  month="$(echo "$release_date" | cut -d- -f2 | sed 's/^0//')"
  day="$(echo "$release_date" | cut -d- -f3 | sed 's/^0//')"

  local base="${year}.${month}${day}"
  patch=0

  while git -C "$PORTAL_ROOT" tag --list "v${base}.${patch}" 2>/dev/null | grep -q .; do
    patch=$((patch + 1))
  done

  echo "${base}.${patch}"
}

next_canary_version() {
  local stable_version="$1"
  shift
  local n=0

  while npm view "portal@${stable_version}-canary.${n}" version >/dev/null 2>&1; do
    n=$((n + 1))
  done

  echo "${stable_version}-canary.${n}"
}

canary_tag_name() {
  echo "canary/v$1"
}

stable_tag_name() {
  echo "v$1"
}

git_local_tag_exists() {
  git -C "$PORTAL_ROOT" tag --list "$1" 2>/dev/null | grep -q .
}

git_remote_tag_exists() {
  local tag="$1"
  local remote="$2"
  git -C "$PORTAL_ROOT" ls-remote --tags "$remote" "refs/tags/$tag" 2>/dev/null | grep -q .
}

npm_package_version_exists() {
  local package="$1"
  local version="$2"
  npm view "${package}@${version}" version >/dev/null 2>&1
}

wait_for_npm_package_version() {
  local package="$1"
  local version="$2"
  local attempts="$3"
  local delay="$4"
  local i=0

  while [ $i -lt $attempts ]; do
    if npm_package_version_exists "$package" "$version"; then
      return 0
    fi
    sleep "$delay"
    i=$((i + 1))
  done

  return 1
}

require_npm_publish_auth() {
  local dry_run="$1"
  if [ "$dry_run" = true ]; then
    return 0
  fi
  npm whoami >/dev/null 2>&1 || release_fail "npm publish auth required. Run npm login."
}

list_public_package_info() {
  node -e "
    const { execSync } = require('child_process');
    const root = '$PORTAL_ROOT';
    const ws = JSON.parse(execSync('pnpm -r list --json', { cwd: root, encoding: 'utf8' }));
    const lines = [];
    for (const pkg of ws) {
      if (pkg.private) continue;
      const rel = pkg.path.replace(root + '/', '');
      lines.push(rel + '\t' + pkg.name + '\t' + pkg.version);
    }
    console.log(lines.join('\n'));
  " 2>/dev/null
}

set_public_package_version() {
  local version="$1"
  pnpm --dir "$PORTAL_ROOT" -r exec -- node -e "
    const fs = require('fs');
    const p = 'package.json';
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!d.private) { d.version = '$version'; fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n'); }
  "
}

release_notes_file() {
  echo "$PORTAL_ROOT/releases/v$1.md"
}
