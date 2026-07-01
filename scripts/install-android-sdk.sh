#!/usr/bin/env bash
# Первичная установка JDK 17 + Android SDK (один раз).
set -euo pipefail

TOOLS="${DYM_ANDROID_TOOLS:-$HOME/.dym-android-tools}"
mkdir -p "$TOOLS"

export JAVA_HOME="$TOOLS/jdk-17/Contents/Home"
export ANDROID_HOME="$TOOLS/android-sdk"

if [[ ! -x "$JAVA_HOME/bin/java" ]]; then
  echo "→ Скачивание JDK 17 (macOS ARM64)…"
  curl -fL --progress-bar -o /tmp/dym-jdk17.tar.gz \
    "https://api.adoptium.net/v3/binary/latest/17/ga/mac/aarch64/jdk/hotspot/normal/eclipse?project=jdk"
  rm -rf /tmp/dym-jdk-extract "$TOOLS/jdk-17"
  mkdir -p /tmp/dym-jdk-extract
  tar -xzf /tmp/dym-jdk17.tar.gz -C /tmp/dym-jdk-extract
  mv /tmp/dym-jdk-extract/jdk-17* "$TOOLS/jdk-17"
  rm -rf /tmp/dym-jdk17.tar.gz /tmp/dym-jdk-extract
fi

"$JAVA_HOME/bin/java" -version

if [[ ! -x "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]]; then
  echo "→ Скачивание Android command-line tools…"
  curl -fL --progress-bar -o /tmp/dym-cmdline.zip \
    "https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip"
  mkdir -p /tmp/dym-ct-extract "$ANDROID_HOME/cmdline-tools"
  unzip -q /tmp/dym-cmdline.zip -d /tmp/dym-ct-extract
  rm -rf "$ANDROID_HOME/cmdline-tools/latest"
  mv /tmp/dym-ct-extract/cmdline-tools "$ANDROID_HOME/cmdline-tools/latest"
  rm -rf /tmp/dym-cmdline.zip /tmp/dym-ct-extract
fi

export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

echo "→ Лицензии Android SDK…"
yes | sdkmanager --licenses >/dev/null

echo "→ Установка компонентов SDK…"
sdkmanager --install "platform-tools" "platforms;android-34" "build-tools;34.0.0"

echo ""
echo "✓ Готово. Инструменты: $TOOLS"
echo "  Сборка APK: ./build-apk.sh"
