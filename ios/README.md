# iOS-приложение «Телефон»

Нативная обёртка (Swift + WKWebView) для `phone-vanilla/` — аналог Android APK.

## Требования

1. **Xcode** из App Store (не только Command Line Tools)
2. После установки:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```
3. Apple ID для подписи (бесплатный аккаунт подходит для установки на свой iPhone)

## Быстрый старт

```bash
# Синхронизировать веб-файлы
./scripts/sync-ios-www.sh

# Открыть в Xcode
open ios/DymNadLdom.xcodeproj
```

В Xcode:
1. Target **DymNadLdom** → **Signing & Capabilities** → выберите свою **Team**
2. Подключите iPhone или выберите симулятор
3. **Product → Run** (⌘R)

## Сборка из терминала

```bash
chmod +x build-ios.sh
./build-ios.sh simulator   # симулятор
./build-ios.sh device      # реальный iPhone (нужна подпись)
```

Или двойной клик по **Сборка iOS.command** в корне проекта.

## Структура

| Путь | Назначение |
|------|------------|
| `ios/DymNadLdom/PhoneWebView.swift` | WKWebView, загрузка `www/index.html` |
| `ios/DymNadLdom/www/` | копия `phone-vanilla/` (генерируется скриптом) |
| `scripts/sync-ios-www.sh` | синхронизация веб-приложения |

## Публикация в App Store

1. Product → Archive
2. Distribute App → App Store Connect
3. Нужен платный Apple Developer Program ($99/год)

## Путь с кириллицей

Сборка из терминала идёт через symlink `/tmp/dym-nad-ldom-build`, как для Android Gradle.
