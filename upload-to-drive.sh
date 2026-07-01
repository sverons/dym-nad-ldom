#!/bin/bash
# Повторная загрузка проекта в Google Drive (после настройки rclone)
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$SCRIPT_DIR/scripts/sync-to-drive.sh" --now
