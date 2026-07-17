import Foundation
import Combine

@MainActor
final class GameEngine: ObservableObject {
    @Published private(set) var snapshot: GameSnapshot

    init() {
        let editor = PlayerState(
            role: .editor,
            drawPile: CardDatabase.deck(for: .editor),
            hand: [],
            discard: [],
            removed: [],
            momentumCount: 0
        )
        let nixon = PlayerState(
            role: .nixon,
            drawPile: CardDatabase.deck(for: .nixon),
            hand: [],
            discard: [],
            removed: [],
            momentumCount: 0
        )
        snapshot = GameSnapshot(
            editor: editor,
            nixon: nixon,
            informants: BoardLayout.makeInformants(),
            evidenceSpaces: BoardLayout.makeEvidenceSpaces()
        )
        snapshot.evidenceBag = BoardLayout.makeEvidenceBag()
    }

    func startNewGame(humanRole: PlayerRole, connectionMode: ConnectionMode = .sameDevice) {
        let editor = PlayerState(
            role: .editor,
            drawPile: CardDatabase.deck(for: .editor),
            hand: [],
            discard: [],
            removed: [],
            momentumCount: 0
        )
        let nixon = PlayerState(
            role: .nixon,
            drawPile: CardDatabase.deck(for: .nixon),
            hand: [],
            discard: [],
            removed: [],
            momentumCount: 0
        )
        snapshot = GameSnapshot(
            editor: editor,
            nixon: nixon,
            informants: BoardLayout.makeInformants(),
            evidenceSpaces: BoardLayout.makeEvidenceSpaces()
        )
        snapshot.evidenceBag = BoardLayout.makeEvidenceBag()
        snapshot.phase = .setup
        snapshot.round = 1
        snapshot.initiativeHolder = .editor
        snapshot.activeRole = .nixon
        snapshot.awaitingPassTo = .nixon
        snapshot.setupEvidencePlaced = false
        snapshot.humanRole = humanRole
        snapshot.log = [GameLogEntry(connectionMode == .wifi
            ? "Сетевая партия. Вы играете за \(humanRole.title)."
            : "Новая партия. Вы играете за \(humanRole.title).")]
        placeInitialSetupEvidence()
    }

    func applySyncedSnapshot(_ snapshot: GameSnapshot) {
        self.snapshot = snapshot
    }

    #if DEBUG
    func mutateSnapshotForTesting(_ body: (inout GameSnapshot) -> Void) {
        body(&snapshot)
    }
    #endif

    func acknowledgePass() {
        snapshot.awaitingPassTo = nil
        // Пока есть prompt (peek улик и т.п.) — не стартуем фазу карт.
        if snapshot.pendingPrompt != nil { return }
        if snapshot.phase == .setup && !snapshot.setupEvidencePlaced {
            return
        }
        if snapshot.phase == .initial {
            beginCardPhaseIfReady()
        }
    }

