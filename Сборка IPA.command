#!/bin/bash
cd "$(dirname "$0")"
chmod +x build-ipa.sh scripts/sync-ios-www.sh
./build-ipa.sh
read -p "Нажмите Enter…"
