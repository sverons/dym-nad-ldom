#!/usr/bin/env bash
# Создание репозитория на GitHub и push проекта.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GH="${GH_BIN:-/tmp/gh-install/gh_2.69.0_macOS_arm64/bin/gh}"
REPO_NAME="${GITHUB_REPO_NAME:-dym-nad-ldom}"

if [[ ! -x "$GH" ]]; then
  echo "GitHub CLI не найден. Скачайте: https://cli.github.com/" >&2
  exit 1
fi

if ! "$GH" auth status &>/dev/null; then
  echo "→ Войдите в GitHub (откроется браузер)…"
  "$GH" auth login -h github.com -p https -w -s repo
fi

cd "$ROOT"

if ! git rev-parse --git-dir &>/dev/null; then
  git init
  git add -A
  git -c user.name="${GIT_USER_NAME:-Pavel}" -c user.email="${GIT_USER_EMAIL:-pavel@users.noreply.github.com}" \
    commit -m "Initial commit: детективная игра «Дым над льдом»."
fi

echo "→ Создание репозитория $REPO_NAME на GitHub…"
"$GH" repo create "$REPO_NAME" \
  --private \
  --source=. \
  --remote=origin \
  --push \
  --description "Детективная настольная игра «Дым над льдом»: эмулятор телефона, Android/iOS"

echo ""
echo "✓ Готово: $("$GH" repo view --json url -q .url)"
