import SwiftUI

struct HomeView: View {
    @ObservedObject var store: GameStore
    @Binding var showClearConfirm: Bool
    var onSelectPlayer: (UUID) -> Void

    @State private var showShare = false

    private var maxTotal: Int {
        max(1, store.players.map(ScoringData.playerTotal).max() ?? 1)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    header
                    toolbar
                    standingsCard
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 32)
            }
            .background(BurgundyTheme.background)
            .navigationTitle("Главная")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showShare) {
                ShareSheet(items: [ScoringData.standingsText(store.players)])
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Замки Бургундии")
                .font(.title.weight(.bold))
                .foregroundStyle(BurgundyTheme.text)
            Text("Итоговые очки")
                .font(.subheadline)
                .foregroundStyle(BurgundyTheme.muted)
        }
        .padding(.top, 4)
    }

    private var toolbar: some View {
        HStack(spacing: 12) {
            Button {
                if let id = store.addPlayer() {
                    onSelectPlayer(id)
                }
            } label: {
                Label("Игрок", systemImage: "person.badge.plus")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(BurgundyTheme.accent)
            .disabled(store.players.count >= ScoringData.maxPlayers)

            Button {
                showShare = true
            } label: {
                Image(systemName: "square.and.arrow.up")
            }
            .buttonStyle(.bordered)
            .tint(BurgundyTheme.accent)

            Button("Сброс") {
                showClearConfirm = true
            }
            .buttonStyle(.bordered)
            .tint(BurgundyTheme.accent)
        }
    }

    private var standingsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Таблица")
                .font(.headline)
                .foregroundStyle(BurgundyTheme.text)

            if store.players.isEmpty {
                Text("Добавьте игроков")
                    .foregroundStyle(BurgundyTheme.muted)
            } else {
                VStack(spacing: 8) {
                    ForEach(store.playersByScore) { player in
                        standingRow(player)
                    }
                }
            }
        }
        .padding(16)
        .background(BurgundyTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(BurgundyTheme.border, lineWidth: 1)
        )
    }

    @ViewBuilder
    private func standingRow(_ player: Player) -> some View {
        let place = store.places[player.id] ?? store.players.count
        let total = ScoringData.playerTotal(player)

        Button {
            onSelectPlayer(player.id)
        } label: {
            HStack(spacing: 10) {
                Text("\(place)")
                    .font(.caption.weight(.bold).monospacedDigit())
                    .foregroundStyle(.white)
                    .frame(width: 26, height: 26)
                    .background(Circle().fill(BurgundyTheme.rankColor(place)))

                Text(player.name)
                    .font(.body.weight(.medium))
                    .foregroundStyle(BurgundyTheme.text)
                    .lineLimit(1)

                Spacer()

                Text("\(total)")
                    .font(.title3.weight(.bold).monospacedDigit())
                    .foregroundStyle(BurgundyTheme.text)

                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(BurgundyTheme.muted)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 10)
            .background(
                GeometryReader { geo in
                    HStack(spacing: 0) {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(BurgundyTheme.accent.opacity(place == 1 ? 0.18 : 0.10))
                            .frame(width: geo.size.width * CGFloat(total) / CGFloat(maxTotal))
                        Spacer(minLength: 0)
                    }
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}
