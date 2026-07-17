import Foundation

// MARK: - Модели

struct MonasteryHolding: Codable, Equatable, Identifiable {
    var tile: String
    var count: Int

    var id: String { tile }
}

/// Одно прибавление или вычитание в калькуляторе очков.
struct ScoreDeltaEntry: Codable, Equatable, Identifiable {
    var id: UUID
    var key: String
    var delta: Int
    var date: Date

    init(id: UUID = UUID(), key: String, delta: Int, date: Date = Date()) {
        self.id = id
        self.key = key
        self.delta = delta
        self.date = date
    }

    var label: String {
        delta > 0 ? "+\(delta)" : "\(delta)"
    }
}

struct Player: Codable, Identifiable, Equatable {
    var id: UUID
    var name: String
    var boardVp: Int
    var unsoldGoodsTiles: Int
    var silverCoins: Int
    var workerChipsPair: Int
    var monasteries: [MonasteryHolding]
    var shields: [Int]
    var emptyHexSpaces: Int
    var bridgePosition: Int
    /// История введённых чисел по полям (ключ = NumericKey.rawValue и т.п.).
    var scoreHistory: [ScoreDeltaEntry]

    enum CodingKeys: String, CodingKey {
        case id, name, boardVp, unsoldGoodsTiles, silverCoins, workerChipsPair
        case monasteries, shields, emptyHexSpaces, bridgePosition, scoreHistory
    }

    init(
        id: UUID,
        name: String,
        boardVp: Int,
        unsoldGoodsTiles: Int,
        silverCoins: Int,
        workerChipsPair: Int,
        monasteries: [MonasteryHolding],
        shields: [Int],
        emptyHexSpaces: Int,
        bridgePosition: Int,
        scoreHistory: [ScoreDeltaEntry] = []
    ) {
        self.id = id
        self.name = name
        self.boardVp = boardVp
        self.unsoldGoodsTiles = unsoldGoodsTiles
        self.silverCoins = silverCoins
        self.workerChipsPair = workerChipsPair
        self.monasteries = monasteries
        self.shields = shields
        self.emptyHexSpaces = emptyHexSpaces
        self.bridgePosition = bridgePosition
        self.scoreHistory = scoreHistory
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(UUID.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        boardVp = try c.decode(Int.self, forKey: .boardVp)
        unsoldGoodsTiles = try c.decode(Int.self, forKey: .unsoldGoodsTiles)
        silverCoins = try c.decode(Int.self, forKey: .silverCoins)
        workerChipsPair = try c.decode(Int.self, forKey: .workerChipsPair)
        monasteries = try c.decode([MonasteryHolding].self, forKey: .monasteries)
        shields = try c.decode([Int].self, forKey: .shields)
        emptyHexSpaces = try c.decode(Int.self, forKey: .emptyHexSpaces)
        bridgePosition = try c.decode(Int.self, forKey: .bridgePosition)
        scoreHistory = try c.decodeIfPresent([ScoreDeltaEntry].self, forKey: .scoreHistory) ?? []
    }

    func history(for key: String) -> [ScoreDeltaEntry] {
        scoreHistory.filter { $0.key == key }
    }
}

enum NumericKey: String, CaseIterable {
    case boardVp
    case unsoldGoodsTiles
    case silverCoins
    case workerChipsPair
}

enum TiebreakerKey: String, CaseIterable {
    case emptyHexSpaces
    case bridgePosition
}

struct ScoreRow {
    let label: String
    let key: NumericKey
}

struct TiebreakerRow {
    let label: String
    let key: TiebreakerKey
}

struct MonasteryTile: Identifiable {
    let id: String
    let label: String
    let vpPerUnit: Int
    let unitLabel: String
}

struct Shield: Identifiable {
    let id: Int
    let vp: Int
    let effect: String
}

struct ScoreBreakdown {
    let base: Int
    let monastery: Int
    let shields: Int
    let total: Int
}

// MARK: - Справочники (русский)

enum ScoringData {
    static let maxPlayers = 4

    static let scoreRows: [ScoreRow] = [
        ScoreRow(label: "Очки на поле", key: .boardVp),
        ScoreRow(label: "Непроданные товары", key: .unsoldGoodsTiles),
        ScoreRow(label: "Серебряные монеты", key: .silverCoins),
        ScoreRow(label: "Рабочие (пары)", key: .workerChipsPair),
    ]

    static let tiebreakerRows: [TiebreakerRow] = [
        TiebreakerRow(
            label: "Пустые клетки (при ничьей: меньше — лучше)",
            key: .emptyHexSpaces
        ),
        TiebreakerRow(
            label: "Позиция на мосту (при ничьей: дальше — лучше)",
            key: .bridgePosition
        ),
    ]

