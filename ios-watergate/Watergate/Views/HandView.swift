import SwiftUI

struct HandView: View {
    @ObservedObject var store: GameStore

    private var snapshot: GameSnapshot { store.snapshot }
    private var visibleHand: [CardDefinition] {
        let role = handRole
        if store.isNetworkGame {
            return snapshot.player(store.localRole).hand
        }
        return snapshot.player(role).hand
    }

    private var handRole: PlayerRole {
        if let prompt = snapshot.pendingPrompt {
            switch prompt.kind {
            case .offerReaction(let window, _):
                return window.responder
            case .peekOpponentDeck(let role, _), .chooseTrackEvidence(let role, _, _), .momentumPinFromTrack(let role, _):
                return role
            default:
                break
            }
        }
        if store.isNetworkGame {
            return store.localRole
        }
        return snapshot.activeRole
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(handTitle)
                    .font(.system(size: 11, weight: .bold, design: .serif))
                    .foregroundStyle(WatergateTheme.textOnDark)
                Spacer()
                Text("\(visibleHand.count) карт")
                    .font(.caption2)
                    .foregroundStyle(WatergateTheme.mutedOnDark)
            }
            .padding(.horizontal, 4)

            if visibleHand.isEmpty {
                opponentBacksPlaceholder
            } else {
                cardFan
            }
        }
    }

    private var handTitle: String {
        if store.isNetworkGame { return "Ваша рука" }
        if case .offerReaction = snapshot.pendingPrompt?.kind { return "Реакция: \(handRole.title)" }
        return handRole.title
    }

    private var cardFan: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: -28) {
                ForEach(Array(visibleHand.enumerated()), id: \.element.id) { index, card in
                    let forced = store.snapshot.forcedPlayCardID
                    let isForced = forced == nil || forced == card.id
                    CardView(card: card, isActive: store.canControlGame && isForced) {
                        if case .offerReaction(_, let options) = store.snapshot.pendingPrompt?.kind,
                           options.contains(where: { $0.id == card.id }) {
                            store.playReaction(card)
                        } else {
                            store.selectCard(card)
                        }
                    }
                    .disabled(!store.canControlGame || !isForced)
                    .rotationEffect(.degrees(fanRotation(for: index, total: visibleHand.count)))
                    .zIndex(Double(index))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
        .frame(height: 200)
        .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(Color.black.opacity(0.22))
        )
    }

    private func fanRotation(for index: Int, total: Int) -> Double {
        guard total > 1 else { return 0 }
        let center = Double(total - 1) / 2
        return (Double(index) - center) * 2.5
    }

    private var opponentBacksPlaceholder: some View {
        HStack(spacing: 8) {
            Image(systemName: "hourglass")
                .foregroundStyle(WatergateTheme.mutedOnDark)
            Text("Ожидание соперника или оценка раунда")
                .font(.caption)
                .foregroundStyle(WatergateTheme.mutedOnDark)
        }
        .frame(maxWidth: .infinity, minHeight: 100)
        .background(Color.black.opacity(0.22))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

struct CardView: View {
    let card: CardDefinition
    var style: CardImageStyle = .hand
    var isActive = false
    var onTap: (() -> Void)?

    var body: some View {
        Button(action: { onTap?() }) {
            CardImageView(card: card, style: style, isHighlighted: isActive)
        }
        .buttonStyle(.plain)
        .disabled(onTap == nil)
        .scaleEffect(isActive ? 1.04 : 1)
        .animation(.easeOut(duration: 0.15), value: isActive)
    }
}

struct CardBackView: View {
    let role: PlayerRole

    var body: some View {
        CardImageView(
            card: CardDefinition(
                id: "back",
                role: role,
                name: "",
                value: 0,
                valueColors: [],
                isJoker: false,
                kind: .event,
                actionTitle: "",
                actionDetail: "",
                quote: "",
                isReaction: false
            ),
            style: .back(role)
        )
    }
}
