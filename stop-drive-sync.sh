#!/bin/bash
# Остановка фонового наблюдателя
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$PROJECT_DIR/.sync-drive.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "Наблюдатель не запущен"
  exit 0
fi

PID=$(cat "$PID_FILE")
if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "✅ Наблюдатель остановлен (PID $PID)"
else
  echo "Процесс не найден, очищаю PID-файл"
fi

rm -f "$PID_FILE"
