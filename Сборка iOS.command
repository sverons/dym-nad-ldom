#!/bin/bash
cd "$(dirname "$0")"
chmod +x build-ios.sh scripts/sync-ios-www.sh
./build-ios.sh simulator
read -p "Нажмите Enter…"
