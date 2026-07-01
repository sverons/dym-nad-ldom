#!/usr/bin/env bash
# Открывает Xcode в App Store. Полная установка — только через App Store (~12 ГБ).
set -euo pipefail

XCODE_APP="/Applications/Xcode.app"
XCODE_ID="497799835"

echo "→ Открываю Xcode в App Store…"
open "macappstore://apps.apple.com/app/id${XCODE_ID}"

if [[ -d "$XCODE_APP" ]]; then
  echo "✓ Xcode уже установлен: $XCODE_APP"
  sudo xcode-select -s "$XCODE_APP/Contents/Developer"
  xcodebuild -version
  exit 0
fi

cat <<'EOF'

Установите Xcode в открывшемся App Store (кнопка «Загрузить» / Get).

После установки выполните в терминале:

  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
  sudo xcodebuild -license accept
  open /Applications/Xcode.app

Затем: Xcode → Settings → Accounts → добавьте Apple ID.

Сборка IPA:
  ./build-ipa.sh

EOF
