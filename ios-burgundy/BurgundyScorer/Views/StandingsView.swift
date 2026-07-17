import SwiftUI

struct StandingsView: View {
    let players: [Player]
    let places: [UUID: Int]

    @State private var showShare = false
    @State private var copied = false

    private var sorted: [Player] {
        ScoringData.rankedPlayers(players, places: places)
    }

    private var maxTotal: Int {
        max(1, players.map(ScoringData.playerTotal).max() ?? 1)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Таблица")
                    .font(.headline)
                    .foregroundStyle(BurgundyTheme.text)
                Spacer()
                Button(copied ? "Скопировано ✓" : "Поделиться") {
                    showShare = true
                }
                .font(.subheadline.weight(.medium))
                .buttonStyle(.bordered)
                .tint(BurgundyTheme.accent)
            }

            VStack(spacing: 8) {
                ForEach(sorted) { player in
                    standingRow(player)
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
        .sheet(isPresented: $showShare) {
            ShareSheet(items: [ScoringData.standingsText(players)]) {
                copied = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    copied = false
                }
            }
        }
    }

    @ViewBuilder
    private func standingRow(_ player: Player) -> some View {
        let place = places[player.id] ?? players.count
        let total = ScoringData.playerTotal(player)

        HStack(spacing: 10) {
            Text("\(place)")
                .font(.caption.weight(.bold).monospacedDigit())
                .foregroundStyle(.white)
                .frame(width: 22, height: 22)
                .background(Circle().fill(BurgundyTheme.rankColor(place)))

            Text(player.name)
                .font(.subheadline)
                .foregroundStyle(BurgundyTheme.text)
                .lineLimit(1)

            Spacer()

            Text("\(total)")
                .font(.subheadline.weight(.semibold).monospacedDigit())
                .foregroundStyle(BurgundyTheme.text)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(
            GeometryReader { geo in
                HStack(spacing: 0) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(BurgundyTheme.accent.opacity(0.15))
                        .frame(width: geo.size.width * CGFloat(total) / CGFloat(maxTotal))
                    Spacer(minLength: 0)
                }
            }
        )
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    var onComplete: (() -> Void)?

    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
        controller.completionWithItemsHandler = { _, _, _, _ in
            onComplete?()
        }
        return controller
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