    static let monasteryTiles: [MonasteryTile] = [
        MonasteryTile(id: "15", label: "#15 Разнообразие товаров (2 ОП / тип товара)", vpPerUnit: 2, unitLabel: "типов товаров"),
        MonasteryTile(id: "16", label: "#16 Склад (4 ОП / склад)", vpPerUnit: 4, unitLabel: "складов"),
        MonasteryTile(id: "17", label: "#17 Сторожевая башня (4 ОП / башня)", vpPerUnit: 4, unitLabel: "башен"),
        MonasteryTile(id: "18", label: "#18 Столярная мастерская (4 ОП / мастерская)", vpPerUnit: 4, unitLabel: "мастерских"),
        MonasteryTile(id: "19", label: "#19 Церковь (4 ОП / церковь)", vpPerUnit: 4, unitLabel: "церквей"),
        MonasteryTile(id: "20", label: "#20 Рынок (4 ОП / рынок)", vpPerUnit: 4, unitLabel: "рынков"),
        MonasteryTile(id: "21", label: "#21 Постоялый двор (4 ОП / двор)", vpPerUnit: 4, unitLabel: "дворов"),
        MonasteryTile(id: "22", label: "#22 Банк (4 ОП / банк)", vpPerUnit: 4, unitLabel: "банков"),
        MonasteryTile(id: "23", label: "#23 Ратуша (4 ОП / ратуша)", vpPerUnit: 4, unitLabel: "ратуш"),
        MonasteryTile(id: "24", label: "#24 Разнообразие скота (4 ОП / тип скота)", vpPerUnit: 4, unitLabel: "типов скота"),
        MonasteryTile(id: "25", label: "#25 Проданные товары (1 ОП / товар)", vpPerUnit: 1, unitLabel: "проданных товаров"),
        MonasteryTile(id: "26", label: "#26 Бонусные жетоны (3 ОП / жетон)", vpPerUnit: 3, unitLabel: "бонусных жетонов"),
        MonasteryTile(id: "29", label: "#29 Белый замок (4 ОП / замок)", vpPerUnit: 4, unitLabel: "белых замков"),
    ]

    static let shields: [Shield] = [
        Shield(id: 1, vp: 12, effect: "Все пастбища считаются как одно (больше ОП за скот)"),
        Shield(id: 2, vp: 12, effect: "Получаете рабочего, когда это делает другой игрок"),
        Shield(id: 3, vp: 12, effect: "Дань щита можно платить рабочими"),
        Shield(id: 4, vp: 12, effect: "Неограниченное хранение плиток"),
        Shield(id: 5, vp: 12, effect: "Доп. товар одного типа при размещении корабля"),
        Shield(id: 6, vp: 12, effect: "Копирует монастыри выбранного игрока"),
        Shield(id: 7, vp: 8, effect: "Бонусные жетоны дают двойные очки"),
        Shield(id: 8, vp: 8, effect: "Удвоенная выплата из шахты"),
        Shield(id: 9, vp: 8, effect: "1 серебро за каждый проданный товар"),
        Shield(id: 10, vp: 8, effect: "Очки монастырей удваиваются"),
        Shield(id: 11, vp: 8, effect: "Берёте щит при размещении замка"),
        Shield(id: 12, vp: 8, effect: "Удвоенные ОП за проданные товары"),
        Shield(id: 13, vp: 4, effect: "Удвоенные ОП за каждый щит"),
        Shield(id: 14, vp: 4, effect: "Конец фазы: взять гекс из любого депо"),
        Shield(id: 15, vp: 4, effect: "Конец фазы: взять гекс из чёрного депо"),
        Shield(id: 16, vp: 4, effect: "Установить один кубик на любое число"),
        Shield(id: 17, vp: 4, effect: "Завершённые области считаются на размер больше"),
        Shield(id: 18, vp: 4, effect: "Размещать гексы где угодно в герцогстве"),
    ]

    private static let tileVP: [String: Int] = Dictionary(
        uniqueKeysWithValues: monasteryTiles.map { ($0.id, $0.vpPerUnit) }
    )

    private static let shieldVP: [Int: Int] = Dictionary(
        uniqueKeysWithValues: shields.map { ($0.id, $0.vp) }
    )

    static func monasteryTile(id: String) -> MonasteryTile? {
        monasteryTiles.first { $0.id == id }
    }

    static func shield(id: Int) -> Shield? {
        shields.first { $0.id == id }
    }

    static func makePlayer(name: String) -> Player {
        Player(
            id: UUID(),
            name: name,
            boardVp: 0,
            unsoldGoodsTiles: 0,
            silverCoins: 0,
            workerChipsPair: 0,
            monasteries: [],
            shields: [],
            emptyHexSpaces: 0,
            bridgePosition: 0,
            scoreHistory: []
        )
    }

