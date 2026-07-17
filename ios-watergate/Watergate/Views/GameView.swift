import SwiftUI

struct GameView: View {
    @ObservedObject var store: GameStore
    @State private var showRules = false

    private var snapshot: GameSnapshot { store.snapshot }

    var body: some View {
        ZStack {
            CorkBoardBackground()

            if snapshot.phase == .finished {
                ResultView(snapshot: snapshot) {
                    store.newGame()
                }
            } else if let passRole = snapshot.awaitingPassTo {
                // Сначала передача телефона — prompt откроется после «Готов».
                if store.isNetworkGame {
                    if passRole == store.localRole {
                        NetworkPassView(role: passRole, isNetwork: true) {
                            store.acknowledgePass()
                        }
                    } else {
                        WaitingOpponentView(activeRole: passRole)
                    }
                } else {
                    PassDeviceView(role: passRole) {
                        store.acknowledgePass()
                    }
                }
            } else if store.isNetworkGame && !store.canControlGame && snapshot.pendingPrompt == nil {
                WaitingOpponentView(activeRole: snapshot.activeRole)
            } else {
                mainGame
            }
        }
        .sheet(item: promptBinding) { prompt in
            PromptSheet(store: store, prompt: prompt)
        }
        .sheet(isPresented: $showRules) {
            RulesView()
        }
    }

    private var mainGame: some View {
        VStack(spacing: 10) {
            hudBar
            boardSection
            ResearchTrackView(snapshot: snapshot)
            LogView(entries: Array(snapshot.log.suffix(3)))
            HandView(store: store)
        }
        .padding(.horizontal, 10)
        .padding(.top, 8)
        .padding(.bottom, 6)
    }

    private var hudBar: some View {
        GameHUDBar {
            HStack(spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Раунд \(max(snapshot.round, 1))")
                        .font(.caption2)
                        .foregroundStyle(WatergateTheme.mutedOnDark)
                    Text("Ход: \(snapshot.activeRole.title)")
                        .font(WatergateTheme.labelFont(14))
                        .foregroundStyle(WatergateTheme.textOnDark)
                    if store.isNetworkGame {
                        Text("Вы: \(store.localRole.title)")
                            .font(.caption2)
                            .foregroundStyle(WatergateTheme.menuTeal)
                    }
                }

                Spacer()

                hudMetric("Иниц.", snapshot.initiativeHolder == .editor ? "Ред." : "Никс.")
                hudMetric("Вл.", "\(snapshot.nixon.momentumCount)/5")
                hudMetric("Связи", "\(BoardLayout.connectedInformantCount(in: snapshot))/2")

                Menu {
                    Button("Правила") { showRules = true }
                    Button("Новая партия", role: .destructive) { store.newGame() }
                } label: {
                    Image(systemName: "gearshape.fill")
                        .foregroundStyle(WatergateTheme.textOnDark.opacity(0.85))
                }
            }
        }
    }

    private func hudMetric(_ title: String, _ value: String) -> some View {
        VStack(spacing: 1) {
            Text(title)
                .font(.system(size: 9, weight: .medium))
                .foregroundStyle(WatergateTheme.mutedOnDark)
            Text(value)
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .foregroundStyle(WatergateTheme.textOnDark)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 4)
        .background(Color.white.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 5))
    }

    private var boardSection: some View {
        BoardView(snapshot: snapshot, onPin: nil)
    }

    private var promptBinding: Binding<PendingPrompt?> {
        Binding(
            get: {
                // Не показываем prompt, пока телефон не передан нужному игроку.
                if store.snapshot.awaitingPassTo != nil { return nil }
                return store.snapshot.pendingPrompt
            },
            set: { _ in }
        )
    }
}

struct NetworkPassView: View {
    let role: PlayerRole
    let isNetwork: Bool
    let onContinue: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.45).ignoresSafeArea()
            VStack(spacing: 16) {
                Text(isNetwork ? "Ваш ход" : "Передайте iPhone")
                    .font(WatergateTheme.titleFont(28))
                    .foregroundStyle(WatergateTheme.textOnDark)
                Text(role.title)
                    .font(WatergateTheme.bodySerif(18))
                    .foregroundStyle(WatergateTheme.menuTeal)
                Button(isNetwork ? "Продолжить" : "Готов", action: onContinue)
                    .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))
                    .padding(.horizontal, 40)
            }
            .padding(32)
        }
    }
}

struct WaitingOpponentView: View {
    let activeRole: PlayerRole

    var body: some View {
        VStack(spacing: 14) {
            ProgressView()
                .tint(WatergateTheme.menuTeal)
            Text("Ход соперника")
                .font(WatergateTheme.titleFont(24))
                .foregroundStyle(WatergateTheme.textOnDark)
            Text(activeRole.title)
                .font(WatergateTheme.bodySerif(16))
                .foregroundStyle(WatergateTheme.mutedOnDark)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.opacity(0.35))
    }
}

struct LogView: View {
    let entries: [GameLogEntry]

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            ForEach(entries) { entry in
                Text(entry.message)
                    .font(.system(size: 10, design: .serif))
                    .foregroundStyle(WatergateTheme.text.opacity(0.85))
                    .lineLimit(2)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .parchmentPanel(cornerRadius: 8, padding: 10)
    }
}

struct ResultView: View {
    let snapshot: GameSnapshot
    let onNewGame: () -> Void

    var body: some View {
        ZStack {
            ShatteredGlassBackground()

            VStack(spacing: 22) {
                Text(snapshot.winner == .editor ? "Редактор победил" : "Никсон победил")
                    .font(WatergateTheme.titleFont(28))
                    .foregroundStyle(WatergateTheme.textOnDark)

                Text(snapshot.log.last?.message ?? "")
                    .font(WatergateTheme.bodySerif())
                    .multilineTextAlignment(.center)
                    .foregroundStyle(WatergateTheme.mutedOnDark)
                    .padding(.horizontal, 24)

                Button("Новая партия", action: onNewGame)
                    .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))
                    .padding(.horizontal, 40)
            }
        }
    }
}
