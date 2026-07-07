#!/usr/bin/env bash
# Синхронизация папки obsidian/ с https://github.com/sverons/Obsidian_Dym
#
# Использование:
#   ./scripts/sync-obsidian-github.sh init     — добавить remote obsidian
#   ./scripts/sync-obsidian-github.sh push     — отправить obsidian/ на GitHub
#   ./scripts/sync-obsidian-github.sh pull     — забрать изменения с GitHub
#   ./scripts/sync-obsidian-github.sh status   — статус
#
# Obsidian: откройте папку obsidian/ как vault, установите plugin «Obsidian Git».
# Для автосинхронизации из Obsidian клонируйте Obsidian_Dym отдельно или используйте push/pull здесь.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PREFIX="obsidian"
REMOTE_NAME="obsidian"
REMOTE_URL="${OBSIDIAN_GITHUB_URL:-https://github.com/sverons/Obsidian_Dym.git}"
GIT_BRANCH="${OBSIDIAN_GITHUB_BRANCH:-main}"
GH="${GH_BIN:-/tmp/gh-install/gh_2.69.0_macOS_arm64/bin/gh}"

ensure_remote() {
  if git -C "$ROOT" remote get-url "$REMOTE_NAME" &>/dev/null; then
    current="$(git -C "$ROOT" remote get-url "$REMOTE_NAME")"
    if [[ "$current" != "$REMOTE_URL" ]]; then
      echo "→ Обновление remote $REMOTE_NAME: $current → $REMOTE_URL"
      git -C "$ROOT" remote set-url "$REMOTE_NAME" "$REMOTE_URL"
    fi
  else
    echo "→ Remote $REMOTE_NAME → $REMOTE_URL"
    git -C "$ROOT" remote add "$REMOTE_NAME" "$REMOTE_URL"
  fi
}

check_git_auth() {
  if git -C "$ROOT" ls-remote "$REMOTE_NAME" &>/dev/null; then
    return 0
  fi
  echo "⚠ Нет доступа к GitHub ($REMOTE_URL)." >&2
  echo "  1. Создайте репозиторий Obsidian_Dym на github.com (private)" >&2
  echo "  2. Авторизуйтесь: gh auth login  или  git push (через браузер)" >&2
  echo "  3. Если git просит пароль — проверьте credential helper в ~/.gitconfig" >&2
  return 1
}

create_github_repo() {
  if command -v "$GH" &>/dev/null && "$GH" auth status &>/dev/null; then
    if ! check_git_auth; then
      echo "→ Создание репозитория Obsidian_Dym…"
      "$GH" repo create Obsidian_Dym \
        --private \
        --description "Obsidian vault: детективная игра «Дым над льдом»" \
        || true
    fi
  fi
}

init_sync() {
  ensure_remote
  create_github_repo
  echo ""
  echo "✓ Remote настроен: $REMOTE_NAME → $(git -C "$ROOT" remote get-url "$REMOTE_NAME")"
  echo "  Vault: $ROOT/$PREFIX"
  echo "  Отправка: ./scripts/sync-obsidian-github.sh push"
}

push_obsidian() {
  init_sync
  check_git_auth

  if [[ -n "$(git -C "$ROOT" status --porcelain -- "$PREFIX")" ]]; then
    echo "→ Коммит изменений в obsidian/…"
    git -C "$ROOT" add "$PREFIX"
    git -C "$ROOT" -c user.name="${GIT_USER_NAME:-Pavel}" \
      -c user.email="${GIT_USER_EMAIL:-pavel@users.noreply.github.com}" \
      commit -m "obsidian: sync $(date '+%Y-%m-%d %H:%M')"
  fi

  echo "-> Subtree push -> ${REMOTE_NAME}/${GIT_BRANCH}"
  git -C "$ROOT" subtree push --prefix="$PREFIX" "$REMOTE_NAME" "$GIT_BRANCH"
  echo "✓ Готово: $REMOTE_URL"
}

pull_obsidian() {
  init_sync
  check_git_auth

  echo "-> Subtree pull <- ${REMOTE_NAME}/${GIT_BRANCH}"
  git -C "$ROOT" subtree pull --prefix="$PREFIX" "$REMOTE_NAME" "$GIT_BRANCH" --squash -m "obsidian: pull $(date '+%Y-%m-%d %H:%M')"
  echo "✓ obsidian/ обновлён"
}

show_status() {
  ensure_remote
  echo "Проект: $ROOT"
  echo "Remote: $REMOTE_NAME → $(git -C "$ROOT" remote get-url "$REMOTE_NAME")"
  echo ""
  git -C "$ROOT" status -- "$PREFIX"
}

cmd="${1:-status}"
case "$cmd" in
  init) init_sync ;;
  push) push_obsidian ;;
  pull) pull_obsidian ;;
  status) show_status ;;
  *)
    echo "Неизвестная команда: $cmd" >&2
    echo "Команды: init | push | pull | status" >&2
    exit 1
    ;;
esac
