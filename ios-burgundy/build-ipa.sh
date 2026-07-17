#!/usr/bin/env bash
# Сборка IPA «Замки Бургундии» для установки на iPhone (Development).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
LINK="/tmp/burgundy-scorer-build"
SCHEME="BurgundyScorer"
ARCHIVE="$LINK/build/BurgundyScorer.xcarchive"
EXPORT_DIR="$LINK/build/ipa-export"
OUT_IPA="$ROOT/BurgundyScorer.ipa"
OUT_APP="$ROOT/BurgundyScorer.app"

if ! xcodebuild -version &>/dev/null; then
  echo "✗ Требуется Xcode из App Store." >&2
  exit 1
fi

TEAM_ID="${BURGUNDY_IOS_TEAM:-}"
if [[ -z "$TEAM_ID" ]]; then
  TEAM_ID=$(grep -m1 'DEVELOPMENT_TEAM = ' "$ROOT/BurgundyScorer.xcodeproj/project.pbxproj" \
    | sed -E 's/.*DEVELOPMENT_TEAM = ([A-Z0-9]+);.*/\1/' || true)
fi

rm -f "$LINK"
ln -sf "$ROOT" "$LINK"
mkdir -p "$LINK/build"
cd "$LINK"

ARCHIVE_ARGS=(
  -project BurgundyScorer.xcodeproj
  -scheme "$SCHEME"
  -configuration Release
  -destination generic/platform=iOS
  -archivePath "$ARCHIVE"
  -allowProvisioningUpdates
)

if [[ -n "$TEAM_ID" ]]; then
  echo "→ Team ID: $TEAM_ID"
  ARCHIVE_ARGS+=(DEVELOPMENT_TEAM="$TEAM_ID")
fi

echo "→ Archive…"
xcodebuild "${ARCHIVE_ARGS[@]}" archive

echo "→ Export IPA…"
rm -rf "$EXPORT_DIR"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$LINK/ExportOptions.plist" \
  -allowProvisioningUpdates

BUILT_IPA=$(find "$EXPORT_DIR" -maxdepth 1 -name '*.ipa' | head -1)
if [[ -z "$BUILT_IPA" || ! -f "$BUILT_IPA" ]]; then
  echo "✗ IPA не найден после export." >&2
  exit 1
fi

cp "$BUILT_IPA" "$OUT_IPA"

APP_IN_ARCHIVE="$ARCHIVE/Products/Applications/BurgundyScorer.app"
if [[ -d "$APP_IN_ARCHIVE" ]]; then
  rm -rf "$OUT_APP"
  cp -R "$APP_IN_ARCHIVE" "$OUT_APP"
fi

echo ""
echo "✓ IPA:  $OUT_IPA"
echo "✓ APP:  $OUT_APP"
echo ""
echo "Установка на iPhone:"
echo "  • Xcode → Window → Devices and Simulators → перетащите IPA"
echo "  • или AltStore / Sideloadly"