    func selectCard(_ card: CardDefinition) {
        if let forced = snapshot.forcedPlayCardID, card.id != forced { return }
        if let prompt = snapshot.pendingPrompt {
            switch prompt.kind {
            case .chooseCardMode:
                break
            default:
                return
            }
        }
        guard snapshot.player(snapshot.activeRole).hand.contains(card) else { return }
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseCardMode(card))
    }

    func chooseValue(for card: CardDefinition) {
        let options = valueMoveOptions(for: card, role: snapshot.activeRole)
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseValueTarget(card, options))
    }

    func chooseAction(for card: CardDefinition) {
        guard CardActionResolver.canPlayAction(card, snapshot: snapshot) else { return }
        snapshot.pendingPrompt = PendingPrompt(kind: .confirmAction(card))
    }

    func performValueMove(card: CardDefinition, target: ValueMoveOption.Target) {
        if case .hiddenEvidence(let id, let color) = target,
           snapshot.activeRole == .editor {
            snapshot.pendingPrompt = PendingPrompt(
                kind: .nixonHiddenEvidenceAsk(card, color, id, card.value)
            )
            snapshot.awaitingPassTo = .nixon
            return
        }

        let checkpoint = snapshot
        var evidenceContext: EvidenceMoveContext?

        if case .evidence(let id) = target, snapshot.activeRole == .nixon,
           let item = snapshot.trackEvidence.first(where: { $0.id == id }) {
            evidenceContext = EvidenceMoveContext(
                evidenceID: id,
                initialPosition: item.position,
                initialFaceUp: item.isFaceUp,
                moveSteps: card.value
            )
        }

        applyValueMove(card: card, target: target, evidenceContext: evidenceContext, checkpoint: checkpoint)
    }

    private func applyValueMove(
        card: CardDefinition,
        target: ValueMoveOption.Target,
        evidenceContext: EvidenceMoveContext?,
        checkpoint: GameSnapshot
    ) {
        switch target {
        case .initiative:
            Self.moveInitiative(steps: card.value, toward: snapshot.activeRole, snapshot: &snapshot)
        case .momentum:
            Self.moveMomentum(steps: card.value, toward: snapshot.activeRole, snapshot: &snapshot)
        case .evidence(let id):
            let flip = snapshot.trackEvidence.first(where: { $0.id == id })?.isFaceUp == false
            Self.moveEvidence(id: id, steps: card.value, toward: snapshot.activeRole, flipFaceUp: flip, snapshot: &snapshot)
        case .hiddenEvidence:
            break
        }

        if let ctx = evidenceContext,
           openReactionWindowIfNeeded(
               trigger: .nixonEvidenceValueMove,
               card: card,
               checkpoint: checkpoint,
               evidenceContext: ctx
           ) {
            return
        }

        if snapshot.pendingPrompt != nil { return }
        completeCardResolution(card: card, usedValue: true)
    }

    func answerHiddenEvidence(hasColor: Bool, card: CardDefinition, color: EvidenceColor, evidenceID: UUID, steps: Int) {
        guard case .nixonHiddenEvidenceAsk(let promptCard, let promptColor, let promptID, let promptSteps) = snapshot.pendingPrompt?.kind,
              promptCard.id == card.id, promptColor == color, promptID == evidenceID, promptSteps == steps
        else { return }

        if !hasColor {
            snapshot.pendingPrompt = PendingPrompt(kind: .chooseValueTarget(card, valueMoveOptions(for: card, role: .editor)))
            snapshot.awaitingPassTo = .editor
            snapshot.log.append(GameLogEntry("Никсон: тайной улики этого цвета нет."))
            return
        }

        let matches = snapshot.trackEvidence.filter { !$0.isFaceUp && $0.token.colors.matches(color) }
        if matches.count == 1, let item = matches.first {
            Self.moveEvidence(id: item.id, steps: steps, toward: .editor, flipFaceUp: true, snapshot: &snapshot)
            snapshot.pendingPrompt = nil
            snapshot.awaitingPassTo = nil
            if snapshot.pendingPrompt == nil {
                completeCardResolution(card: card, usedValue: true)
            }
            return
        }

        snapshot.pendingPrompt = PendingPrompt(kind: .nixonHiddenEvidencePick(card, matches, steps))
        snapshot.awaitingPassTo = .nixon
    }

    func pickHiddenEvidenceToReveal(evidenceID: UUID, card: CardDefinition, steps: Int) {
        guard case .nixonHiddenEvidencePick(let promptCard, _, let promptSteps) = snapshot.pendingPrompt?.kind,
              promptCard.id == card.id, promptSteps == steps
        else { return }

        Self.moveEvidence(id: evidenceID, steps: steps, toward: .editor, flipFaceUp: true, snapshot: &snapshot)
        snapshot.pendingPrompt = nil
        snapshot.awaitingPassTo = nil
        if snapshot.pendingPrompt == nil {
            completeCardResolution(card: card, usedValue: true)
        }
    }

    func chooseInitiativeOrMomentum(card: CardDefinition, useInitiative: Bool) {
        guard case .chooseInitiativeOrMomentum(let promptCard, let steps) = snapshot.pendingPrompt?.kind,
              promptCard.id == card.id
        else { return }

        if useInitiative {
            Self.moveInitiative(steps: steps, toward: card.role, snapshot: &snapshot)
        } else {
            Self.moveMomentum(steps: steps, toward: card.role, snapshot: &snapshot)
        }
        snapshot.pendingPrompt = nil
        snapshot.awaitingPassTo = nil
        if pauseIfImmediatePinRequired() { return }
        completeCardResolution(card: card, usedValue: false)
    }

    func chooseGambitMomentum(card: CardDefinition) {
        guard case .gambitChoice(let gambit) = snapshot.pendingPrompt?.kind, gambit.id == card.id else { return }
        CardActionResolver.applyGambitMomentum(card: card, snapshot: &snapshot)
        snapshot.pendingPrompt = nil
        snapshot.awaitingPassTo = nil
        completeCardResolution(card: card, usedValue: false)
    }

    func chooseGambitSacrifice(conspirator: CardDefinition, gambit: CardDefinition) {
        guard case .gambitChoice(let card) = snapshot.pendingPrompt?.kind, card.id == gambit.id else { return }
        CardActionResolver.applyGambitSacrifice(conspirator: conspirator, gambit: gambit, snapshot: &snapshot)
        snapshot.pendingPrompt = nil
        snapshot.awaitingPassTo = nil
        snapshot.nixonTurnsThisRound += 1
    }

    func confirmNixonSetupEvidence() {
        guard case .nixonSetupEvidence(let tokens) = snapshot.pendingPrompt?.kind else { return }
        // Replace tokens on «0»; keep none from previous if any leftover at 0.
        snapshot.trackEvidence.removeAll { $0.position == 0 }
        snapshot.trackEvidence.append(contentsOf: tokens.map {
            TrackEvidence(token: $0, position: 0, isFaceUp: false)
        })
        snapshot.setupEvidencePlaced = true
        snapshot.pendingPrompt = nil
        snapshot.log.append(GameLogEntry("Никсон разместил \(tokens.count) тайные улики на «0»."))

        if snapshot.phase == .setup {
            // Старт партии: улики уже выложены → раздача и ход.
            beginInitialPhase(placeNewEvidence: false)
        } else {
            // Новый раунд: раздача уже была в beginInitialPhase → только фаза карт.
            startCardPlayPhase()
        }
    }

    func chooseRemovedCardAction(systemCard: CardDefinition, removed: CardDefinition) {
        guard case .chooseRemovedCard(let promptCard) = snapshot.pendingPrompt?.kind,
              promptCard.id == systemCard.id
        else { return }

        snapshot.pendingPrompt = nil
        let outcome = CardActionResolver.replayRemovedCard(removed, systemCard: systemCard, snapshot: &snapshot)
        if outcome == .paused { return }
        completeCardResolution(card: systemCard, usedValue: false)
    }

    func chooseInformantAction(card: CardDefinition, informant: InformantID, initiativeSteps: Int) {
        guard case .chooseInformant(let promptCard, let options, _, let steps) = snapshot.pendingPrompt?.kind,
              promptCard.id == card.id, options.contains(informant)
        else { return }

        CardActionResolver.unpinInformantAndMoveInitiative(informant, steps: steps, snapshot: &snapshot)
        snapshot.pendingPrompt = nil
        snapshot.awaitingPassTo = nil
        completeCardResolution(card: card, usedValue: false)
    }

    func chooseBoardEvidenceAction(card: CardDefinition, node: BoardNodeID) {
        guard case .chooseBoardEvidence(let promptCard) = snapshot.pendingPrompt?.kind,
              promptCard.id == card.id
        else { return }

        if card.id == "e04" {
            CardActionResolver.completeBernstein(boardNode: node, card: card, snapshot: &snapshot)
        }
        snapshot.pendingPrompt = nil
        snapshot.awaitingPassTo = nil
        completeCardResolution(card: card, usedValue: false)
    }

    func confirmAction(for card: CardDefinition) {
        if card.id == "n05" {
            resolveHuntCard(card)
            return
        }

        let checkpoint = snapshot
        let outcome = CardActionResolver.apply(card, snapshot: &snapshot)
        if outcome == .paused {
            return
        }

        if let trigger = reactionTrigger(for: card),
           openReactionWindowIfNeeded(
               trigger: trigger,
               card: card,
               checkpoint: checkpoint,
               evidenceContext: nil
           ) {
            return
        }

        handleCardOutcome(outcome, card: card, usedValue: false)
    }

    func handleCardOutcome(_ outcome: CardApplyOutcome, card: CardDefinition, usedValue: Bool) {
        switch outcome {
        case .paused:
            return
        case .extraTurn(let role):
            finishCard(card, usedValue: usedValue)
            snapshot.activeRole = role
            snapshot.awaitingPassTo = role
            snapshot.pendingResumeRole = nil
            snapshot.log.append(GameLogEntry("Снова ход \(role.title)."))
        case .endRound:
            finishCard(card, usedValue: usedValue)
            endRoundImmediately()
        case .completed:
            completeCardResolution(card: card, usedValue: usedValue)
        }
    }

    func declineReaction() {
        guard case .offerReaction(let window, _) = snapshot.pendingPrompt?.kind else { return }
        snapshot.pendingPrompt = nil
        snapshot.awaitingPassTo = nil
        guard let card = triggeringCard(id: window.triggeringCardID, role: window.triggeringRole) else {
            advanceTurn()
            return
        }
        completeCardResolution(
            card: card,
            usedValue: window.trigger == .nixonEvidenceValueMove
        )
    }

    func playReaction(_ card: CardDefinition) {
        guard case .offerReaction(let window, let options) = snapshot.pendingPrompt?.kind,
              options.contains(where: { $0.id == card.id })
        else { return }

        ReactionResolver.applyReaction(card, window: window, snapshot: &snapshot)
        snapshot.pendingPrompt = nil
        snapshot.awaitingPassTo = nil

        if let reWindow = ReactionResolver.reReactionWindow(after: card, original: window, current: snapshot) {
            let reactions = ReactionResolver.availableReactions(for: reWindow, snapshot: snapshot)
            if !reactions.isEmpty {
                snapshot.pendingPrompt = PendingPrompt(kind: .offerReaction(reWindow, reactions))
                snapshot.awaitingPassTo = reWindow.responder
                return
            }
        }

        checkEditorWin()
        checkNixonWin()
        guard snapshot.winner == nil else {
            snapshot.phase = .finished
            return
        }
        if pauseIfImmediatePinRequired() { return }

        let resumeRole: PlayerRole? = switch card.id {
        case "e02", "e05", "e06": PlayerRole.nixon
        case "n06": PlayerRole.editor
        default: nil
        }
        if let resume = resumeRole {
            snapshot.activeRole = resume
            snapshot.awaitingPassTo = resume
            snapshot.log.append(GameLogEntry("Снова ход \(resume.title)."))
            return
        }
        advanceTurn()
    }

    func completePeekDeck() {
        guard case .peekOpponentDeck = snapshot.pendingPrompt?.kind else { return }
        snapshot.pendingPrompt = nil
        snapshot.awaitingPassTo = nil
        resumeAfterMomentumBonusIfNeeded()
    }

    func performTrackEvidenceMove(evidenceID: UUID, steps: Int, role: PlayerRole) {
        if case .chooseTrackEvidenceMulti(let promptRole, _, _, _, _) = snapshot.pendingPrompt?.kind,
           promptRole == role {
            performMultiStepTrackMove(evidenceID: evidenceID, steps: steps, role: role)
            return
        }

        guard case .chooseTrackEvidence(let promptRole, let promptSteps, _) = snapshot.pendingPrompt?.kind,
              promptRole == role
        else { return }

        let effectiveSteps = promptSteps == 0 ? steps : promptSteps

        if effectiveSteps == 0 {
            if promptRole == .nixon, snapshot.pendingMultiStepCardID == "n02" {
                CardActionResolver.returnTrackEvidenceToBag(id: evidenceID, snapshot: &snapshot)
                snapshot.pendingPrompt = nil
                snapshot.awaitingPassTo = nil
                if let cardID = snapshot.pendingMultiStepCardID,
                   let card = snapshot.nixon.hand.first(where: { $0.id == cardID }) {
                    snapshot.pendingMultiStepCardID = nil
                    completeCardResolution(card: card, usedValue: false)
                }
                return
            }
            if promptRole == .nixon, snapshot.pendingMultiStepCardID == "n07" {
                CardActionResolver.returnTrackEvidenceToBag(id: evidenceID, snapshot: &snapshot)
                snapshot.pendingPrompt = nil
                snapshot.awaitingPassTo = nil
                if let card = snapshot.nixon.hand.first(where: { $0.id == "n07" }) {
                    completeCardResolution(card: card, usedValue: false)
                }
                return
            }
            if promptRole == .editor, snapshot.pendingMultiStepCardID == "e16" {
                guard let item = snapshot.trackEvidence.first(where: { $0.id == evidenceID }) else { return }
                snapshot.trackEvidence.removeAll { $0.id == evidenceID }
                snapshot.pendingPrompt = PendingPrompt(kind: .pinEvidence(item.token, .editor))
                snapshot.awaitingPassTo = .editor
                snapshot.pendingMultiStepCardID = nil
                return
            }
            if promptRole == .nixon, snapshot.pendingMultiStepCardID == "n15" {
                CardActionResolver.moveTrackEvidenceToZero(id: evidenceID, snapshot: &snapshot)
                GameEngine.moveMomentumToSpace(1, toward: .nixon, snapshot: &snapshot)
                snapshot.pendingPrompt = nil
                snapshot.pendingMultiStepCardID = nil
                if let card = snapshot.nixon.hand.first(where: { $0.id == "n15" }) {
                    completeCardResolution(card: card, usedValue: false)
                }
                return
            }
            return
        }

        guard let item = snapshot.trackEvidence.first(where: { $0.id == evidenceID }) else { return }

        Self.moveEvidence(
            id: evidenceID,
            steps: effectiveSteps,
            toward: role,
            flipFaceUp: !item.isFaceUp,
            snapshot: &snapshot
        )

        if let remaining = snapshot.pendingFaceUpEvidenceMovesLeft {
            snapshot.pendingFaceUpEvidenceMovesLeft = remaining - 1
            if snapshot.pendingFaceUpEvidenceMovesLeft ?? 0 > 0 {
                let faceUp = snapshot.trackEvidence.filter(\.isFaceUp)
                if !faceUp.isEmpty {
                    snapshot.pendingPrompt = PendingPrompt(kind: .chooseTrackEvidence(role, 1, faceUp))
                    return
                }
            }
            snapshot.pendingFaceUpEvidenceMovesLeft = nil
            snapshot.pendingMultiStepCardID = nil
        }

        if snapshot.pendingMultiStepCardID == "n10" {
            snapshot.pendingPrompt = nil
            snapshot.pendingMultiStepCardID = nil
            if let card = snapshot.nixon.hand.first(where: { $0.id == "n10" }) {
                finishCard(card, usedValue: false)
                endRoundImmediately()
            }
            return
        }

        snapshot.pendingPrompt = nil
        snapshot.awaitingPassTo = nil
        if pauseIfImmediatePinRequired() { return }

        if let cardID = snapshot.pendingMultiStepCardID,
           let card = snapshot.player(role).hand.first(where: { $0.id == cardID }) {
            snapshot.pendingMultiStepCardID = nil
            completeCardResolution(card: card, usedValue: false)
            return
        }

        resumeAfterMomentumBonusIfNeeded()
    }

    private func performMultiStepTrackMove(evidenceID: UUID, steps: Int, role: PlayerRole) {
        guard case .chooseTrackEvidenceMulti(let promptRole, let stepSize, _, _, let budget) = snapshot.pendingPrompt?.kind,
              promptRole == role,
              let item = snapshot.trackEvidence.first(where: { $0.id == evidenceID })
        else { return }

        let moveSteps = stepSize > 0 ? stepSize : min(steps, snapshot.pendingEvidenceStepBudget ?? steps)
        Self.moveEvidence(id: evidenceID, steps: moveSteps, toward: role, flipFaceUp: !item.isFaceUp, snapshot: &snapshot)

        if snapshot.pendingPrompt != nil { return }

        if let cardID = snapshot.pendingMultiStepCardID, cardID == "n08" {
            let remaining = (snapshot.pendingEvidenceStepBudget ?? 2) - 1
            snapshot.pendingEvidenceStepBudget = remaining
            if remaining > 0 {
                snapshot.pendingPrompt = PendingPrompt(
                    kind: .chooseTrackEvidenceMulti(.nixon, 2, 2, snapshot.trackEvidence, 0)
                )
                snapshot.awaitingPassTo = .nixon
                return
            }
            snapshot.pendingEvidenceStepBudget = nil
            snapshot.pendingMultiStepCardID = nil
            if let card = snapshot.nixon.hand.first(where: { $0.id == "n08" }) {
                completeCardResolution(card: card, usedValue: false)
            }
            return
        }

        if let cardID = snapshot.pendingMultiStepCardID, cardID == "n19" {
            let remaining = (snapshot.pendingEvidenceStepBudget ?? budget) - moveSteps
            snapshot.pendingEvidenceStepBudget = remaining
            if remaining > 0, !snapshot.trackEvidence.isEmpty {
                snapshot.pendingPrompt = PendingPrompt(
                    kind: .chooseTrackEvidenceMulti(.nixon, 0, 0, snapshot.trackEvidence, remaining)
                )
                snapshot.awaitingPassTo = .nixon
                return
            }
            snapshot.pendingEvidenceStepBudget = nil
            snapshot.pendingMultiStepCardID = nil
            if let card = snapshot.nixon.hand.first(where: { $0.id == "n19" }) {
                completeCardResolution(card: card, usedValue: false)
            }
            return
        }

        snapshot.pendingPrompt = nil
        snapshot.awaitingPassTo = nil
    }

    func beginMomentumPinFromTrack(tokenID: UUID, role: PlayerRole) {
        guard case .momentumPinFromTrack(let promptRole, let tokens) = snapshot.pendingPrompt?.kind,
              promptRole == role,
              let token = tokens.first(where: { $0.token.id == tokenID })?.token
        else { return }

        snapshot.pendingPrompt = PendingPrompt(kind: .pinEvidence(token, role))
        snapshot.awaitingPassTo = role
    }

    func cancelMomentumPinFromTrack() {
        guard case .momentumPinFromTrack = snapshot.pendingPrompt?.kind else { return }
        snapshot.pendingPrompt = nil
        snapshot.awaitingPassTo = nil
        resumeAfterMomentumBonusIfNeeded()
    }

    func resumeAfterImmediatePin() {
        guard snapshot.pendingPrompt == nil else { return }
        checkEditorWin()
        checkNixonWin()
        guard snapshot.winner == nil else {
            snapshot.phase = .finished
            return
        }
        advanceTurn()
    }

    func cancelPrompt() {
        snapshot.pendingPrompt = nil
    }

    func clearPendingPrompt() {
        snapshot.pendingPrompt = nil
    }

    func pinEvidence(to node: BoardNodeID, token: EvidenceToken, by role: PlayerRole) {
        guard let index = snapshot.evidenceSpaces.firstIndex(where: { $0.nodeID == node && $0.tokenID == nil }) else { return }
        let space = snapshot.evidenceSpaces[index]
        guard space.allowedColors.contains(where: { token.colors.matches($0) }) else { return }
        snapshot.evidenceSpaces[index].tokenID = token.id
        snapshot.evidenceSpaces[index].isFaceUp = role == .editor
        snapshot.placedTokens[token.id] = token
        snapshot.log.append(GameLogEntry("\(role.title) закрепил улику на \(node.rawValue)."))
        if token.hasMomentumBonus {
            Self.moveMomentum(steps: 1, toward: role, snapshot: &snapshot)
        }
        checkEditorWin()
        if snapshot.phase == .evaluation, snapshot.pendingPrompt == nil {
            resumeAfterMomentumBonusIfNeeded()
        }
    }

    func continueEvaluation() {
        guard snapshot.phase == .evaluation else { return }
        runEvaluation()
    }

    // MARK: - Card resolution

    private func completeCardResolution(card: CardDefinition, usedValue: Bool) {
        finishCard(card, usedValue: usedValue)

        if let parentID = snapshot.pendingChainedParentCardID, card.id != parentID {
            snapshot.forcedPlayCardID = nil
            if let parent = snapshot.nixon.hand.first(where: { $0.id == parentID }) {
                snapshot.pendingChainedParentCardID = nil
                finishCard(parent, usedValue: false)
            } else {
                snapshot.pendingChainedParentCardID = nil
            }
        }

        if pauseIfImmediatePinRequired() { return }
        snapshot.pendingPrompt = nil
        checkEditorWin()
        checkNixonWin()
        guard snapshot.winner == nil else {
            snapshot.phase = .finished
            return
        }
        advanceTurn()
    }

    private func resolveHuntCard(_ hunt: CardDefinition) {
        Self.moveMomentum(steps: 2, toward: .nixon, snapshot: &snapshot)

        var nixon = snapshot.nixon
        if nixon.drawPile.isEmpty, !nixon.discard.isEmpty {
            nixon.drawPile = nixon.discard.shuffled()
            nixon.discard = []
        }

        guard !nixon.drawPile.isEmpty else {
            snapshot.log.append(GameLogEntry("Колода Никсона пуста — Хант разыгран частично."))
            completeCardResolution(card: hunt, usedValue: false)
            return
        }

        let top = nixon.drawPile.removeFirst()
        nixon.hand.append(top)
        snapshot.setPlayer(.nixon, nixon)
        snapshot.pendingChainedParentCardID = hunt.id
        snapshot.forcedPlayCardID = top.id
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseCardMode(top))
        snapshot.log.append(GameLogEntry("Хант: Никсон немедленно разыгрывает «\(top.name)»."))
    }

    private func reactionTrigger(for card: CardDefinition) -> ReactionTrigger? {
        if card.role == .nixon && card.kind == .conspirator {
            return .nixonConspiratorAction
        }
        if card.role == .editor && card.kind == .event && !card.isReaction {
            return .editorEventAction
        }
        return nil
    }

    private func openReactionWindowIfNeeded(
        trigger: ReactionTrigger,
        card: CardDefinition,
        checkpoint: GameSnapshot,
        evidenceContext: EvidenceMoveContext?
    ) -> Bool {
        let window = ReactionWindowState(
            trigger: trigger,
            triggeringCardID: card.id,
            triggeringRole: card.role,
            responder: card.role.opponent,
            checkpoint: ReactionCheckpoint.capture(from: checkpoint),
            evidenceContext: evidenceContext,
            isReReaction: false
        )
        let reactions = ReactionResolver.availableReactions(for: window, snapshot: snapshot)
        guard !reactions.isEmpty else { return false }
        snapshot.pendingPrompt = PendingPrompt(kind: .offerReaction(window, reactions))
        snapshot.awaitingPassTo = window.responder
        snapshot.log.append(GameLogEntry("\(window.responder.title) может сыграть реакцию."))
        return true
    }

    private func triggeringCard(id: String, role: PlayerRole) -> CardDefinition? {
        let player = snapshot.player(role)
        return player.hand.first { $0.id == id }
    }

    private func resumeAfterMomentumBonusIfNeeded() {
        if snapshot.phase == .evaluation {
            runEvaluation()
        }
    }

    // MARK: - Setup

    private func placeInitialSetupEvidence() {
        var tokens: [EvidenceToken] = []
        for _ in 0..<3 {
            guard !snapshot.evidenceBag.isEmpty else { break }
            tokens.append(snapshot.evidenceBag.removeFirst())
        }
        snapshot.pendingPrompt = PendingPrompt(kind: .nixonSetupEvidence(tokens))
        snapshot.awaitingPassTo = .nixon
        snapshot.setupEvidencePlaced = false
        snapshot.log.append(GameLogEntry("Никсон смотрит 3 улики перед размещением."))
    }

    private func endRoundImmediately() {
        for role in PlayerRole.allCases {
            var player = snapshot.player(role)
            player.discard.append(contentsOf: player.hand)
            player.hand = []
            snapshot.setPlayer(role, player)
        }
        snapshot.phase = .evaluation
        snapshot.evaluationStep = .returnNeutral
        snapshot.log.append(GameLogEntry("Раунд завершён досрочно — фаза оценки."))
        runEvaluation()
    }

    private func beginInitialPhase() {
        beginInitialPhase(placeNewEvidence: true)
    }

    private func beginInitialPhase(placeNewEvidence: Bool) {
        snapshot.phase = .initial
        drawForRound()
        snapshot.editorTurnsThisRound = 0
        snapshot.nixonTurnsThisRound = 0

        if placeNewEvidence {
            if placeRoundEvidencePeek() {
                return
            }
        }
        startCardPlayPhase()
    }

    /// Тянет до 3 улик из мешка и открывает экран просмотра Никсона. true = ждём подтверждения.
    @discardableResult
    private func placeRoundEvidencePeek() -> Bool {
        var tokens: [EvidenceToken] = []
        for _ in 0..<3 {
            guard !snapshot.evidenceBag.isEmpty else { break }
            tokens.append(snapshot.evidenceBag.removeFirst())
        }
        guard !tokens.isEmpty else {
            snapshot.log.append(GameLogEntry("В мешке нет улик для новой раскладки."))
            return false
        }
        snapshot.pendingPrompt = PendingPrompt(kind: .nixonSetupEvidence(tokens))
        snapshot.awaitingPassTo = .nixon
        snapshot.activeRole = .nixon
        snapshot.log.append(GameLogEntry("Никсон смотрит \(tokens.count) новые улики перед раундом."))
        return true
    }

    private func startCardPlayPhase() {
        snapshot.phase = .cardPlay
        snapshot.activeRole = snapshot.initiativeHolder
        snapshot.awaitingPassTo = snapshot.activeRole
        snapshot.log.append(GameLogEntry("Раунд \(snapshot.round): ход \(snapshot.activeRole.title)."))
    }

    private func drawForRound() {
        drawCards(role: .editor, count: snapshot.editorDrawSize)
        drawCards(role: .nixon, count: snapshot.nixonDrawSize)
        snapshot.log.append(GameLogEntry("Игроки взяли карты: редактор \(snapshot.editorDrawSize), Никсон \(snapshot.nixonDrawSize)."))
    }

    private func drawCards(role: PlayerRole, count: Int) {
        var player = snapshot.player(role)
        for _ in 0..<count {
            if player.drawPile.isEmpty, !player.discard.isEmpty {
                player.drawPile = player.discard.shuffled()
                player.discard = []
            }
            guard !player.drawPile.isEmpty else { break }
            player.hand.append(player.drawPile.removeFirst())
        }
        snapshot.setPlayer(role, player)
    }

    private func beginCardPhaseIfReady() {
        snapshot.phase = .cardPlay
    }

    // MARK: - Turn flow

    private func advanceTurn() {
        checkEditorWin()
        checkNixonWin()
        guard snapshot.winner == nil else {
            snapshot.phase = .finished
            return
        }

        if let resume = snapshot.pendingResumeRole {
            snapshot.pendingResumeRole = nil
            snapshot.activeRole = resume
            snapshot.awaitingPassTo = resume
            snapshot.log.append(GameLogEntry("Снова ход \(resume.title)."))
            return
        }

        let currentHand = snapshot.player(snapshot.activeRole).hand
        if currentHand.isEmpty {
            let opponentHand = snapshot.player(snapshot.activeRole.opponent).hand
            if opponentHand.isEmpty {
                snapshot.phase = .evaluation
                snapshot.evaluationStep = .returnNeutral
                snapshot.log.append(GameLogEntry("Фаза оценки раунда \(snapshot.round)."))
                runEvaluation()
                return
            }
            snapshot.activeRole = snapshot.activeRole.opponent
        } else {
            snapshot.activeRole = snapshot.activeRole.opponent
        }

        snapshot.awaitingPassTo = snapshot.activeRole
        snapshot.log.append(GameLogEntry("Ход \(snapshot.activeRole.title)."))
    }

    private func finishCard(_ card: CardDefinition, usedValue: Bool) {
        var player = snapshot.player(card.role)
        player.hand.removeAll { $0.id == card.id }
        if usedValue || card.kind == .journalist || card.kind == .conspirator {
            player.discard.append(card)
        } else {
            player.removed.append(card)
        }
        snapshot.setPlayer(card.role, player)
        if card.role == .nixon {
            snapshot.nixonTurnsThisRound += 1
        }
        if card.role == .editor {
            snapshot.editorTurnsThisRound += 1
        }
    }

    // MARK: - Evaluation

    private func runEvaluation() {
        while snapshot.phase == .evaluation && snapshot.winner == nil {
            guard let step = snapshot.evaluationStep else { break }
            switch step {
            case .returnNeutral:
                let neutral = snapshot.trackEvidence.filter { $0.position == 0 }
                for item in neutral {
                    snapshot.evidenceBag.append(item.token)
                }
                snapshot.trackEvidence.removeAll { $0.position == 0 }
                snapshot.evaluationStep = .awardInitiative
            case .awardInitiative:
                if !snapshot.initiativeClaimedThisRound {
                    if snapshot.initiativePosition == 0 {
                        let receiver = snapshot.initiativeHolder.opponent
                        gainInitiative(receiver)
                    } else if snapshot.initiativePosition < 0 {
                        gainInitiative(.editor)
                    } else if snapshot.initiativePosition > 0 {
                        gainInitiative(.nixon)
                    }
                }
                snapshot.evaluationStep = .awardMomentum
            case .awardMomentum:
                if !snapshot.momentumClaimedThisRound {
                    if snapshot.momentumPosition < 0 {
                        gainMomentum(.editor)
                    } else if snapshot.momentumPosition > 0 {
                        gainMomentum(.nixon)
                    } else {
                        snapshot.momentumSupply += 1
                    }
                }
                if snapshot.pendingPrompt != nil { return }
                snapshot.evaluationStep = .resetTrack
            case .resetTrack:
                snapshot.initiativePosition = 0
                if snapshot.momentumSupply > 0 {
                    snapshot.momentumSupply -= 1
                    snapshot.momentumPosition = 0
                } else {
                    snapshot.winner = .nixon
                    snapshot.phase = .finished
                    snapshot.log.append(GameLogEntry("Никсон победил: жетоны влияния закончились."))
                    return
                }
                snapshot.initiativeClaimedThisRound = false
                snapshot.momentumClaimedThisRound = false
                snapshot.evaluationStep = .awardEvidence
            case .awardEvidence:
                awardEvidenceTokens(startingWith: snapshot.initiativeHolder)
                return
            }
        }
    }

    private func awardEvidenceTokens(startingWith role: PlayerRole) {
        let order: [PlayerRole] = role == .editor ? [.editor, .nixon] : [.nixon, .editor]
        snapshot.pendingEvaluationTokens = []
        for playerRole in order {
            let side = playerRole == .editor ? -1 : 1
            let gained = snapshot.trackEvidence.filter { $0.position * side > 0 }
            snapshot.trackEvidence.removeAll { token in gained.contains(where: { $0.id == token.id }) }
            for item in gained {
                snapshot.pendingEvaluationTokens.append(PendingEvaluationToken(role: playerRole, token: item.token))
            }
        }
        promptNextEvaluationPin()
    }

    func promptNextEvaluationPin() {
        while let next = snapshot.pendingEvaluationTokens.first {
            let hasSpace = snapshot.evidenceSpaces.contains { space in
                space.tokenID == nil && space.allowedColors.contains(where: { next.token.colors.matches($0) })
            }
            if hasSpace {
                snapshot.pendingPrompt = PendingPrompt(kind: .evaluationPin(next.role, [next.token]))
                snapshot.awaitingPassTo = next.role
                snapshot.log.append(GameLogEntry("\(next.role.title) закрепляет улику."))
                return
            }
            snapshot.log.append(GameLogEntry("\(next.role.title): нет клетки для улики — сброс."))
            snapshot.pendingEvaluationTokens.removeFirst()
        }

        snapshot.pendingPrompt = nil
        snapshot.round += 1
        snapshot.editorEventsBlocked = false
        snapshot.nixonTurnsThisRound = 0
        snapshot.editorTurnsThisRound = 0
        snapshot.evaluationStep = nil
        checkEditorWin()
        checkNixonWin()
        guard snapshot.winner == nil else { return }
        beginInitialPhase()
    }

    func completeEvaluationPin() {
        guard !snapshot.pendingEvaluationTokens.isEmpty else { return }
        snapshot.pendingEvaluationTokens.removeFirst()
        promptNextEvaluationPin()
    }

    /// Нет клетки под цвет: улика сбрасывается, партия не зависает.
    func skipPinBecauseNoSpace() {
        switch snapshot.pendingPrompt?.kind {
        case .evaluationPin:
            snapshot.log.append(GameLogEntry("Нет клетки — улика сброшена без закрепления."))
            completeEvaluationPin()
        case .pinEvidence:
            snapshot.log.append(GameLogEntry("Нет клетки — улика сброшена без закрепления."))
            snapshot.pendingPrompt = nil
            snapshot.awaitingPassTo = nil
            if snapshot.phase == .cardPlay {
                resumeAfterImmediatePin()
            } else {
                resumeAfterMomentumBonusIfNeeded()
            }
        default:
            break
        }
    }

    private func gainInitiative(_ role: PlayerRole) {
        snapshot.initiativeHolder = role
        snapshot.initiativePosition = 0
        snapshot.initiativeClaimedThisRound = true
        snapshot.editorDrawSize = role == .editor ? 5 : 4
        snapshot.nixonDrawSize = role == .nixon ? 5 : 4
        snapshot.log.append(GameLogEntry("Инициатива у \(role.title)."))
    }

    private func gainMomentum(_ role: PlayerRole) {
        var player = snapshot.player(role)
        if role == .editor && player.momentumCount >= 4 {
            snapshot.momentumSupply += 1
            snapshot.log.append(GameLogEntry("Влияние редактора сброшено — нет места на карте."))
        } else if role == .nixon {
            player.momentumCount += 1
            snapshot.setPlayer(role, player)
            snapshot.log.append(GameLogEntry("Никсон получил влияние (\(player.momentumCount)/5)."))
            if player.momentumCount >= 5 {
                snapshot.winner = .nixon
                snapshot.phase = .finished
            }
        } else {
            player.momentumCount += 1
            snapshot.setPlayer(role, player)
            applyEditorMomentumBonus(slot: player.momentumCount)
            if snapshot.pendingPrompt != nil {
                snapshot.momentumPosition = 0
                snapshot.momentumClaimedThisRound = true
                return
            }
        }
        snapshot.momentumPosition = 0
        snapshot.momentumClaimedThisRound = true
    }

    private func applyEditorMomentumBonus(slot: Int) {
        switch slot {
        case 1:
            drawCards(role: .editor, count: 1)
            snapshot.log.append(GameLogEntry("Бонус влияния редактора: +1 карта."))
        case 2:
            let peek = Array(snapshot.nixon.drawPile.prefix(3))
            snapshot.pendingPrompt = PendingPrompt(kind: .peekOpponentDeck(.nixon, peek))
            snapshot.awaitingPassTo = .editor
            snapshot.log.append(GameLogEntry("Бонус влияния редактора: верхние 3 карты колоды Никсона."))
        case 3:
            let options = snapshot.trackEvidence
            if options.isEmpty {
                snapshot.log.append(GameLogEntry("Бонус влияния редактора: на треке нет улик."))
            } else if options.count == 1, let item = options.first {
                Self.moveEvidence(
                    id: item.id,
                    steps: 1,
                    toward: .editor,
                    flipFaceUp: !item.isFaceUp,
                    snapshot: &snapshot
                )
                snapshot.log.append(GameLogEntry("Бонус влияния редактора: улика сдвинута на 1."))
            } else {
                snapshot.pendingPrompt = PendingPrompt(kind: .chooseTrackEvidence(.editor, 1, options))
                snapshot.awaitingPassTo = .editor
                snapshot.log.append(GameLogEntry("Бонус влияния редактора: выберите улику для сдвига."))
            }
        case 4:
            let onTrack = snapshot.trackEvidence
            if onTrack.isEmpty {
                snapshot.log.append(GameLogEntry("Бонус влияния редактора: на треке нет улик."))
            } else {
                snapshot.pendingPrompt = PendingPrompt(kind: .momentumPinFromTrack(.editor, onTrack))
                snapshot.awaitingPassTo = .editor
                snapshot.log.append(GameLogEntry("Бонус влияния редактора: закрепите улику с трека."))
            }
        default:
            break
        }
    }

    // MARK: - Win checks

    private func checkEditorWin() {
        let count = BoardLayout.connectedInformantCount(in: snapshot)
        if count >= 2 {
            snapshot.winner = .editor
            snapshot.phase = .finished
            snapshot.log.append(GameLogEntry("Редактор победил: \(count) информанта связаны с Никсоном."))
        }
    }

    private func checkNixonWin() {
        if snapshot.nixon.momentumCount >= 5 {
            snapshot.winner = .nixon
            snapshot.phase = .finished
            snapshot.log.append(GameLogEntry("Никсон победил: 5 влияний."))
        }
    }

    // MARK: - Value helpers

    func valueMoveOptions(for card: CardDefinition, role: PlayerRole) -> [ValueMoveOption] {
        var options: [ValueMoveOption] = []
        options.append(ValueMoveOption(label: "Инициатива (\(snapshot.initiativePosition))", target: .initiative))
        options.append(ValueMoveOption(label: "Влияние (\(snapshot.momentumPosition))", target: .momentum))

        let requiredColors: [EvidenceColor]
        if card.isJoker {
            requiredColors = EvidenceColor.allCases
        } else {
            requiredColors = card.valueColors
        }

        for track in snapshot.trackEvidence {
            let colorText = track.token.colors.secondary.map { "\(track.token.colors.primary.label)/\($0.label)" } ?? track.token.colors.primary.label
            let visible = track.isFaceUp || role == .nixon
            if visible {
                if requiredColors.contains(where: { track.token.colors.matches($0) }) {
                    options.append(ValueMoveOption(label: "Улика \(colorText) @ \(track.position)", target: .evidence(track.id)))
                }
            } else if role == .editor {
                for color in requiredColors {
                    options.append(ValueMoveOption(
                        label: "Спросить улику \(color.label) (тайная)",
                        target: .hiddenEvidence(track.id, color)
                    ))
                }
            }
        }
        return options
    }

    // MARK: - Token movement

    static func moveInitiative(steps: Int, toward role: PlayerRole, snapshot: inout GameSnapshot) {
        let direction = role == .editor ? -1 : 1
        let newPos = clamp(snapshot.initiativePosition + direction * steps)
        if reachedGoal(newPos, role: role) {
            gainInitiativeToken(role, snapshot: &snapshot)
        } else {
            snapshot.initiativePosition = newPos
        }
        snapshot.log.append(GameLogEntry("Инициатива сдвинута к стороне \(role.title)."))
    }

    static func moveMomentum(steps: Int, toward role: PlayerRole, snapshot: inout GameSnapshot) {
        let direction = role == .editor ? -1 : 1
        let newPos = clamp(snapshot.momentumPosition + direction * steps)
        if reachedGoal(newPos, role: role) {
            gainMomentumToken(role, snapshot: &snapshot)
        } else {
            snapshot.momentumPosition = newPos
        }
        snapshot.log.append(GameLogEntry("Влияние сдвинуто к стороне \(role.title)."))
    }

    static func moveMomentumToSpace(_ space: Int, toward role: PlayerRole, snapshot: inout GameSnapshot) {
        let target = role == .editor ? -space : space
        if reachedGoal(target, role: role) {
            gainMomentumToken(role, snapshot: &snapshot)
        } else {
            snapshot.momentumPosition = target
        }
        snapshot.log.append(GameLogEntry("Влияние на позицию \(space) (\(role.title))."))
    }

    static func moveEvidence(id: UUID, steps: Int, toward role: PlayerRole, flipFaceUp: Bool, snapshot: inout GameSnapshot) {
        guard let index = snapshot.trackEvidence.firstIndex(where: { $0.id == id }) else { return }
        if flipFaceUp { snapshot.trackEvidence[index].isFaceUp = true }
        let direction = role == .editor ? -1 : 1
        let newPos = clamp(snapshot.trackEvidence[index].position + direction * steps)
        if reachedGoal(newPos, role: role) {
            let token = snapshot.trackEvidence.remove(at: index).token
            snapshot.pendingPrompt = PendingPrompt(kind: .pinEvidence(token, role))
            snapshot.awaitingPassTo = role
            snapshot.log.append(GameLogEntry("\(role.title) немедленно закрепляет улику с трека."))
        } else {
            snapshot.trackEvidence[index].position = newPos
            if snapshot.trackEvidence[index].token.hasMomentumBonus {
                moveMomentum(steps: 1, toward: role, snapshot: &snapshot)
            }
        }
    }

    private static func clamp(_ value: Int) -> Int {
        max(-BoardLayout.maxTrackDistance, min(BoardLayout.maxTrackDistance, value))
    }

    private static func reachedGoal(_ position: Int, role: PlayerRole) -> Bool {
        role == .editor ? position <= -BoardLayout.maxTrackDistance : position >= BoardLayout.maxTrackDistance
    }

    private static func gainInitiativeToken(_ role: PlayerRole, snapshot: inout GameSnapshot) {
        snapshot.initiativeHolder = role
        snapshot.initiativePosition = 0
        snapshot.initiativeClaimedThisRound = true
        snapshot.editorDrawSize = role == .editor ? 5 : 4
        snapshot.nixonDrawSize = role == .nixon ? 5 : 4
    }

    private static func gainMomentumToken(_ role: PlayerRole, snapshot: inout GameSnapshot) {
        snapshot.momentumClaimedThisRound = true
        snapshot.momentumPosition = 0
        var player = snapshot.player(role)
        if role == .nixon {
            player.momentumCount += 1
            snapshot.setPlayer(role, player)
            if player.momentumCount >= 5 {
                snapshot.winner = .nixon
                snapshot.phase = .finished
                snapshot.log.append(GameLogEntry("Никсон победил: 5 влияний."))
            }
        } else if player.momentumCount < 4 {
            player.momentumCount += 1
            snapshot.setPlayer(role, player)
            applyEditorMomentumBonus(slot: player.momentumCount, snapshot: &snapshot)
            if snapshot.pendingPrompt != nil {
                snapshot.momentumClaimedThisRound = true
                snapshot.momentumPosition = 0
                return
            }
        } else {
            snapshot.momentumSupply += 1
            snapshot.log.append(GameLogEntry("Влияние редактора сброшено — нет места на карте."))
        }
    }

    private static func applyEditorMomentumBonus(slot: Int, snapshot: inout GameSnapshot) {
        switch slot {
        case 1:
            drawCards(role: .editor, count: 1, snapshot: &snapshot)
            snapshot.log.append(GameLogEntry("Бонус влияния редактора: +1 карта."))
        case 2:
            let peek = Array(snapshot.nixon.drawPile.prefix(3))
            snapshot.pendingPrompt = PendingPrompt(kind: .peekOpponentDeck(.nixon, peek))
            snapshot.awaitingPassTo = .editor
            snapshot.log.append(GameLogEntry("Бонус влияния редактора: верхние 3 карты колоды Никсона."))
        case 3:
            let options = snapshot.trackEvidence
            if options.isEmpty {
                snapshot.log.append(GameLogEntry("Бонус влияния редактора: на треке нет улик."))
            } else if options.count == 1, let item = options.first {
                moveEvidence(id: item.id, steps: 1, toward: .editor, flipFaceUp: !item.isFaceUp, snapshot: &snapshot)
                snapshot.log.append(GameLogEntry("Бонус влияния редактора: улика сдвинута на 1."))
            } else {
                snapshot.pendingPrompt = PendingPrompt(kind: .chooseTrackEvidence(.editor, 1, options))
                snapshot.awaitingPassTo = .editor
                snapshot.log.append(GameLogEntry("Бонус влияния редактора: выберите улику для сдвига."))
            }
        case 4:
            let onTrack = snapshot.trackEvidence
            if onTrack.isEmpty {
                snapshot.log.append(GameLogEntry("Бонус влияния редактора: на треке нет улик."))
            } else {
                snapshot.pendingPrompt = PendingPrompt(kind: .momentumPinFromTrack(.editor, onTrack))
                snapshot.awaitingPassTo = .editor
                snapshot.log.append(GameLogEntry("Бонус влияния редактора: закрепите улику с трека."))
            }
        default:
            break
        }
    }

    private static func drawCards(role: PlayerRole, count: Int, snapshot: inout GameSnapshot) {
        var player = snapshot.player(role)
        for _ in 0..<count {
            if player.drawPile.isEmpty {
                if player.discard.isEmpty { break }
                player.drawPile = player.discard.shuffled()
                player.discard = []
            }
            guard !player.drawPile.isEmpty else { break }
            player.hand.append(player.drawPile.removeFirst())
        }
        snapshot.setPlayer(role, player)
    }

    private func pauseIfImmediatePinRequired() -> Bool {
        guard case .pinEvidence(_, let role) = snapshot.pendingPrompt?.kind else { return false }
        snapshot.awaitingPassTo = role
        checkEditorWin()
        checkNixonWin()
        if snapshot.winner != nil {
            snapshot.phase = .finished
            snapshot.pendingPrompt = nil
        }
        return snapshot.pendingPrompt != nil
    }
}

