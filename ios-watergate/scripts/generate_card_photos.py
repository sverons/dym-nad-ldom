#!/usr/bin/env python3
"""Generate photo-style Watergate card images for the iOS app."""

from __future__ import annotations

import json
import textwrap
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "Watergate" / "Assets.xcassets" / "Cards"
CARD_W, CARD_H = 450, 675  # 2:3 ratio like 75x113mm

COLOR_RGB = {
    "blue": (48, 98, 168),
    "yellow": (210, 168, 48),
    "green": (52, 138, 82),
}

CARDS = [
    # editor
    ("e01", "editor", "Третьесортная кража", 2, ["yellow"], "СОБЫТИЕ", "Закрепить Дина", "«Третьесортная кража»", "Watergate Hotel Washington"),
    ("e02", "editor", "Следуй за деньгами!", 3, ["blue"], "РЕАКЦИЯ", "Отменить ход улики", "«Следуй за деньгами!»", "US dollar bill"),
    ("e03", "editor", "Боб Вудворд", 2, ["green"], "ЖУРНАЛИСТ", "Сдвинуть инициативу", "«Мы не замолчим.»", "Bob Woodward journalist"),
    ("e04", "editor", "Карл Бернстайн", 1, ["blue", "yellow"], "ЖУРНАЛИСТ", "Сдвинуть улику", "«Огромная история.»", "Carl Bernstein"),
    ("e05", "editor", "Бен Брэдли", 2, ["yellow"], "ЖУРНАЛИСТ", "Отменить заговорщика", "«Нужны факты.»", "Ben Bradlee Washington Post"),
    ("e06", "editor", "Массовая демонстрация", 1, [], "РЕАКЦИЯ", "Отменить заговорщика", "«Народ требует правды.»", "Vietnam War protest Washington"),
    ("e07", "editor", "Система работает", 3, ["green"], "СОБЫТИЕ", "Повторить событие", "«Система сработала.»", "United States Capitol"),
    ("e08", "editor", "Сенатские слушания", 2, ["green"], "СОБЫТИЕ", "Закрепить Баттерфилда", "Слушания сената", "United States Senate hearing"),
    ("e09", "editor", "Показания Слоуна", 1, ["blue"], "СОБЫТИЕ", "Закрепить Слоуна", "Казначей CRP", "Richard Nixon campaign"),
    ("e10", "editor", "Марта Митчелл", 2, ["yellow", "green"], "СОБЫТИЕ", "Закрепить Марту", "«Юг говорит слишком много.»", "Martha Mitchell"),
    ("e11", "editor", "Стирка «Роз Мэри»", 3, ["green"], "СОБЫТИЕ", "Закрепить Вудс", "18½ минут плёнки", "Rose Mary Woods"),
    ("e12", "editor", "Письмо Маккорда", 4, ["blue"], "СОБЫТИЕ", "Закрепить Маккорда", "Письмо судье Сирике", "James McCord"),
    ("e13", "editor", "Альфред Болдуин", 1, ["yellow"], "СОБЫТИЕ", "Закрепить Болдуина", "Радиоперехват", "FBI agent"),
    ("e14", "editor", "Глубокая глотка", 2, [], "СОБЫТИЕ", "Взять 2 карты", "«Следуйте за деньгами.»", "parking garage night"),
    ("e15", "editor", "Публикация в Post", 3, ["blue", "green"], "СОБЫТИЕ", "Сдвинуть импульс", "Washington Post front page", "Washington Post building"),
    ("e16", "editor", "Субпоена плёнок", 2, ["green"], "СОБЫТИЕ", "Сдвинуть улику", "Субпоена плёнок", "Oval Office Richard Nixon"),
    ("e17", "editor", "Расследование ФБР", 1, ["blue"], "СОБЫТИЕ", "Сдвинуть инициативу", "Расследование ФБР", "J. Edgar Hoover FBI"),
    ("e18", "editor", "Комитет Эрвина", 4, ["yellow"], "СОБЫТИЕ", "Взять карту", "Телеслушания", "Sam Ervin"),
    ("e19", "editor", "Импичмент", 3, [], "СОБЫТИЕ", "Закрепить информанта", "Статьи импичмента", "impeachment Richard Nixon"),
    ("e20", "editor", "Отставка", 2, ["green", "yellow"], "СОБЫТИЕ", "Сдвинуть импульс", "Отставка 1974", "Richard Nixon resignation"),
    # nixon
    ("n01", "nixon", "Гамбит", 2, ["blue"], "СОБЫТИЕ", "Блокировать события", "«Блестящее настроение.»", "Richard Nixon smile"),
    ("n02", "nixon", "Гордон Лидди", 3, ["yellow"], "ЗАГОВОР", "Закрепить информанта", "Организатор взлома", "Watergate break in"),
    ("n03", "nixon", "Чак Колсон", 1, ["green"], "ЗАГОВОР", "Сдвинуть улику", "Список врагов", "Charles Colson"),
    ("n04", "nixon", "Боб Халдеман", 2, ["blue"], "ЗАГОВОР", "Сдвинуть импульс", "«Дымящийся пистолет»", "H. R. Haldeman"),
    ("n05", "nixon", "Говард Хант", 4, ["green"], "ЗАГОВОР", "Импульс + карта", "Бывший офицер ЦРУ", "Howard Hunt"),
    ("n06", "nixon", "Джон Митчелл", 2, ["yellow"], "РЕАКЦИЯ", "Отменить событие", "Генпрокурор", "John N. Mitchell"),
    ("n07", "nixon", "Джон Эрлихман", 1, ["blue", "green"], "ЗАГОВОР", "Сдвинуть инициативу", "Сантехники", "John Ehrlichman"),
    ("n08", "nixon", "Операция Gemstone", 3, ["yellow", "green"], "СОБЫТИЕ", "Сдвинуть улику", "Грязные трюки", "political dirty tricks"),
    ("n09", "nixon", "Субпоена ЦРУ", 2, ["blue"], "СОБЫТИЕ", "Сдвинуть импульс", "ЦРУ vs ФБР", "CIA headquarters Langley"),
    ("n10", "nixon", "Уничтожение улик", 1, ["green"], "СОБЫТИЕ", "Сдвинуть улику", "Уничтожение документов", "shredded documents"),
    ("n11", "nixon", "Заплаты молчанию", 3, ["blue", "yellow"], "СОБЫТИЕ", "Закрепить информанта", "Взятки взломщикам", "money envelope"),
    ("n12", "nixon", "Дискредитация Марты", 2, ["yellow"], "СОБЫТИЕ", "Закрепить Марту", "Дискредитация", "Martha Mitchell"),
    ("n13", "nixon", "Субботняя ночь", 4, ["green"], "СОБЫТИЕ", "Импульс + карта", "Увольнение Кокса", "Saturday Night Massacre"),
    ("n14", "nixon", "Исполнительная привилегия", 2, ["blue", "green"], "СОБЫТИЕ", "Сдвинуть инициативу", "Отказ передать плёнки", "executive privilege"),
    ("n15", "nixon", "Пресс-секретарь Зиглер", 1, ["yellow"], "СОБЫТИЕ", "Сдвинуть улику", "Брифинг прессы", "White House press briefing"),
    ("n16", "nixon", "Пат Грэй", 3, ["green"], "СОБЫТИЕ", "Сдвинуть улику", "Временный директор ФБР", "FBI director"),
    ("n17", "nixon", "Кампания CRP", 2, ["blue"], "СОБЫТИЕ", "Закрепить Слоуна", "Комитет переизбрания", "Committee for the Re-Election of the President"),
    ("n18", "nixon", "Союзники в Сенате", 1, ["blue", "yellow"], "СОБЫТИЕ", "Сдвинуть импульс", "Защита в Сенате", "United States Senate Republican"),
    ("n19", "nixon", "Переизбрание 1972", 4, ["yellow", "green"], "СОБЫТИЕ", "Сдвинуть импульс", "Победа 1972", "Richard Nixon 1972 election"),
    ("n20", "nixon", "Отрицание", 3, [], "СОБЫТИЕ", "Закрепить информанта", "«Никто не причастен.»", "Richard Nixon denial"),
]

