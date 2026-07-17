#!/usr/bin/env bash
# Сборка IPA «Дым над льдом» для установки на iPhone (Development).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
LINK="/tmp/dym-nad-ldom-build"
SCHEME="DymNadLdom"
ARCHIVE="$LINK/ios/build/DymNadLdom.xcarchive"
EXPORT_DIR="$LINK/ios/build/ipa-export"
OUT_IPA="$ROOT/DymNadLdom.ipa"

if ! xcodebuild -version &>/dev/null; then
  echo "✗ Xcode не установлен — IPA собрать нельзя." >&2
  echo "" >&2
  echo "1. Установите Xcode из App Store (~12 ГБ)" >&2
  echo "2. sudo xcode-select -s /Applications/Xcode.app/Contents/Developer" >&2
  echo "3. Откройте Xcode один раз и примите лицензию" >&2
  echo "4. Xcode → Settings → Accounts → добавьте Apple ID" >&2
  echo "5. Запустите снова: ./build-ipa.sh" >&2
  exit 1
fi

if ! xcodebuild -checkFirstLaunchStatus &>/dev/null; then
  echo "✗ Не принята лицензия Xcode." >&2
  echo "  sudo xcodebuild -license accept" >&2
  echo "  или двойной клик: Продолжить сборку IPA.command" >&2
  exit 1
fi

TEAM_ID="${DYM_IOS_TEAM:-}"
if [[ -z "$TEAM_ID" ]]; then
  TEAM_ID=$(grep -m1 'DEVELOPMENT_TEAM = ' "$ROOT/ios/DymNadLdom.xcodeproj/project.pbxproj" \
    | sed -E 's/.*DEVELOPMENT_TEAM = ([A-Z0-9]+);.*/\1/' || true)
fi
if [[ -z "$TEAM_ID" || "$TEAM_ID" == "" ]]; then
  TEAM_ID=$(security find-identity -v -p codesigning 2>/dev/null \
    | grep "Apple Development" \
    | head -1 \
    | sed -E 's/.*\(([A-Z0-9]{10})\).*/\1/' || true)
fi

if ! xcrun devicectl list devices 2>/dev/null | grep -q "iPhone\|iPad"; then
  if ! xcrun xctrace list devices 2>/dev/null | grep -E "^\S.*iPhone|^\S.*iPad" | grep -v Simulator | grep -q .; then
    echo "⚠ Физический iPhone/iPad не подключён." >&2
    echo "  Подключите устройство по USB, разблокируйте и нажмите «Доверять»." >&2
    echo "  Xcode → Window → Devices and Simulators — устройство должно появиться." >&2
    echo "  Затем снова: ./build-ipa.sh" >&2
    echo "" >&2
  fi
fi

echo "→ Синхронизация веб-приложения…"
bash "$ROOT/scripts/sync-ios-www.sh"

rm -f "$LINK"
ln -sf "$ROOT" "$LINK"
mkdir -p "$LINK/ios/build"

cd "$LINK/ios"

ARCHIVE_ARGS=(
  -project DymNadLdom.xcodeproj
  -scheme "$SCHEME"
  -configuration Release
  -destination generic/platform=iOS
  -archivePath "$ARCHIVE"
  -allowProvisioningUpdates
)

if [[ -n "$TEAM_ID" ]]; then
  echo "→ Team ID: $TEAM_ID"
  ARCHIVE_ARGS+=(DEVELOPMENT_TEAM="$TEAM_ID")
else
  echo "→ Team ID не задан — Xcode попробует автоматическую подпись"
  echo "  (или задайте: DYM_IOS_TEAM=XXXXXXXXXX ./build-ipa.sh)"
fi

echo "→ Archive…"
xcodebuild "${ARCHIVE_ARGS[@]}" archive

echo "→ Export IPA…"
rm -rf "$EXPORT_DIR"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$LINK/ios/ExportOptions.plist" \
  -allowProvisioningUpdates

BUILT_IPA=$(find "$EXPORT_DIR" -maxdepth 1 -name '*.ipa' | head -1)
if [[ -z "$BUILT_IPA" || ! -f "$BUILT_IPA" ]]; then
  echo "✗ IPA не найден после export." >&2
  exit 1
fi

cp "$BUILT_IPA" "$OUT_IPA"
echo ""
echo "✓ IPA готов: $OUT_IPA"
echo "  Установка на iPhone:"
echo "  • Xcode → Window → Devices and Simulators → перетащите IPA"
echo "  • или AltStore / Sideloadly (нужен Apple ID)"
