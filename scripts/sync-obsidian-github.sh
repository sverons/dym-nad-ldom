#!/usr/bin/env bash
# Sync obsidian/ with https://github.com/bestkvestnn-pixel/Obsidian_Dym
#
# Usage:
#   ./scripts/sync-obsidian-github.sh init
#   ./scripts/sync-obsidian-github.sh push
#   ./scripts/sync-obsidian-github.sh pull
#   ./scripts/sync-obsidian-github.sh status
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VAULT="$ROOT/obsidian"
REMOTE_URL="${OBSIDIAN_GITHUB_URL:-https://github.com/bestkvestnn-pixel/Obsidian_Dym.git}"
GIT_BRANCH="${OBSIDIAN_GITHUB_BRANCH:-main}"
GH="${GH_BIN:-/tmp/gh-install/gh_2.69.0_macOS_arm64/bin/gh}"

ensure_vault_git() {
  if [[ ! -d "$VAULT/.git" ]]; then
    echo "-> git init in obsidian/"
    git -C "$VAULT" init -b "$GIT_BRANCH"
  fi

  if git -C "$VAULT" remote get-url origin &>/dev/null; then
    current="$(git -C "$VAULT" remote get-url origin)"
    if [[ "$current" != "$REMOTE_URL" ]]; then
      echo "-> update origin: $current -> $REMOTE_URL"
      git -C "$VAULT" remote set-url origin "$REMOTE_URL"
    fi
  else
    echo "-> origin -> $REMOTE_URL"
    git -C "$VAULT" remote add origin "$REMOTE_URL"
  fi
}

check_git_auth() {
  if git -C "$VAULT" ls-remote origin &>/dev/null; then
    return 0
  fi
  echo "WARNING: no access to GitHub ($REMOTE_URL)." >&2
  echo "  1. Create Obsidian_Dym repo in bestkvestnn-pixel account (private)" >&2
  echo "  2. Run: gh auth login (bestkvestnn-pixel account)" >&2
  echo "  3. Then: cd obsidian && git push -u origin $GIT_BRANCH" >&2
  return 1
}

create_github_repo() {
  if command -v "$GH" &>/dev/null && "$GH" auth status &>/dev/null; then
    if ! check_git_auth; then
      echo "-> creating Obsidian_Dym repo..."
      "$GH" repo create bestkvestnn-pixel/Obsidian_Dym \
        --private \
        --description "Obsidian vault: Dym nad ldom" \
        || true
    fi
  fi
}

init_sync() {
  ensure_vault_git
  create_github_repo
  echo ""
  echo "OK: vault git at $VAULT/.git"
  echo "  origin -> $(git -C "$VAULT" remote get-url origin)"
  echo "  push: ./scripts/sync-obsidian-github.sh push"
}

push_obsidian() {
  init_sync
  check_git_auth

  if [[ -n "$(git -C "$VAULT" status --porcelain)" ]]; then
    echo "-> commit vault changes..."
    git -C "$VAULT" add -A
    git -C "$VAULT" -c user.name="${GIT_USER_NAME:-Pavel}" \
      -c user.email="${GIT_USER_EMAIL:-pavel@users.noreply.github.com}" \
      commit -m "vault backup: $(date '+%Y-%m-%d %H:%M')"
  fi

  echo "-> push -> origin/$GIT_BRANCH"
  git -C "$VAULT" push -u origin "$GIT_BRANCH"
  echo "OK: $REMOTE_URL"
}

pull_obsidian() {
  init_sync
  check_git_auth

  echo "-> pull <- origin/$GIT_BRANCH"
  git -C "$VAULT" pull --rebase origin "$GIT_BRANCH"
  echo "OK: obsidian/ updated"
}

show_status() {
  ensure_vault_git
  echo "Vault: $VAULT"
  echo "origin -> $(git -C "$VAULT" remote get-url origin)"
  echo ""
  git -C "$VAULT" status
}

cmd="${1:-status}"
case "$cmd" in
  init) init_sync ;;
  push) push_obsidian ;;
  pull) pull_obsidian ;;
  status) show_status ;;
  *)
    echo "Unknown command: $cmd" >&2
    echo "Commands: init | push | pull | status" >&2
    exit 1
    ;;
esac
