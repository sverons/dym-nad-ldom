#!/usr/bin/env bash
# Загружает платформу iOS для Xcode (нужна для сборки IPA и симулятора).
set -euo pipefail

if ! xcodebuild -version &>/dev/null; then
  echo "Xcode не установлен." >&2
  exit 1
fi

echo "→ Загрузка платформы iOS (~ несколько ГБ, подождите)…"
xcodebuild -downloadPlatform iOS

echo ""
echo "✓ Платформа iOS установлена."
echo "  Дальше: ./build-ipa.sh"
