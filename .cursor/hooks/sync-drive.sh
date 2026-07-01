#!/bin/bash
# Cursor hook: синхронизация после редактирования файлов агентом
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
/bin/bash "$PROJECT_DIR/scripts/sync-to-drive.sh" --debounced >/dev/null 2>&1 &
exit 0
