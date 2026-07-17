#!/usr/bin/env python3
"""Import Watergate card scans mapped by printed card number (- NN -)."""

from __future__ import annotations

import json
import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SRC = Path.home() / "Downloads" / "Watergate"
CARD_SCANS = ROOT / "scripts" / "card_scans"
ASSETS = ROOT / "Watergate" / "Assets.xcassets" / "Cards"
TARGET_SIZE = (900, 1350)

# App id -> printed card number (bottom-right on the physical card).
# Nixon deck: 01-20, Editor deck: 21-40 (+ shared cards where noted).
APP_PRINTED_NUMBER: dict[str, int] = {
    # Nixon playable cards = printed 02–21
    "n01": 20,  # Гамбит
    "n02": 10,  # Лидди
    "n03": 11,  # Колсон
    "n04": 12,  # Халдеман
    "n05": 9,   # Хант
    "n06": 14,  # Митчелл
    "n07": 13,  # Эрлихман
    "n08": 19,  # Джемстоун
    "n09": 3,   # Баттерфилд лицом вниз
    "n10": 16,  # Раковая опухоль
    "n11": 6,   # Дин лицом вниз
    "n12": 5,   # Марта лицом вниз
    "n13": 21,  # Великолепное настроение
    "n14": 17,  # Речь президента
    "n15": 15,  # Третьесортная попытка ограбления
    "n16": 8,   # Маккорд лицом вниз
    "n17": 4,   # Слоун лицом вниз
    "n18": 2,   # Вудс лицом вниз
    "n19": 18,  # Выборы 1972
    "n20": 7,   # Болдуин лицом вниз
    # Editor playable cards = printed 23–42
    "e01": 27,  # Дин лицом вверх
    "e02": 42,  # Следуй за деньгами!
    "e03": 33,  # Боб Вудворд
    "e04": 34,  # Карл Бернстайн
    "e05": 35,  # Бен Брэдли
    "e06": 40,  # Массовая демонстрация
    "e07": 41,  # Система работает
    "e08": 24,  # Баттерфилд лицом вверх
    "e09": 25,  # Слоун лицом вверх
    "e10": 26,  # Марта лицом вверх
    "e11": 23,  # Вудс лицом вверх
    "e12": 29,  # Маккорд лицом вверх
    "e13": 28,  # Болдуин лицом вверх
    "e14": 30,  # Глубокая глотка
    "e15": 37,  # Пентагон
    "e16": 31,  # Пропавшая запись
    "e17": 38,  # Уотергейт
    "e18": 36,  # Кто платит адвокатам?
    "e19": 32,  # Дымящееся ружьё
    "e20": 39,  # Субботняя резня
}

# Filenames match printed numbers: Новая папка/01–21.png, Watergate/22–42.png
PRINTED_TO_FILE: dict[int, str] = {n: f"{n:02d}.png" for n in range(1, 43)}

FALLBACK_SCAN_MAP: dict[str, str] = {}

BACK_MAP = {
    "back_editor": "Редактор.png",
    "back_nixon": "Никсон.png",
}

BACK_FALLBACK = {
    "back_editor": "card_momentum_editor",
    "back_nixon": "card_momentum_nixon",
}


def fit_card(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    img = img.convert("RGB")
    src_ratio = img.width / img.height
    dst_ratio = size[0] / size[1]
    if src_ratio > dst_ratio:
        new_w = int(img.height * dst_ratio)
        left = (img.width - new_w) // 2
        img = img.crop((left, 0, left + new_w, img.height))
    else:
        new_h = int(img.width / dst_ratio)
        top = (img.height - new_h) // 2
        img = img.crop((0, top, img.width, top + new_h))
    return img.resize(size, Image.Resampling.LANCZOS)


def publish_image(app_id: str, src_path: Path) -> None:
    folder = ASSETS / f"{app_id}.imageset"
    folder.mkdir(parents=True, exist_ok=True)
    out = fit_card(Image.open(src_path), TARGET_SIZE)
    out.save(folder / f"{app_id}.png", optimize=True)
    (folder / "Contents.json").write_text(
        json.dumps(
            {
                "images": [{"filename": f"{app_id}.png", "idiom": "universal", "scale": "1x"}],
                "info": {"author": "xcode", "version": 1},
            },
            indent=2,
        ),
        encoding="utf-8",
    )


def source_roots(src_root: Path) -> list[Path]:
    roots = [src_root]
    nested = src_root / "Новая папка"
    if nested.exists():
        roots.append(nested)
    return roots


def find_file(filename: str, roots: list[Path]) -> Path | None:
    for root in roots:
        path = root / filename
        if path.exists():
            return path
    return None


def resolve_by_printed_number(printed: int, roots: list[Path]) -> Path | None:
    filename = PRINTED_TO_FILE.get(printed) or f"{printed:02d}.png"
    return find_file(filename, roots)


def resolve_source(app_id: str, roots: list[Path]) -> Path | None:
    printed = APP_PRINTED_NUMBER.get(app_id)
    if printed is not None:
        src = resolve_by_printed_number(printed, roots)
        if src:
            return src

    fallback_id = FALLBACK_SCAN_MAP.get(app_id)
    if fallback_id:
        src = CARD_SCANS / f"{fallback_id}.png"
        if src.exists():
            return src
    return None


def resolve_back(back_id: str, roots: list[Path]) -> Path | None:
    filename = BACK_MAP.get(back_id)
    if filename:
        src = find_file(filename, roots)
        if src:
            return src

    fallback_id = BACK_FALLBACK.get(back_id)
    if fallback_id:
        src = CARD_SCANS / f"{fallback_id}.png"
        if src.exists():
            return src
    return None


def main() -> None:
    src_root = Path(os.environ.get("WATERGATE_SCANS_DIR", DEFAULT_SRC))
    if not src_root.exists():
        raise SystemExit(f"Missing scan folder: {src_root}")

    roots = source_roots(src_root)
    ASSETS.mkdir(parents=True, exist_ok=True)
    (ASSETS / "Contents.json").write_text(
        json.dumps({"info": {"author": "xcode", "version": 1}}, indent=2),
        encoding="utf-8",
    )

    published = 0
    for app_id in sorted(set(APP_PRINTED_NUMBER) | set(FALLBACK_SCAN_MAP)):
        src = resolve_source(app_id, roots)
        if not src:
            print(f"skip {app_id}: no source found")
            continue
        publish_image(app_id, src)
        published += 1
        printed = APP_PRINTED_NUMBER.get(app_id)
        print(f"ok {app_id} <- #{printed:02d} {src.name}")

    for back_id in BACK_MAP:
        src = resolve_back(back_id, roots)
        if not src:
            print(f"skip {back_id}: no source found")
            continue
        publish_image(back_id, src)
        print(f"ok {back_id} <- {src.name}")

    print(f"Published {published} card scans ({TARGET_SIZE[0]}x{TARGET_SIZE[1]}) to {ASSETS}")


if __name__ == "__main__":
    main()
