#!/bin/bash
cd "$(dirname "$0")"
chmod +x build-ipa.sh scripts/sync-ios-www.sh scripts/install-xcode-ios-platform.sh

if ! xcodebuild -checkFirstLaunchStatus &>/dev/null; then
  echo "→ Принятие лицензии Xcode (нужен пароль администратора)…"
  osascript -e 'do shell script "xcodebuild -license accept" with administrator privileges' || {
    echo "Выполните: sudo xcodebuild -license accept"
    read -p "Нажмите Enter…"
    exit 1
  }
fi

if ! xcodebuild -project ios/DymNadLdom.xcodeproj -scheme DymNadLdom -showdestinations 2>&1 | grep -q "platform:iOS Simulator"; then
  echo "→ Нужна платформа iOS (Components). Загрузка…"
  ./scripts/install-xcode-ios-platform.sh || {
    echo ""
    echo "Или вручную: Xcode → Settings → Components → iOS 26.5 → Get"
    read -p "Нажмите Enter…"
    exit 1
  }
fi

echo "→ Сборка IPA…"
./build-ipa.sh
echo ""
read -p "Готово. Нажмите Enter…"
