#!/usr/bin/env python3
"""Фоновый наблюдатель: синхронизирует проект с Google Drive при изменениях."""

import hashlib
import os
import subprocess
import sys
import time

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SYNC_SCRIPT = os.path.join(PROJECT_DIR, "scripts", "sync-to-drive.sh")
PID_FILE = os.path.join(PROJECT_DIR, ".sync-drive.pid")
LOG_FILE = os.path.join(PROJECT_DIR, ".sync-drive.log")
POLL_INTERVAL = 2

IGNORE_DIRS = {
    ".git",
    "rclone-v1.74.3-osx-arm64",
    "__pycache__",
}

IGNORE_FILES = {
    ".DS_Store",
    ".sync-drive.log",
    ".sync-drive.lock",
    ".sync-drive.pending",
    ".sync-drive.pid",
    "Телефон.zip",
}


def log(message: str) -> None:
    with open(LOG_FILE, "a", encoding="utf-8") as handle:
        handle.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] WATCH: {message}\n")


def should_skip(path: str) -> bool:
    rel = os.path.relpath(path, PROJECT_DIR)
    parts = rel.split(os.sep)
    if parts[0] in IGNORE_DIRS:
        return True
    if os.path.basename(path) in IGNORE_FILES:
        return True
    if rel.startswith("rclone-") and rel.endswith(".zip"):
        return True
    return False


def snapshot() -> dict[str, str]:
    state: dict[str, str] = {}
    for root, dirs, files in os.walk(PROJECT_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and not d.startswith("rclone-v1.")]
        for name in files:
            path = os.path.join(root, name)
            if should_skip(path):
                continue
            try:
                stat = os.stat(path)
            except OSError:
                continue
            digest = hashlib.md5(f"{stat.st_mtime_ns}:{stat.st_size}".encode()).hexdigest()
            state[os.path.relpath(path, PROJECT_DIR)] = digest
    return state


def trigger_sync() -> None:
    subprocess.Popen(["/bin/bash", SYNC_SCRIPT, "--debounced"], cwd=PROJECT_DIR)


def main() -> int:
    if not os.path.exists(SYNC_SCRIPT):
        print("Не найден scripts/sync-to-drive.sh", file=sys.stderr)
        return 1

    with open(PID_FILE, "w", encoding="utf-8") as handle:
        handle.write(str(os.getpid()))

    log("наблюдатель запущен")
    previous = snapshot()

    try:
        while True:
            time.sleep(POLL_INTERVAL)
            current = snapshot()
            if current != previous:
                log("обнаружены изменения, запуск синхронизации")
                trigger_sync()
                previous = current
    except KeyboardInterrupt:
        log("наблюдатель остановлен")
        return 0
    finally:
        if os.path.exists(PID_FILE):
            os.remove(PID_FILE)


if __name__ == "__main__":
    raise SystemExit(main())