CACHE_DIR = ROOT / "scripts" / ".photo_cache"


def fetch_wikimedia_photo(query: str) -> Image.Image | None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    safe = "".join(c if c.isalnum() else "_" for c in query)[:80]
    cache_path = CACHE_DIR / f"{safe}.jpg"
    if cache_path.exists():
        try:
            return Image.open(cache_path).convert("RGB")
        except Exception:
            pass

    api = (
        "https://commons.wikimedia.org/w/api.php?"
        + urllib.parse.urlencode(
            {
                "action": "query",
                "generator": "search",
                "gsrsearch": query,
                "gsrnamespace": 6,
                "gsrlimit": 8,
                "prop": "imageinfo",
                "iiprop": "url",
                "iiurlwidth": 640,
                "format": "json",
            }
        )
    )
    try:
        with urllib.request.urlopen(api, timeout=20) as resp:
            data = json.load(resp)
        pages = data.get("query", {}).get("pages", {})
        for page in pages.values():
            infos = page.get("imageinfo") or []
            if not infos:
                continue
            url = infos[0].get("thumburl") or infos[0].get("url")
            if not url:
                continue
            with urllib.request.urlopen(url, timeout=20) as img_resp:
                raw = img_resp.read()
            cache_path.write_bytes(raw)
            return Image.open(BytesIO(raw)).convert("RGB")
    except Exception:
        return None
    return None


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except Exception:
            continue
    return ImageFont.load_default()


