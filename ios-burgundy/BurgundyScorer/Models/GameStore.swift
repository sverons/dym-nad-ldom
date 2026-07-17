import Foundation
import SwiftUI

@MainActor
final class GameStore: ObservableObject {
    @Published private(set) var players: [Player] = []

    private let storageKey = "burgundy-scorer:players"

    init() {
        load()
    }

    var places: [UUID: Int] {
        ScoringData.ranking(players)
    }

    var tiebreakers: [TiebreakerKey] {
        ScoringData.neededTiebreakers(players)
    }

    var hasSoleLeader: Bool {
        guard players.count > 1 else { return false }
        let firstPlaces = places.values.filter { $0 == 1 }.count
        return firstPlaces == 1
    }

    var ownedTileIds: Set<String> {
        Set(players.flatMap { $0.monasteries.map(\.tile) })
    }

    var ownedShieldIds: Set<Int> {
        Set(players.flatMap(\.shields))
    }

    var availableTiles: [MonasteryTile] {
        ScoringData.monasteryTiles.filter { !ownedTileIds.contains($0.id) }
    }

    var availableShields: [Shield] {
        ScoringData.shields.filter { !ownedShieldIds.contains($0.id) }
    }

    @discardableResult
    func addPlayer() -> UUID? {
        guard players.count < ScoringData.maxPlayers else { return nil }
        let player = ScoringData.makePlayer(name: "Игрок \(players.count + 1)")
        players.append(player)
        save()
        return player.id
    }

    @discardableResult
    func removePlayer(id: UUID) -> Bool {
        guard players.count > 1 else { return false }
        players.removeAll { $0.id == id }
        save()
        return true
    }

    var playersByScore: [Player] {
        players.sorted { ScoringData.playerTotal($0) > ScoringData.playerTotal($1) }
    }

    func player(id: UUID) -> Player? {
        players.first { $0.id == id }
    }

    func renamePlayer(id: UUID, name: String) {
        guard let index = players.firstIndex(where: { $0.id == id }) else { return }
        players[index].name = name
        save()
    }

    func updateNumeric(id: UUID, key: NumericKey, value: Int) {
        guard let index = players.firstIndex(where: { $0.id == id }) else { return }
        ScoringData.setNumericValue(&players[index], key: key, value: value)
        save()
    }

    /// Прибавляет или вычитает число и пишет его в историю поля.
    func applyNumericDelta(id: UUID, key: NumericKey, delta: Int) {
        guard let index = players.firstIndex(where: { $0.id == id }) else { return }
        let current = ScoringData.numericValue(players[index], key: key)
        let next = max(0, current + delta)
        let actual = next - current
        guard actual != 0 else { return }
        ScoringData.setNumericValue(&players[index], key: key, value: next)
        players[index].scoreHistory.append(
            ScoreDeltaEntry(key: key.rawValue, delta: actual)
        )
        save()
    }

    func removeHistoryEntry(playerId: UUID, entryId: UUID) {
        guard let index = players.firstIndex(where: { $0.id == playerId }) else { return }
        guard let entry = players[index].scoreHistory.first(where: { $0.id == entryId }) else { return }
        if let key = NumericKey(rawValue: entry.key) {
            let current = ScoringData.numericValue(players[index], key: key)
            ScoringData.setNumericValue(
                &players[index],
                key: key,
                value: max(0, current - entry.delta)
            )
        }
        players[index].scoreHistory.removeAll { $0.id == entryId }
        save()
    }

    func updateTiebreaker(id: UUID, key: TiebreakerKey, value: Int) {
        guard let index = players.firstIndex(where: { $0.id == id }) else { return }
        ScoringData.setTiebreakerValue(&players[index], key: key, value: value)
        save()
    }

    func addMonastery(playerId: UUID, tileId: String) {
        guard let index = players.firstIndex(where: { $0.id == playerId }) else { return }
        players[index].monasteries.append(MonasteryHolding(tile: tileId, count: 1))
        save()
    }

    func setMonasteryCount(playerId: UUID, tileId: String, count: Int) {
        guard let pIndex = players.firstIndex(where: { $0.id == playerId }) else { return }
        guard let mIndex = players[pIndex].monasteries.firstIndex(where: { $0.tile == tileId }) else { return }
        players[pIndex].monasteries[mIndex].count = max(0, count)
        save()
    }

    func removeMonastery(playerId: UUID, tileId: String) {
        guard let index = players.firstIndex(where: { $0.id == playerId }) else { return }
        players[index].monasteries.removeAll { $0.tile == tileId }
        save()
    }

    func addShield(playerId: UUID, shieldId: Int) {
        guard let index = players.firstIndex(where: { $0.id == playerId }) else { return }
        players[index].shields.append(shieldId)
        save()
    }

    func removeShield(playerId: UUID, shieldId: Int) {
        guard let index = players.firstIndex(where: { $0.id == playerId }) else { return }
        players[index].shields.removeAll { $0 == shieldId }
        save()
    }

    func clearScores() {
        players = players.map { player in
            var fresh = ScoringData.makePlayer(name: player.name)
            fresh.id = player.id
            return fresh
        }
        save()
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([Player].self, from: data),
              !decoded.isEmpty
        else {
            players = [ScoringData.makePlayer(name: "Игрок 1")]
            return
        }
        players = Array(decoded.prefix(ScoringData.maxPlayers))
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(players) else { return }
        UserDefaults.standard.set(data, forKey: storageKey)
    }
}
