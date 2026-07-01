#!/bin/bash
cd "$(dirname "$0")"
chmod +x scripts/push-to-github.sh
./scripts/push-to-github.sh
read -p "Нажмите Enter…"
