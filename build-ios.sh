#!/usr/bin/env bash
# Сборка iOS-приложения «Дым над льдом» (симулятор или устройство).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
LINK="/tmp/dym-nad-ldom-build"
SCHEME="DymNadLdom"
PROJECT="$LINK/ios/DymNadLdom.xcodeproj"
DEST="${1:-simulator}"  # simulator | device

if ! xcodebuild -version &>/dev/null; then
  echo "Требуется Xcode из App Store (не только Command Line Tools)." >&2
  echo "После установки: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer" >&2
  exit 1
fi

echo "→ Синхронизация веб-приложения…"
bash "$ROOT/scripts/sync-ios-www.sh"

rm -f "$LINK"
ln -sf "$ROOT" "$LINK"

cd "$LINK/ios"

if [[ "$DEST" == "device" ]]; then
  echo "→ Сборка для iPhone (Release, generic iOS)…"
  xcodebuild \
    -project DymNadLdom.xcodeproj \
    -scheme "$SCHEME" \
    -configuration Release \
    -destination 'generic/platform=iOS' \
    -derivedDataPath "$LINK/ios/build" \
    CODE_SIGN_IDENTITY="Apple Development" \
    build
  APP="$LINK/ios/build/Build/Products/Release-iphoneos/DymNadLdom.app"
  if [[ -d "$APP" ]]; then
    echo ""
    echo "✓ Приложение собрано: $APP"
    echo "  Установите через Xcode → Window → Devices and Simulators"
    echo "  или создайте Archive: Product → Archive в Xcode."
  fi
else
  echo "→ Сборка для симулятора…"
  xcodebuild \
    -project DymNadLdom.xcodeproj \
    -scheme "$SCHEME" \
    -configuration Debug \
    -destination 'platform=iOS Simulator,name=iPhone 16' \
    -derivedDataPath "$LINK/ios/build" \
    build

  APP="$LINK/ios/build/Build/Products/Debug-iphonesimulator/DymNadLdom.app"
  if [[ -d "$APP" ]]; then
    cp -R "$APP" "$ROOT/DymNadLdom-Simulator.app"
    echo ""
    echo "✓ Симулятор: $ROOT/DymNadLdom-Simulator.app"
    echo "  Запуск: open -a Simulator && xcrun simctl install booted \"$ROOT/DymNadLdom-Simulator.app\""
  fi
fi
