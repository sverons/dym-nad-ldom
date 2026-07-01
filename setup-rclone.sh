#!/bin/bash
# Настройка rclone для Google Drive (безопасная OAuth-авторизация)
set -e

RCLONE="$HOME/.local/bin/rclone"
REMOTE_NAME="gdrive"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DRIVE_FOLDER="Телефон"

# Проверка rclone
if [ ! -x "$RCLONE" ]; then
  echo "❌ rclone не найден. Установите: curl https://rclone.org/install.sh | sudo bash"
  exit 1
fi

echo "═══════════════════════════════════════════"
echo "  Настройка rclone → Google Drive"
echo "═══════════════════════════════════════════"
echo ""

# Шаг 1: Авторизация (если ещё не настроено)
if ! "$RCLONE" listremotes 2>/dev/null | grep -q "^${REMOTE_NAME}:$"; then
  echo "📋 Шаг 1 из 2: Авторизация Google"
  echo ""
  echo "Сейчас откроется браузер (или появится ссылка)."
  echo "Войдите в аккаунт bestkvestnn@gmail.com и разрешите доступ."
  echo "Пароль НЕ нужен — используется безопасный OAuth."
  echo ""
  read -p "Нажмите Enter для продолжения..."

  TOKEN=$("$RCLONE" authorize "drive" 2>&1 | tail -1)

  if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Не удалось получить токен. Попробуйте снова."
    exit 1
  fi

  "$RCLONE" config create "$REMOTE_NAME" drive token "$TOKEN" scope drive
  echo ""
  echo "✅ Google Drive подключён как «$REMOTE_NAME»"
else
  echo "✅ Google Drive уже подключён («$REMOTE_NAME»)"
fi

echo ""
echo "📋 Шаг 2 из 2: Загрузка проекта"
echo ""

# Создать папку на Drive
"$RCLONE" mkdir "${REMOTE_NAME}:${DRIVE_FOLDER}" 2>/dev/null || true

# Загрузить файлы (без zip и служебных)
"$RCLONE" copy "$PROJECT_DIR" "${REMOTE_NAME}:${DRIVE_FOLDER}" \
  --exclude "rclone-*/**" \
  --exclude "rclone-current-*.zip" \
  --exclude "Телефон.zip" \
  --exclude ".DS_Store" \
  --progress \
  -v

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Готово!"
echo "  Папка: Google Drive → «$DRIVE_FOLDER»"
echo "  https://drive.google.com/drive/my-drive"
echo "═══════════════════════════════════════════"