    static func numericValue(_ player: Player, key: NumericKey) -> Int {
        switch key {
        case .boardVp: return player.boardVp
        case .unsoldGoodsTiles: return player.unsoldGoodsTiles
        case .silverCoins: return player.silverCoins
        case .workerChipsPair: return player.workerChipsPair
        }
    }

    static func setNumericValue(_ player: inout Player, key: NumericKey, value: Int) {
        let v = max(0, value)
        switch key {
        case .boardVp: player.boardVp = v
        case .unsoldGoodsTiles: player.unsoldGoodsTiles = v
        case .silverCoins: player.silverCoins = v
        case .workerChipsPair: player.workerChipsPair = v
        }
    }

    static func tiebreakerValue(_ player: Player, key: TiebreakerKey) -> Int {
        switch key {
        case .emptyHexSpaces: return player.emptyHexSpaces
        case .bridgePosition: return player.bridgePosition
        }
    }

    static func setTiebreakerValue(_ player: inout Player, key: TiebreakerKey, value: Int) {
        let v = max(0, value)
        switch key {
        case .emptyHexSpaces: player.emptyHexSpaces = v
        case .bridgePosition: player.bridgePosition = v
        }
    }

    static func monasteryVp(_ holding: MonasteryHolding) -> Int {
        holding.count * (tileVP[holding.tile] ?? 0)
    }

    static func scoreBreakdown(_ player: Player) -> ScoreBreakdown {
        let base = scoreRows.reduce(0) { $0 + numericValue(player, key: $1.key) }

        var monastery = player.monasteries.reduce(0) { $0 + monasteryVp($1) }
        if player.shields.contains(10) { monastery *= 2 }

        var shieldTotal = player.shields.reduce(0) { $0 + (shieldVP[$1] ?? 0) }
        if player.shields.contains(13) { shieldTotal *= 2 }

        return ScoreBreakdown(
            base: base,
            monastery: monastery,
            shields: shieldTotal,
            total: base + monastery + shieldTotal
        )
    }

    static func playerTotal(_ player: Player) -> Int {
        scoreBreakdown(player).total
    }

    static func ranking(_ players: [Player]) -> [UUID: Int] {
        let sorted = players.sorted { compareForRank($0, $1) }
        var places: [UUID: Int] = [:]
        for (index, player) in sorted.enumerated() {
            let place: Int
            if index > 0, fullyTied(sorted[index - 1], player) {
                place = places[sorted[index - 1].id]!
            } else {
                place = index + 1
            }
            places[player.id] = place
        }
        return places
    }

    static func neededTiebreakers(_ players: [Player]) -> [TiebreakerKey] {
        guard players.count >= 2 else { return [] }
        let maxTotal = players.map(playerTotal).max() ?? 0
        let tiedOnTotal = players.filter { playerTotal($0) == maxTotal }
        guard tiedOnTotal.count >= 2 else { return [] }
        let minEmpty = tiedOnTotal.map(\.emptyHexSpaces).min() ?? 0
        let tiedOnEmpty = tiedOnTotal.filter { $0.emptyHexSpaces == minEmpty }
        return tiedOnEmpty.count < 2
            ? [.emptyHexSpaces]
            : [.emptyHexSpaces, .bridgePosition]
    }

    static func placeLabel(_ place: Int) -> String {
        switch place {
        case 1: return "1-е"
        case 2: return "2-е"
        case 3: return "3-е"
        case 4: return "4-е"
        default: return "\(place)-е"
        }
    }

    static func rankedPlayers(_ players: [Player], places: [UUID: Int]) -> [Player] {
        players.sorted {
            let placeA = places[$0.id] ?? Int.max
            let placeB = places[$1.id] ?? Int.max
            return placeA != placeB
                ? placeA < placeB
                : playerTotal($0) > playerTotal($1)
        }
    }

    static func standingsText(_ players: [Player]) -> String {
        let places = ranking(players)
        let medals = [1: "🥇", 2: "🥈", 3: "🥉"]
        let lines = rankedPlayers(players, places: places).map { player in
            let place = places[player.id] ?? players.count
            let badge = medals[place] ?? "\(placeLabel(place)) "
            return "\(badge) \(player.name) — \(playerTotal(player))"
        }
        return "Замки Бургундии — итоговые очки\n\n" + lines.joined(separator: "\n")
    }

    private static func compareForRank(_ a: Player, _ b: Player) -> Bool {
        let totalDiff = playerTotal(b) - playerTotal(a)
        if totalDiff != 0 { return totalDiff > 0 }
        if a.emptyHexSpaces != b.emptyHexSpaces { return a.emptyHexSpaces < b.emptyHexSpaces }
        return a.bridgePosition > b.bridgePosition
    }

    private static func fullyTied(_ a: Player, _ b: Player) -> Bool {
        playerTotal(a) == playerTotal(b)
            && a.emptyHexSpaces == b.emptyHexSpaces
            && a.bridgePosition == b.bridgePosition
    }
}
