#!/usr/bin/env python3
"""Extract individual Watergate card scans from rulebook PDF page images."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "scripts" / "pdf_extract"
OUT = ROOT / "scripts" / "card_scans"
ASSETS = ROOT / "Watergate" / "Assets.xcassets" / "Cards"

# (source image, output id, left, top, right, bottom) — coords for 2244×2244 pages unless noted
CROPS: list[tuple[str, str, int, int, int, int]] = [
    # img_14 — overview spread
    ("img_14.jpg", "card_17", 60, 40, 430, 620),
    ("img_14.jpg", "card_23", 60, 660, 430, 1240),
    ("img_14.jpg", "card_06", 60, 1280, 430, 1860),
    ("img_14.jpg", "card_liddy", 500, 40, 870, 620),
    ("img_14.jpg", "card_hunt", 500, 660, 870, 1240),
    ("img_14.jpg", "card_colson", 940, 40, 1310, 620),
    ("img_14.jpg", "card_haldeman", 940, 660, 1310, 1240),
    ("img_14.jpg", "card_20", 1380, 40, 1750, 620),
    ("img_14.jpg", "card_21", 1380, 660, 1750, 1240),
    ("img_14.jpg", "card_25", 1820, 40, 2190, 620),

    # img_18 — informant secure cards
    ("img_18.jpg", "card_23b", 50, 60, 420, 580),
    ("img_18.jpg", "card_butterfield", 50, 640, 420, 1160),
    ("img_18.jpg", "card_sloan", 50, 1220, 420, 1740),
    ("img_18.jpg", "card_martha", 50, 1800, 420, 2200),
    ("img_18.jpg", "card_rose_stretch", 1500, 60, 1870, 580),

    # img_19
    ("img_19.jpg", "card_14", 50, 60, 420, 580),
    ("img_19.jpg", "card_13", 50, 640, 420, 1160),
    ("img_19.jpg", "card_24", 50, 1220, 420, 1740),
    ("img_19.jpg", "card_22", 50, 1800, 420, 2200),

    # img_20 — conspirators
    ("img_20.jpg", "card_hunt2", 50, 60, 420, 580),
    ("img_20.jpg", "card_liddy2", 500, 60, 870, 580),
    ("img_20.jpg", "card_colson2", 950, 60, 1320, 580),
    ("img_20.jpg", "card_haldeman2", 1400, 60, 1770, 580),
    ("img_20.jpg", "card_smoking_gun", 1850, 60, 2220, 580),

    # img_21
    ("img_21.jpg", "card_11", 50, 60, 420, 580),
    ("img_21.jpg", "card_04", 500, 60, 870, 580),
    ("img_21.jpg", "card_20b", 50, 1240, 420, 1760),
    ("img_21.jpg", "card_21b", 500, 1240, 870, 1760),

    # img_22 — main grid
    ("img_22.jpg", "card_25b", 60, 60, 430, 620),
    ("img_22.jpg", "card_momentum_nixon", 500, 60, 870, 620),
    ("img_22.jpg", "card_third_rate", 940, 60, 1310, 620),
    ("img_22.jpg", "card_cancer", 1380, 60, 1750, 620),
    ("img_22.jpg", "card_17b", 1820, 60, 2190, 620),
    ("img_22.jpg", "card_election_1972", 60, 700, 430, 1260),
    ("img_22.jpg", "card_gemstone", 940, 700, 1310, 1260),
    ("img_22.jpg", "card_gambit", 1380, 700, 1750, 1260),
    ("img_22.jpg", "card_brilliant_mood", 60, 1340, 430, 1900),
    ("img_22.jpg", "card_momentum_editor", 940, 1340, 1310, 1900),
    ("img_22.jpg", "card_lawyers", 1380, 1340, 1750, 1900),

    # img_23 — editor events row
    ("img_23.jpg", "card_pentagon", 60, 80, 430, 640),
    ("img_23.jpg", "card_watergate_complex", 500, 80, 870, 640),
    ("img_23.jpg", "card_26", 940, 80, 1310, 640),
    ("img_23.jpg", "card_40", 1380, 80, 1750, 640),
    ("img_23.jpg", "card_41", 60, 760, 430, 1320),
    ("img_23.jpg", "card_42", 500, 760, 870, 1320),
]

# Canonical mapping: app card id -> best scan file id
APP_SCAN_MAP: dict[str, str] = {
    # Editor
    "e01": "card_third_rate",
    "e02": "card_42",
    "e03": "card_20",
    "e04": "card_21",
    "e05": "card_25",
    "e06": "card_40",
    "e07": "card_41",
    "e08": "card_26",
    "e09": "card_sloan",
    "e10": "card_martha",
    "e11": "card_rose_stretch",
    "e12": "card_24",
    "e13": "card_13",
    "e14": "card_22",
    "e15": "card_pentagon",
    "e16": "card_watergate_complex",
    "e17": "card_pentagon",
    "e18": "card_26",
    "e19": "card_momentum_editor",
    "e20": "card_17",
    # Nixon
    "n01": "card_gambit",
    "n02": "card_liddy",
    "n03": "card_colson",
    "n04": "card_haldeman",
    "n05": "card_hunt",
    "n06": "card_04",
    "n07": "card_11",
    "n08": "card_gemstone",
    "n09": "card_smoking_gun",
    "n10": "card_third_rate",
    "n11": "card_martha",
    "n12": "card_martha",
    "n13": "card_26",
    "n14": "card_cancer",
    "n15": "card_17",
    "n16": "card_haldeman2",
    "n17": "card_sloan",
    "n18": "card_brilliant_mood",
    "n19": "card_election_1972",
    "n20": "card_06",
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


def normalize_card(img: Image.Image) -> Image.Image:
    return fit_card(img, (450, 678))


def extract_all() -> dict[str, Path]:
    OUT.mkdir(parents=True, exist_ok=True)
    produced: dict[str, Path] = {}
    for src_name, card_id, l, t, r, b in CROPS:
        src_path = SRC / src_name
        if not src_path.exists():
            continue
        img = Image.open(src_path)
        crop = img.crop((l, t, r, b))
        out = normalize_card(crop)
        path = OUT / f"{card_id}.png"
        out.save(path, optimize=True)
        produced[card_id] = path
    return produced


def publish_to_assets(produced: dict[str, Path]) -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    (ASSETS / "Contents.json").write_text(
        json.dumps({"info": {"author": "xcode", "version": 1}}, indent=2),
        encoding="utf-8",
    )

    published: list[str] = []
    for app_id, scan_id in APP_SCAN_MAP.items():
        src = produced.get(scan_id)
        if not src or not src.exists():
            continue
        folder = ASSETS / f"{app_id}.imageset"
        folder.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, folder / f"{app_id}.png")
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
        published.append(app_id)

    # Backs from scans if we have momentum cards, else keep existing backs
    for back_id, scan_key in [("back_editor", "card_momentum_editor"), ("back_nixon", "card_momentum_nixon")]:
        src = produced.get(scan_key)
        if src and src.exists():
            folder = ASSETS / f"{back_id}.imageset"
            folder.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, folder / f"{back_id}.png")
            (folder / "Contents.json").write_text(
                json.dumps(
                    {
                        "images": [{"filename": f"{back_id}.png", "idiom": "universal", "scale": "1x"}],
                        "info": {"author": "xcode", "version": 1},
                    },
                    indent=2,
                ),
                encoding="utf-8",
            )

    print(f"Published {len(published)} app card scans to {ASSETS}")


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing {SRC}. Run PDF extract first.")
    produced = extract_all()
    print(f"Extracted {len(produced)} raw scans to {OUT}")
    publish_to_assets(produced)


if __name__ == "__main__":
    main()
