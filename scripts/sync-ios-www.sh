#!/usr/bin/env bash
# Копирует веб-приложение телефона в iOS bundle (www/).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/phone-vanilla"
DEST="$ROOT/ios/DymNadLdom/www"

if [[ ! -d "$SRC" ]]; then
  echo "Не найдена папка phone-vanilla: $SRC" >&2
  exit 1
fi

rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$SRC/." "$DEST/"

# Системные шрифты вместо Google Fonts (офлайн в bundle)
if [[ "$(uname)" == "Darwin" ]]; then
  sed -i '' '/fonts\.googleapis\.com/d' "$DEST/index.html"
  sed -i '' '/fonts\.gstatic\.com/d' "$DEST/index.html"
  sed -i '' '/<link rel="preconnect"/d' "$DEST/index.html"
  sed -i '' "s/font-family: 'DM Sans'[^\"]*\"/font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif\"/" "$DEST/index.html"
else
  sed -i '/fonts\.googleapis\.com/d' "$DEST/index.html"
  sed -i '/fonts\.gstatic\.com/d' "$DEST/index.html"
  sed -i '/<link rel="preconnect"/d' "$DEST/index.html"
  sed -i "s/font-family: 'DM Sans'[^\"]*\"/font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif\"/" "$DEST/index.html"
fi

COUNT=$(find "$DEST" -type f | wc -l | tr -d ' ')
echo "Синхронизировано $COUNT файлов → $DEST"
