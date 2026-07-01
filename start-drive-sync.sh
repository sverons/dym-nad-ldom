#!/bin/bash
# Запуск фонового наблюдателя за изменениями
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$PROJECT_DIR/.sync-drive.pid"
WATCHER="$PROJECT_DIR/scripts/watch-drive.py"
LOG_FILE="$PROJECT_DIR/.sync-drive.log"

if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "✅ Наблюдатель уже запущен (PID $OLD_PID)"
    echo "   Лог: $LOG_FILE"
    exit 0
  fi
fi

nohup python3 "$WATCHER" >> "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"

echo "✅ Автосинхронизация с Google Drive запущена (PID $NEW_PID)"
echo "   Папка на Drive: «Телефон»"
echo "   Лог: $LOG_FILE"
echo ""
echo "Остановить: ./stop-drive-sync.sh"
