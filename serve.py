#!/usr/bin/env python3
"""Локальный сервер для «Дым над льдом» — главная страница и эмулятор телефона."""

from __future__ import annotations

import http.server
import socket
import socketserver
import sys
import threading
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_PORT = 4173
BIND_HOST = "0.0.0.0"
LOCAL_HOST = "127.0.0.1"


class AppHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **getattr(http.server.SimpleHTTPRequestHandler, "extensions_map", {}),
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".webmanifest": "application/manifest+json",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, format: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {format % args}")


def get_lan_ips() -> list[str]:
    """Локальные IP для доступа с телефона/планшета по Wi‑Fi."""
    ips: list[str] = []
    seen: set[str] = set()

    def add(ip: str) -> None:
        if ip and not ip.startswith("127.") and ip not in seen:
            seen.add(ip)
            ips.append(ip)

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            add(sock.getsockname()[0])
    except OSError:
        pass

    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            add(info[4][0])
    except OSError:
        pass

    return ips


def port_available(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind((host, port))
        except OSError:
            return False
    return True


def pick_port(host: str, preferred: int) -> int:
    if port_available(host, preferred):
        return preferred
    for candidate in range(preferred + 1, preferred + 20):
        if port_available(host, candidate):
            print(f"Порт {preferred} занят, используем {candidate}")
            return candidate
    raise SystemExit(f"Не удалось найти свободный порт рядом с {preferred}")


def open_browser(url: str) -> None:
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()


class ThreadingTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


def main() -> None:
    preferred = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    port = pick_port(BIND_HOST, preferred)
    local_base = f"http://{LOCAL_HOST}:{port}"
    lan_ips = get_lan_ips()

    print()
    print("  Дым над льдом — браузерное приложение")
    print("  ─────────────────────────────────────")
    print(f"  На этом Mac:  {local_base}/")
    if lan_ips:
        print("  По Wi‑Fi (с телефона в той же сети):")
        for ip in lan_ips:
            print(f"    http://{ip}:{port}/")
    else:
        print("  Wi‑Fi: IP не определён — смотрите в Системных настройках → Сеть")
    print("  Пароли:   128500 / 000000 — основная, 123456 / 654321 — служебная")
    print("  Остановка: Ctrl+C")
    print()

    open_browser(local_base + "/")

    with ThreadingTCPServer((BIND_HOST, port), AppHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nСервер остановлен.")


if __name__ == "__main__":
    main()
