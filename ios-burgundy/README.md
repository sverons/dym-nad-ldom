# Замки Бургундии — счётчик очков (iOS)

Нативное SwiftUI-приложение для подсчёта итоговых очков в настольной игре [The Castles of Burgundy](https://en.wikipedia.org/wiki/The_Castles_of_Burgundy) (издание 2019) с дополнением «Щиты».

Основано на [castles-of-burgundy-scorer](https://github.com/toddcooke/castles-of-burgundy-scorer) (Todd Cooke).

## Возможности

- До 4 игроков
- Базовые очки: поле, товары, серебро, рабочие
- Монастыри (плитки #15–#29) и щиты (1–18)
- Удвоение от щитов #10 и #13
- Таблица лидеров и шаринг результатов
- Дополнительные критерии при ничьей
- Сохранение в UserDefaults

## Сборка

```bash
chmod +x build-ios.sh
./build-ios.sh           # симулятор
./build-ios.sh device    # устройство
```

Или откройте `BurgundyScorer.xcodeproj` в Xcode.

## Структура

- `BurgundyScorer/Models/Scoring.swift` — логика подсчёта
- `BurgundyScorer/Models/GameStore.swift` — состояние и сохранение
- `BurgundyScorer/Views/` — интерфейс на русском языке
