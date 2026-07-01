# Сборка APK — «Дым над льдом»

Приложение — WebView-оболочка вокруг `phone-vanilla/` (телефон игрока). Работает **офлайн**, данные хранятся в `localStorage`.

## Быстрая сборка

### Вариант A: Android Studio (рекомендуется)

1. Установите [Android Studio](https://developer.android.com/studio)
2. В терминале из корня проекта:
   ```bash
   chmod +x scripts/sync-android-www.sh build-apk.sh
   ./scripts/sync-android-www.sh
   ```
3. Android Studio → **Open** → папка `android/`
4. Дождитесь синхронизации Gradle
5. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
6. APK: `android/app/build/outputs/apk/debug/app-debug.apk`

### Вариант B: командная строка

```bash
./build-apk.sh
```

Скрипт синхронизирует веб-файлы и соберёт `DymNadLdom-debug.apk` в корне проекта.

Требуется:
- Android SDK (`ANDROID_HOME` или `~/Library/Android/sdk` на Mac)
- JDK 17+

Установка на телефон:
```bash
adb install -r DymNadLdom-debug.apk
```

## После изменений в phone-vanilla/

Перед каждой сборкой обновите assets:

```bash
./scripts/sync-android-www.sh
```

Или просто запустите `./build-apk.sh` — он синхронизирует автоматически.

## Пароли в приложении

- **128500** — основная учётка  
- **123456** — служебная  
- **000000** / **654321** — админ

## Release APK (подпись)

1. Android Studio → **Build → Generate Signed Bundle / APK**
2. Создайте keystore
3. Выберите **release** build variant

Или в `android/`:
```bash
./gradlew assembleRelease
```
(нужна настройка signing config в `app/build.gradle.kts`)

## Структура

```
android/                    — Gradle-проект
  app/src/main/
    assets/www/             — копия phone-vanilla (генерируется)
    java/.../MainActivity.kt — WebView
scripts/sync-android-www.sh — копирование веб-приложения
build-apk.sh                — сборка одной командой
```
