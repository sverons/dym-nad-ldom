#!/bin/bash
# Синхронизация проекта с Google Drive
set -euo pipefail

RCLONE="$HOME/.local/bin/rclone"
REMOTE_NAME="gdrive"
DRIVE_FOLDER="Телефон"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

LOCK_FILE="$PROJECT_DIR/.sync-drive.lock"
PENDING_FILE="$PROJECT_DIR/.sync-drive.pending"
LOG_FILE="$PROJECT_DIR/.sync-drive.log"
DEBOUNCE_SEC=4

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

do_sync() {
  if ! "$RCLONE" listremotes 2>/dev/null | grep -q "^${REMOTE_NAME}:$"; then
    log "ERROR: rclone не настроен. Запустите ./setup-rclone.sh"
    return 1
  fi

  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    log "SKIP: синхронизация уже выполняется"
    return 0
  fi

  log "START: синхронизация → Google Drive / $DRIVE_FOLDER"

  if "$RCLONE" sync "$PROJECT_DIR" "${REMOTE_NAME}:${DRIVE_FOLDER}" \
    --exclude "rclone-*/**" \
    --exclude "rclone-current-*.zip" \
    --exclude "Телефон.zip" \
    --exclude ".DS_Store" \
    --exclude ".sync-drive.log" \
    --exclude ".sync-drive.lock" \
    --exclude ".sync-drive.pending" \
    --exclude ".sync-drive.pid" \
    --exclude ".git/**" \
    --exclude "scripts/__pycache__/**" \
    --transfers 4 \
    --checkers 8 \
    --quiet; then
    log "OK: синхронизация завершена"
  else
    log "ERROR: синхронизация не удалась"
    return 1
  fi
}

debounced_sync() {
  date +%s > "$PENDING_FILE"

  (
    sleep "$DEBOUNCE_SEC"
    last_pending=$(cat "$PENDING_FILE" 2>/dev/null || echo 0)
    now=$(date +%s)
    if [ "$((now - last_pending))" -lt "$DEBOUNCE_SEC" ]; then
      exit 0
    fi
    do_sync
  ) &
}

case "${1:-}" in
  --now)
    do_sync
    ;;
  --debounced|"")
    debounced_sync
    ;;
  *)
    echo "Использование: $0 [--now|--debounced]"
    exit 1
    ;;
esac
