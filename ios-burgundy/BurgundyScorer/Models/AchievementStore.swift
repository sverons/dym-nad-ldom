import Foundation
import SwiftUI

@MainActor
final class AchievementStore: ObservableObject {
    @Published private(set) var completedIds: Set<String> = []

    private let storageKey = "burgundy-scorer:achievements"

    init() {
        load()
    }

    var completedCount: Int { completedIds.count }
    var totalCount: Int { AchievementsCatalog.all.count }

    func isCompleted(_ id: String) -> Bool {
        completedIds.contains(id)
    }

    func toggle(_ id: String) {
        if completedIds.contains(id) {
            completedIds.remove(id)
        } else {
            completedIds.insert(id)
        }
        save()
    }

    func resetAll() {
        completedIds.removeAll()
        save()
    }

    private func load() {
        if let saved = UserDefaults.standard.array(forKey: storageKey) as? [String] {
            completedIds = Set(saved)
        }
    }

    private func save() {
        UserDefaults.standard.set(Array(completedIds), forKey: storageKey)
    }
}
