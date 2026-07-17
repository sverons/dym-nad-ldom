#!/usr/bin/env bash
# Сборка iOS-приложения «Замки Бургундии — счётчик очков».
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
LINK="/tmp/burgundy-scorer-build"
SCHEME="BurgundyScorer"
DEST="${1:-simulator}"

if ! xcodebuild -version &>/dev/null; then
  echo "Требуется Xcode из App Store." >&2
  exit 1
fi

rm -f "$LINK"
ln -sf "$ROOT" "$LINK"
cd "$LINK"

if [[ "$DEST" == "device" ]]; then
  echo "→ Сборка для iPhone (Release)…"
  xcodebuild \
    -project BurgundyScorer.xcodeproj \
    -scheme "$SCHEME" \
    -configuration Release \
    -destination 'generic/platform=iOS' \
    -derivedDataPath "$LINK/build" \
    CODE_SIGN_IDENTITY="Apple Development" \
    build
  echo "✓ Готово: $LINK/build/Build/Products/Release-iphoneos/BurgundyScorer.app"
else
  echo "→ Сборка для симулятора…"
  xcodebuild \
    -project BurgundyScorer.xcodeproj \
    -scheme "$SCHEME" \
    -configuration Debug \
    -destination 'platform=iOS Simulator,name=iPhone 17' \
    -derivedDataPath "$LINK/build" \
    build

  APP="$LINK/build/Build/Products/Debug-iphonesimulator/BurgundyScorer.app"
  if [[ -d "$APP" ]]; then
    cp -R "$APP" "$ROOT/BurgundyScorer-Simulator.app"
    echo "✓ Симулятор: $ROOT/BurgundyScorer-Simulator.app"
  fi
fi