def make_photo_area(role: str, query: str) -> Image.Image:
    photo = fetch_wikimedia_photo(query)
    area = Image.new("RGB", (CARD_W - 36, 300), (120, 110, 100))
    if photo:
        fitted = ImageOps.fit(photo, (CARD_W - 36, 300), method=Image.Resampling.LANCZOS)
        if role == "editor":
            fitted = ImageOps.grayscale(fitted).convert("RGB")
            fitted = ImageEnhanceLike(fitted, 0.9, 1.05)
        else:
            fitted = fitted.filter(ImageFilter.GaussianBlur(0.3))
        area = fitted
    else:
        draw = ImageDraw.Draw(area)
        c1 = (36, 58, 92) if role == "editor" else (92, 58, 36)
        c2 = (18, 28, 44) if role == "editor" else (44, 28, 18)
        for y in range(area.height):
            t = y / area.height
            color = tuple(int(c1[i] * (1 - t) + c2[i] * t) for i in range(3))
            draw.line([(0, y), (area.width, y)], fill=color)
    return area


def ImageEnhanceLike(img: Image.Image, brightness: float, contrast: float) -> Image.Image:
    img = ImageOps.autocontrast(img)
    return ImageOps.colorize(ImageOps.grayscale(img), black=(20, 20, 20), white=(235, 230, 220))


def draw_value_badge(draw: ImageDraw.ImageDraw, value: int, colors: list[str], is_joker: bool) -> None:
    draw.rounded_rectangle((16, 16, 58, 58), radius=8, fill=(20, 20, 20))
    font = load_font(26, bold=True)
    draw.text((27, 18), str(value), fill=(255, 255, 255), font=font, anchor="mm")
    x = 66
    if is_joker or not colors:
        for key in ("blue", "yellow", "green"):
            draw.ellipse((x, 24, x + 18, 42), fill=COLOR_RGB[key], outline=(255, 255, 255), width=1)
            x += 22
    else:
        for key in colors:
            draw.ellipse((x, 24, x + 18, 42), fill=COLOR_RGB[key], outline=(255, 255, 255), width=1)
            x += 22


