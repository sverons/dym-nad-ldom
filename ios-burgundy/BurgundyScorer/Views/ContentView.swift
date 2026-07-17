import SwiftUI

struct ContentView: View {
    @StateObject private var store = GameStore()
    @StateObject private var achievements = AchievementStore()
    @State private var selectedTab = "home"
    @State private var showClearConfirm = false

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView(store: store, showClearConfirm: $showClearConfirm) { playerId in
                selectedTab = playerId.uuidString
            }
            .tabItem {
                Label("Главная", systemImage: "trophy.fill")
            }
            .tag("home")

            AchievementsView(store: achievements)
                .tabItem {
                    Label("Ачивки", systemImage: "star.circle.fill")
                }
                .tag("achievements")

            ForEach(store.players) { player in
                playerTab(player)
            }
        }
        .tint(BurgundyTheme.accent)
        .onChange(of: store.players.map(\.id)) { _ in
            syncSelectedTab()
        }
        .confirmationDialog(
            "Сбросить все очки? Имена игроков сохранятся.",
            isPresented: $showClearConfirm,
            titleVisibility: .visible
        ) {
            Button("Сбросить очки", role: .destructive) {
                store.clearScores()
            }
            Button("Отмена", role: .cancel) {}
        }
    }

    @ViewBuilder
    private func playerTab(_ player: Player) -> some View {
        let index = store.players.firstIndex(where: { $0.id == player.id }) ?? 0

        NavigationStack {
            ScrollView {
                if let current = store.player(id: player.id) {
                    PlayerCardView(
                        store: store,
                        player: current,
                        index: index,
                        onRemoved: {
                            selectedTab = "home"
                        }
                    )
                    .padding(.horizontal, 16)
                    .padding(.bottom, 32)
                }
            }
            .background(BurgundyTheme.background)
            .navigationTitle(player.name)
            .navigationBarTitleDisplayMode(.inline)
        }
        .tabItem {
            Label(tabTitle(for: player), systemImage: "person.fill")
        }
        .tag(player.id.uuidString)
    }

    private func tabTitle(for player: Player) -> String {
        let name = player.name.trimmingCharacters(in: .whitespacesAndNewlines)
        if name.isEmpty { return "Игрок" }
        if name.count <= 8 { return name }
        return String(name.prefix(7)) + "…"
    }

    private func syncSelectedTab() {
        if selectedTab == "home" || selectedTab == "achievements" { return }
        let ids = Set(store.players.map { $0.id.uuidString })
        if !ids.contains(selectedTab) {
            selectedTab = "home"
        }
    }
}

#Preview {
    ContentView()
}
