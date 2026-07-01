#!/usr/bin/env bash
# Сборка APK «Дым над льдом» (debug).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
TOOLS="${DYM_ANDROID_TOOLS:-$HOME/.dym-android-tools}"
LINK="/tmp/dym-nad-ldom-build"

echo "→ Синхронизация веб-приложения…"
bash "$ROOT/scripts/sync-android-www.sh"

export JAVA_HOME="$TOOLS/jdk-17/Contents/Home"
export ANDROID_HOME="$TOOLS/android-sdk"

if [[ ! -x "$JAVA_HOME/bin/java" ]]; then
  echo "JDK не найден в $TOOLS" >&2
  echo "Запустите один раз полную установку или установите Android Studio." >&2
  exit 1
fi

if [[ ! -d "$ANDROID_HOME/platform-tools" ]]; then
  echo "Android SDK не найден в $ANDROID_HOME" >&2
  exit 1
fi

export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

# Gradle/Java ломаются на кириллице в пути — сборка через symlink
rm -f "$LINK"
ln -sf "$ROOT" "$LINK"

cd "$LINK/android"
chmod +x ./gradlew
echo "→ Сборка debug APK…"
./gradlew assembleDebug --no-daemon

APK="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
if [[ -f "$APK" ]]; then
  cp "$APK" "$ROOT/DymNadLdom-debug.apk"
  echo ""
  echo "✓ APK готов: $ROOT/DymNadLdom-debug.apk"
  echo "  Установка на телефон: adb install -r \"$ROOT/DymNadLdom-debug.apk\""
else
  echo "APK не найден после сборки." >&2
  exit 1
fi