def draw_wrapped(draw: ImageDraw.ImageDraw, text: str, box: tuple[int, int, int, int], font, fill) -> None:
    x1, y1, x2, y2 = box
    max_chars = max(12, (x2 - x1) // 9)
    lines = textwrap.wrap(text, width=max_chars)
    y = y1
    for line in lines[:4]:
        draw.text((x1, y), line, fill=fill, font=font)
        y += font.size + 4
        if y > y2:
            break


def render_card(card: tuple) -> Image.Image:
    cid, role, name, value, colors, kind, action, quote, query = card
    is_joker = not colors

    if role == "editor":
        base = Image.new("RGB", (CARD_W, CARD_H), (248, 246, 240))
        header_fill = (232, 236, 244)
        accent = (18, 46, 86)
    else:
        base = Image.new("RGB", (CARD_W, CARD_H), (244, 236, 220))
        header_fill = (236, 224, 200)
        accent = (96, 34, 30)

    draw = ImageDraw.Draw(base)
    draw.rounded_rectangle((6, 6, CARD_W - 6, CARD_H - 6), radius=14, outline=(30, 30, 30), width=2)

    draw.rectangle((18, 70, CARD_W - 18, 170), fill=header_fill)
    title_font = load_font(22, bold=True)
    kind_font = load_font(14, bold=True)
    action_font = load_font(16)
    quote_font = load_font(13)
    name_font = load_font(18, bold=True)

    draw.rounded_rectangle((CARD_W - 130, 18, CARD_W - 18, 48), radius=10, fill=accent)
    draw.text((CARD_W - 74, 33), kind, fill=(255, 255, 255), font=kind_font, anchor="mm")

    draw_value_badge(draw, value, colors, is_joker)

    draw.text((24, 82), name.upper(), fill=accent, font=title_font)
    draw_wrapped(draw, action, (24, 118, CARD_W - 24, 168), action_font, (40, 40, 40))

    photo = make_photo_area(role, query)
    base.paste(photo, (18, 180))

    draw.rectangle((18, 490, CARD_W - 18, 580), fill=(255, 255, 255, 180) if role == "editor" else (255, 250, 240))
    draw_wrapped(draw, quote, (24, 500, CARD_W - 24, 575), quote_font, (70, 70, 70))

    draw.text((24, 610), cid.upper(), fill=(140, 140, 140), font=load_font(12))
    draw.text((CARD_W - 24, 640), "WATERGATE", fill=accent, font=name_font, anchor="rb")

    return base


def render_back(role: str) -> Image.Image:
    img = Image.new("RGB", (CARD_W, CARD_H), (20, 36, 68) if role == "editor" else (74, 28, 24))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((10, 10, CARD_W - 10, CARD_H - 10), radius=16, outline=(255, 255, 255, 120), width=3)
    font = load_font(28, bold=True)
    small = load_font(16, bold=True)
    label = "WASHINGTON\nPOST" if role == "editor" else "CONFIDENTIAL"
    draw.multiline_text((CARD_W // 2, CARD_H // 2 - 20), label, fill=(240, 240, 240), font=font, anchor="mm", align="center")
    draw.text((CARD_W // 2, CARD_H - 70), "WATERGATE", fill=(220, 220, 220), font=small, anchor="mm")
    return img


def write_imageset(name: str, image: Image.Image) -> None:
    folder = OUT_DIR / f"{name}.imageset"
    folder.mkdir(parents=True, exist_ok=True)
    image.save(folder / f"{name}.png", format="PNG", optimize=True)
    contents = {
        "images": [{"filename": f"{name}.png", "idiom": "universal", "scale": "1x"}],
        "info": {"author": "xcode", "version": 1},
    }
    (folder / "Contents.json").write_text(json.dumps(contents, indent=2), encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "Contents.json").write_text(
        json.dumps({"info": {"author": "xcode", "version": 1}}, indent=2),
        encoding="utf-8",
    )

    for card in CARDS:
        print(f"Generating {card[0]}…")
        img = render_card(card)
        write_imageset(card[0], img)

    write_imageset("back_editor", render_back("editor"))
    write_imageset("back_nixon", render_back("nixon"))
    print(f"Done. {len(CARDS) + 2} images in {OUT_DIR}")


if __name__ == "__main__":
    main()
