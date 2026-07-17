import Foundation

enum AchievementCategory: String, CaseIterable, Identifiable {
    case victory
    case score
    case tiles
    case fun

    var id: String { rawValue }

    var title: String {
        switch self {
        case .victory: return "Победы"
        case .score: return "Очки"
        case .tiles: return "Плитки и щиты"
        case .fun: return "Особые"
        }
    }

    var symbol: String {
        switch self {
        case .victory: return "crown.fill"
        case .score: return "star.fill"
        case .tiles: return "hexagon.fill"
        case .fun: return "sparkles"
        }
    }
}

struct Achievement: Identifiable {
    let id: String
    let category: AchievementCategory
    let title: String
    let detail: String
    let symbol: String
}

enum AchievementsCatalog {
    static let all: [Achievement] = [
        // Победы
        Achievement(
            id: "first_win",
            category: .victory,
            title: "Первый замок",
            detail: "Выиграть первую партию",
            symbol: "flag.checkered"
        ),
        Achievement(
            id: "three_wins",
            category: .victory,
            title: "Вассал герцога",
            detail: "Выиграть 3 партии",
            symbol: "shield.lefthalf.filled"
        ),
        Achievement(
            id: "five_wins",
            category: .victory,
            title: "Герцог Бургундии",
            detail: "Выиграть 5 партий",
            symbol: "crown.fill"
        ),
        Achievement(
            id: "photo_finish",
            category: .victory,
            title: "Фотофиниш",
            detail: "Победить с разницей ≤ 5 очков",
            symbol: "camera.fill"
        ),
        Achievement(
            id: "landslide",
            category: .victory,
            title: "Разгром",
            detail: "Выиграть с отрывом ≥ 40 очков",
            symbol: "bolt.fill"
        ),

        // Очки
        Achievement(
            id: "score_150",
            category: .score,
            title: "Солидный результат",
            detail: "Набрать 150+ очков за партию",
            symbol: "1.circle.fill"
        ),
        Achievement(
            id: "score_200",
            category: .score,
            title: "Сильный ход",
            detail: "Набрать 200+ очков за партию",
            symbol: "2.circle.fill"
        ),
        Achievement(
            id: "score_250",
            category: .score,
            title: "Магнат",
            detail: "Набрать 250+ очков за партию",
            symbol: "3.circle.fill"
        ),
        Achievement(
            id: "score_300",
            category: .score,
            title: "Легенда Бургундии",
            detail: "Набрать 300+ очков за партию",
            symbol: "trophy.fill"
        ),
        Achievement(
            id: "silver_hoard",
            category: .score,
            title: "Серебряный мешок",
            detail: "Закончить партию с 20+ серебра",
            symbol: "circle.hexagongrid.fill"
        ),
        Achievement(
            id: "worker_army",
            category: .score,
            title: "Армия рабочих",
            detail: "Иметь 10+ пар рабочих в конце",
            symbol: "person.3.fill"
        ),

        // Плитки и щиты
        Achievement(
            id: "monastery_trio",
            category: .tiles,
            title: "Три монастыря",
            detail: "Владеть тремя монастырскими плитками сразу",
            symbol: "building.columns.fill"
        ),
        Achievement(
            id: "white_castle",
            category: .tiles,
            title: "Белый замок",
            detail: "Получить монастырь #29 (Белый замок)",
            symbol: "building.2.fill"
        ),
        Achievement(
            id: "shield_trio",
            category: .tiles,
            title: "Щитоносец",
            detail: "Держать 3 щита одновременно",
            symbol: "shield.fill"
        ),
        Achievement(
            id: "double_monastery",
            category: .tiles,
            title: "Двойная молитва",
            detail: "Удвоить очки монастырей щитом #10",
            symbol: "arrow.up.right.circle.fill"
        ),
        Achievement(
            id: "double_shields",
            category: .tiles,
            title: "Двойной щит",
            detail: "Удвоить очки щитов щитом #13",
            symbol: "shield.checkered"
        ),
        Achievement(
            id: "full_duchy",
            category: .tiles,
            title: "Полное герцогство",
            detail: "Заполнить все клетки поля (0 пустых)",
            symbol: "square.grid.3x3.fill"
        ),

        // Особые
        Achievement(
            id: "full_table",
            category: .fun,
            title: "Полный стол",
            detail: "Сыграть партию на четверых",
            symbol: "person.3.sequence.fill"
        ),
        Achievement(
            id: "perfect_tie",
            category: .fun,
            title: "Рыцарская ничья",
            detail: "Закончить партию вничью по очкам",
            symbol: "equal.circle.fill"
        ),
        Achievement(
            id: "goods_king",
            category: .fun,
            title: "Король торговли",
            detail: "Взять монастырь #15 или #25 (товары)",
            symbol: "cart.fill"
        ),
        Achievement(
            id: "livestock_baron",
            category: .fun,
            title: "Барон скота",
            detail: "Взять монастырь #24 (разнообразие скота)",
            symbol: "leaf.fill"
        ),
        Achievement(
            id: "night_game",
            category: .fun,
            title: "Ночная партия",
            detail: "Закончить партию после полуночи",
            symbol: "moon.stars.fill"
        ),
        Achievement(
            id: "host",
            category: .fun,
            title: "Хозяин замка",
            detail: "Провести партию у себя дома",
            symbol: "house.fill"
        ),
    ]

    static func byCategory(_ category: AchievementCategory) -> [Achievement] {
        all.filter { $0.category == category }
    }
}
