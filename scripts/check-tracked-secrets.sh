#!/usr/bin/env bash
# Fail if known secret-shaped strings appear in *git-tracked* files only.
# Does not read .env.local / engine/.env (they are usually untracked).
set -euo pipefail
cd "$(dirname "$0")/.."

PATTERN='jup_[0-9a-f]{20,}|sim_[A-Za-z0-9_-]{10,}|AIzaSy[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|sk_ant_[A-Za-z0-9_-]+|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]+|xox[baprs]-[A-Za-z0-9-]+'

if git grep -nE "$PATTERN" -- ':!*.lock' ':!package-lock.json' 2>/dev/null; then
  echo >&2 ""
  echo >&2 "ERROR: Possible secret material found in tracked files. Remove or redact, then commit."
  exit 1
fi

echo "OK: no tracked files matched common secret patterns."
