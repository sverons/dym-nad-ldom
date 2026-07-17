import Foundation

@MainActor
enum ReactionResolver {
    static func availableReactions(for window: ReactionWindowState, snapshot: GameSnapshot) -> [CardDefinition] {
        let hand = snapshot.player(window.responder).hand
        return hand.filter { card in
            guard card.isReaction else { return false }
            return matchesTrigger(card: card, window: window)
        }
    }

    static func matchesTrigger(card: CardDefinition, window: ReactionWindowState) -> Bool {
        switch window.trigger {
        case .nixonEvidenceValueMove:
            return card.id == "e02"
        case .nixonConspiratorAction:
            return card.id == "e05" || card.id == "e06"
        case .editorEventAction:
            if card.id == "n06" {
                return window.isReReaction || triggeringCard(from: window)?.id != "e05"
            }
            return false
        }
    }

    static func applyReaction(_ card: CardDefinition, window: ReactionWindowState, snapshot: inout GameSnapshot) {
        window.checkpoint.apply(to: &snapshot)

        switch card.id {
        case "e02":
            applyFollowTheMoney(window: window, snapshot: &snapshot)
        case "e05", "e06":
            applyCancelConspirator(window: window, reactionCard: card, snapshot: &snapshot)
        case "n06":
            applyCancelEditorEvent(window: window, reactionCard: card, snapshot: &snapshot)
        default:
            break
        }

        discardReactionCard(card, snapshot: &snapshot)
        snapshot.log.append(GameLogEntry("Реакция «\(card.name)» сыграна."))
    }

    static func reReactionWindow(
        after reactionCard: CardDefinition,
        original: ReactionWindowState,
        current: GameSnapshot
    ) -> ReactionWindowState? {
        let checkpoint = ReactionCheckpoint.capture(from: current)
        switch reactionCard.id {
        case "e06":
            return ReactionWindowState(
                trigger: .editorEventAction,
                triggeringCardID: reactionCard.id,
                triggeringRole: .editor,
                responder: .nixon,
                checkpoint: checkpoint,
                evidenceContext: nil,
                isReReaction: true
            )
        case "n06":
            guard original.trigger == .nixonConspiratorAction else { return nil }
            return ReactionWindowState(
                trigger: .nixonConspiratorAction,
                triggeringCardID: original.triggeringCardID,
                triggeringRole: .nixon,
                responder: .editor,
                checkpoint: checkpoint,
                evidenceContext: nil,
                isReReaction: true
            )
        default:
            return nil
        }
    }

    private static func triggeringCard(from window: ReactionWindowState) -> CardDefinition? {
        let player = window.checkpoint.player(window.triggeringRole)
        return player.hand.first { $0.id == window.triggeringCardID }
    }

    private static func applyFollowTheMoney(window: ReactionWindowState, snapshot: inout GameSnapshot) {
        guard let ctx = window.evidenceContext,
              let triggering = triggeringCard(from: window)
        else { return }

        if let index = snapshot.trackEvidence.firstIndex(where: { $0.id == ctx.evidenceID }) {
            snapshot.trackEvidence[index].position = ctx.initialPosition
            snapshot.trackEvidence[index].isFaceUp = ctx.initialFaceUp
            GameEngine.moveEvidence(
                id: ctx.evidenceID,
                steps: ctx.moveSteps,
                toward: .editor,
                flipFaceUp: !ctx.initialFaceUp,
                snapshot: &snapshot
            )
        }

        discardTriggeringCardUnused(triggering, role: .nixon, snapshot: &snapshot)
        snapshot.log.append(GameLogEntry("«Следуй за деньгами!» отменяет ход Никсона и сдвигает улику к редактору."))
    }

    private static func applyCancelConspirator(
        window: ReactionWindowState,
        reactionCard: CardDefinition,
        snapshot: inout GameSnapshot
    ) {
        guard let triggering = triggeringCard(from: window) else { return }
        removeTriggeringCard(triggering, role: .nixon, toRemoved: true, snapshot: &snapshot)
        snapshot.log.append(GameLogEntry("«\(reactionCard.name)» отменяет заговорщика — карта Никсона убрана из игры."))
    }

    private static func applyCancelEditorEvent(
        window: ReactionWindowState,
        reactionCard: CardDefinition,
        snapshot: inout GameSnapshot
    ) {
        guard let triggering = triggeringCard(from: window) else { return }
        discardTriggeringCardUnused(triggering, role: .editor, snapshot: &snapshot)
        snapshot.log.append(GameLogEntry("«\(reactionCard.name)» отменяет событие редактора."))
    }

    private static func discardTriggeringCardUnused(
        _ card: CardDefinition,
        role: PlayerRole,
        snapshot: inout GameSnapshot
    ) {
        var player = snapshot.player(role)
        player.hand.removeAll { $0.id == card.id }
        player.discard.append(card)
        snapshot.setPlayer(role, player)
    }

    private static func removeTriggeringCard(
        _ card: CardDefinition,
        role: PlayerRole,
        toRemoved: Bool,
        snapshot: inout GameSnapshot
    ) {
        var player = snapshot.player(role)
        player.hand.removeAll { $0.id == card.id }
        if toRemoved {
            player.removed.append(card)
        } else {
            player.discard.append(card)
        }
        snapshot.setPlayer(role, player)
    }

    private static func discardReactionCard(_ card: CardDefinition, snapshot: inout GameSnapshot) {
        var player = snapshot.player(card.role)
        player.hand.removeAll { $0.id == card.id }
        if card.kind == .event || card.kind == .reaction {
            player.removed.append(card)
        } else {
            player.discard.append(card)
        }
        snapshot.setPlayer(card.role, player)
    }
}
