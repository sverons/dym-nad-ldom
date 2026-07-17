import Foundation
import Combine

@MainActor
final class GameStore: ObservableObject {
    @Published private(set) var engine = GameEngine()
    @Published var showHome = true
    @Published var showLobby = false
    @Published var selectedRole: PlayerRole = .editor
    @Published var playMode: PlayMode = .passAndPlay

    let multiplayer = LocalMultiplayerService()

    private var cancellables = Set<AnyCancellable>()

    init() {
        engine.objectWillChange
            .sink { [weak self] _ in self?.objectWillChange.send() }
            .store(in: &cancellables)

        multiplayer.onMessage = { [weak self] message, _ in
            self?.handleNetworkMessage(message)
        }
    }

    var snapshot: GameSnapshot { engine.snapshot }
    var localRole: PlayerRole { snapshot.humanRole }

    var isNetworkGame: Bool {
        if case .localWifi = playMode { return true }
        return false
    }

    var isHost: Bool {
        if case .localWifi(let host) = playMode { return host }
        return false
    }

    var canControlGame: Bool {
        guard !showHome else { return false }
        if case .passAndPlay = playMode {
            // Пока ждём передачи телефона — никто не играет.
            return snapshot.awaitingPassTo == nil
        }
        if let passRole = snapshot.awaitingPassTo, passRole != localRole {
            return false
        }
        if let prompt = snapshot.pendingPrompt {
            switch prompt.kind {
            case .evaluationPin(let role, _), .pinEvidence(_, let role):
                return role == localRole
            case .offerReaction(let window, _):
                return window.responder == localRole
            case .peekOpponentDeck(let role, _), .chooseTrackEvidence(let role, _, _), .momentumPinFromTrack(let role, _),
                 .chooseTrackEvidenceMulti(let role, _, _, _, _):
                return role == localRole
            case .chooseBoardEvidence(let card), .chooseRemovedCard(let card),
                 .chooseInformant(let card, _, _, _), .chooseInitiativeOrMomentum(let card, _):
                return card.role == localRole
            case .gambitChoice:
                return localRole == .nixon
            case .nixonHiddenEvidenceAsk, .nixonHiddenEvidencePick:
                return localRole == .nixon
            case .nixonSetupEvidence:
                return localRole == .nixon
            default:
                return snapshot.activeRole == localRole
            }
        }
        return snapshot.activeRole == localRole
    }

    // MARK: - Navigation

    func openLobby(asHost: Bool) {
        showLobby = true
        if asHost {
            multiplayer.startHosting()
        } else {
            multiplayer.startBrowsing()
        }
    }

    func closeLobby() {
        showLobby = false
        multiplayer.stop()
    }

    func startGame() {
        playMode = .passAndPlay
        engine.startNewGame(humanRole: selectedRole, connectionMode: .sameDevice)
        showHome = false
        showLobby = false
    }

    func startNetworkGameAsHost() {
        guard multiplayer.isConnected else { return }
        playMode = .localWifi(isHost: true)
        engine.startNewGame(humanRole: selectedRole, connectionMode: .wifi)
        let guestState = snapshot.sanitized(for: selectedRole.opponent)
        multiplayer.send(.gameStart(hostRole: selectedRole, guestState: guestState))
        showHome = false
        showLobby = false
    }

    func newGame() {
        multiplayer.stop()
        playMode = .passAndPlay
        showHome = true
        showLobby = false
    }

    // MARK: - Player actions

    func acknowledgePass() {
        performOrSend(.acknowledgePass) {
            engine.acknowledgePass()
            if isHost { broadcastState() }
        }
    }

    func selectCard(_ card: CardDefinition) {
        guard canControlGame else { return }
        performOrSend(.selectCard(cardID: card.id)) {
            engine.selectCard(card)
            if isHost { broadcastState() }
        }
    }

    func chooseValue(for card: CardDefinition) {
        guard canControlGame else { return }
        performOrSend(.chooseValue(cardID: card.id)) {
            engine.chooseValue(for: card)
            if isHost { broadcastState() }
        }
    }

    func chooseAction(for card: CardDefinition) {
        guard canControlGame else { return }
        performOrSend(.chooseAction(cardID: card.id)) {
            engine.chooseAction(for: card)
            if isHost { broadcastState() }
        }
    }

    func performValueMove(card: CardDefinition, target: ValueMoveOption.Target) {
        guard canControlGame else { return }
        performOrSend(.performValueMove(cardID: card.id, target: remoteTarget(from: target))) {
            engine.performValueMove(card: card, target: target)
            if isHost { broadcastState() }
        }
    }

    func confirmAction(for card: CardDefinition) {
        guard canControlGame else { return }
        performOrSend(.confirmAction(cardID: card.id)) {
            engine.confirmAction(for: card)
            if isHost { broadcastState() }
        }
    }

    func cancelPrompt() {
        guard canControlGame else { return }
        performOrSend(.cancelPrompt) {
            engine.cancelPrompt()
            if isHost { broadcastState() }
        }
    }

    func declineReaction() {
        guard canControlGame else { return }
        performOrSend(.declineReaction) {
            engine.declineReaction()
            if isHost { broadcastState() }
        }
    }

    func playReaction(_ card: CardDefinition) {
        guard canControlGame else { return }
        performOrSend(.playReaction(cardID: card.id)) {
            engine.playReaction(card)
            if isHost { broadcastState() }
        }
    }

    func completePeekDeck() {
        guard canControlGame else { return }
        performOrSend(.completePeekDeck) {
            engine.completePeekDeck()
            if isHost { broadcastState() }
        }
    }

    func performTrackEvidenceMove(evidenceID: UUID, steps: Int, role: PlayerRole) {
        guard canControlGame else { return }
        performOrSend(.performTrackEvidenceMove(evidenceID: evidenceID, steps: steps)) {
            engine.performTrackEvidenceMove(evidenceID: evidenceID, steps: steps, role: role)
            if isHost { broadcastState() }
        }
    }

    func beginMomentumPinFromTrack(tokenID: UUID, role: PlayerRole) {
        guard canControlGame else { return }
        performOrSend(.beginMomentumPinFromTrack(tokenID: tokenID)) {
            engine.beginMomentumPinFromTrack(tokenID: tokenID, role: role)
            if isHost { broadcastState() }
        }
    }

    func cancelMomentumPinFromTrack() {
        guard canControlGame else { return }
        performOrSend(.cancelMomentumPinFromTrack) {
            engine.cancelMomentumPinFromTrack()
            if isHost { broadcastState() }
        }
    }

    func answerHiddenEvidence(hasColor: Bool, card: CardDefinition, color: EvidenceColor, evidenceID: UUID, steps: Int) {
        guard canControlGame else { return }
        engine.answerHiddenEvidence(hasColor: hasColor, card: card, color: color, evidenceID: evidenceID, steps: steps)
        if isHost { broadcastState() }
    }

    func pickHiddenEvidenceToReveal(evidenceID: UUID, card: CardDefinition, steps: Int) {
        guard canControlGame else { return }
        engine.pickHiddenEvidenceToReveal(evidenceID: evidenceID, card: card, steps: steps)
        if isHost { broadcastState() }
    }

    func chooseInitiativeOrMomentum(card: CardDefinition, useInitiative: Bool) {
        guard canControlGame else { return }
        engine.chooseInitiativeOrMomentum(card: card, useInitiative: useInitiative)
        if isHost { broadcastState() }
    }

    func chooseGambitMomentum(card: CardDefinition) {
        guard canControlGame else { return }
        engine.chooseGambitMomentum(card: card)
        if isHost { broadcastState() }
    }

    func chooseGambitSacrifice(conspirator: CardDefinition, gambit: CardDefinition) {
        guard canControlGame else { return }
        engine.chooseGambitSacrifice(conspirator: conspirator, gambit: gambit)
        if isHost { broadcastState() }
    }

    func confirmNixonSetupEvidence() {
        guard canControlGame else { return }
        engine.confirmNixonSetupEvidence()
        if isHost { broadcastState() }
    }

    func chooseRemovedCardAction(systemCard: CardDefinition, removed: CardDefinition) {
        guard canControlGame else { return }
        engine.chooseRemovedCardAction(systemCard: systemCard, removed: removed)
        if isHost { broadcastState() }
    }

    func chooseInformantAction(card: CardDefinition, informant: InformantID, initiativeSteps: Int) {
        guard canControlGame else { return }
        engine.chooseInformantAction(card: card, informant: informant, initiativeSteps: initiativeSteps)
        if isHost { broadcastState() }
    }

    func chooseBoardEvidenceAction(card: CardDefinition, node: BoardNodeID) {
        guard canControlGame else { return }
        engine.chooseBoardEvidenceAction(card: card, node: node)
        if isHost { broadcastState() }
    }

    func clearPromptAfterImmediatePin() {
        engine.clearPendingPrompt()
        if isHost { broadcastState() }
    }

    func pinEvidence(to node: BoardNodeID, token: EvidenceToken, by role: PlayerRole) {
        // Pass-and-play: после передачи телефона canControlGame уже true.
        // Wi‑Fi: canControlGame сверяет роль pin-диалога с localRole.
        guard canControlGame else { return }
        let wasImmediatePin = {
            if case .pinEvidence = snapshot.pendingPrompt?.kind { return true }
            return false
        }()
        performOrSend(.pinEvidence(nodeID: node.rawValue, tokenID: token.id)) {
            engine.pinEvidence(to: node, token: token, by: role)
            if wasImmediatePin {
                engine.clearPendingPrompt()
                if engine.snapshot.phase == .cardPlay {
                    engine.resumeAfterImmediatePin()
                } else {
                    engine.completePeekDeck()
                }
            }
            if case .evaluationPin = engine.snapshot.pendingPrompt?.kind {
                engine.completeEvaluationPin()
            }
            if isHost { broadcastState() }
        }
    }

    func completeEvaluationPinFlow() {
        guard canControlGame else { return }
        performOrSend(.completeEvaluationPin) {
            engine.completeEvaluationPin()
            if isHost { broadcastState() }
        }
    }

    func skipPinBecauseNoSpace() {
        guard canControlGame else { return }
        engine.skipPinBecauseNoSpace()
        if isHost { broadcastState() }
    }

    func visibleHand(for viewer: PlayerRole) -> [CardDefinition] {
        snapshot.player(viewer).hand
    }

    func canViewBoard(for viewer: PlayerRole) -> Bool {
        if isNetworkGame {
            return snapshot.awaitingPassTo == nil || snapshot.awaitingPassTo == viewer
        }
        return snapshot.awaitingPassTo == nil || snapshot.awaitingPassTo == viewer
    }

    // MARK: - Network

    private func performOrSend(_ action: RemotePlayerAction, localApply: () -> Void) {
        switch playMode {
        case .passAndPlay:
            localApply()
        case .localWifi(let host):
            if host {
                localApply()
            } else {
                multiplayer.send(.action(action))
            }
        }
    }

    private func broadcastState() {
        guard case .localWifi(true) = playMode else { return }
        let guestView = snapshot.sanitized(for: snapshot.humanRole.opponent)
        multiplayer.send(.stateUpdate(guestView))
    }

    private func handleNetworkMessage(_ message: NetworkMessage) {
        switch message {
        case .hello:
            break

        case .gameStart(_, let guestState):
            playMode = .localWifi(isHost: false)
            engine.applySyncedSnapshot(guestState)
            showHome = false
            showLobby = false

        case .stateUpdate(let remoteSnapshot):
            if isHost {
                return
            }
            engine.applySyncedSnapshot(remoteSnapshot)

        case .action(let action):
            guard isHost else { return }
            applyRemoteAction(action, playerRole: snapshot.humanRole.opponent)
            broadcastState()

        case .error:
            break
        }
    }

    private func applyRemoteAction(_ action: RemotePlayerAction, playerRole: PlayerRole) {
        guard canRemotePlayerAct(playerRole) else { return }
        switch action {
        case .acknowledgePass:
            engine.acknowledgePass()
        case .selectCard(let cardID):
            guard let card = card(withID: cardID, role: playerRole) else { return }
            engine.selectCard(card)
        case .chooseValue(let cardID):
            guard let card = card(withID: cardID, role: playerRole) else { return }
            engine.chooseValue(for: card)
        case .chooseAction(let cardID):
            guard let card = card(withID: cardID, role: playerRole) else { return }
            engine.chooseAction(for: card)
        case .performValueMove(let cardID, let target):
            guard let card = card(withID: cardID, role: playerRole) else { return }
            engine.performValueMove(card: card, target: localTarget(from: target))
        case .confirmAction(let cardID):
            guard let card = card(withID: cardID, role: playerRole) else { return }
            engine.confirmAction(for: card)
        case .cancelPrompt:
            engine.cancelPrompt()
        case .declineReaction:
            engine.declineReaction()
        case .playReaction(let cardID):
            guard let card = reactionCard(withID: cardID, role: playerRole) else { return }
            engine.playReaction(card)
        case .completePeekDeck:
            engine.completePeekDeck()
        case .performTrackEvidenceMove(let evidenceID, let steps):
            engine.performTrackEvidenceMove(evidenceID: evidenceID, steps: steps, role: playerRole)
        case .beginMomentumPinFromTrack(let tokenID):
            engine.beginMomentumPinFromTrack(tokenID: tokenID, role: playerRole)
        case .cancelMomentumPinFromTrack:
            engine.cancelMomentumPinFromTrack()
        case .pinEvidence(let nodeID, let tokenID):
            guard let node = BoardNodeID(rawValue: nodeID),
                  let token = token(withID: tokenID)
            else { return }
            let wasImmediatePin = {
                if case .pinEvidence = snapshot.pendingPrompt?.kind { return true }
                return false
            }()
            engine.pinEvidence(to: node, token: token, by: playerRole)
            if wasImmediatePin {
                engine.clearPendingPrompt()
                if engine.snapshot.phase == .cardPlay {
                    engine.resumeAfterImmediatePin()
                } else {
                    engine.completePeekDeck()
                }
            }
            if case .evaluationPin = engine.snapshot.pendingPrompt?.kind {
                engine.completeEvaluationPin()
            }
        case .completeEvaluationPin:
            engine.completeEvaluationPin()
        }
    }

    private func card(withID id: String, role: PlayerRole) -> CardDefinition? {
        let player = snapshot.player(role)
        return player.hand.first { $0.id == id }
    }

    private func reactionCard(withID id: String, role: PlayerRole) -> CardDefinition? {
        card(withID: id, role: role)
    }

    private func token(withID id: UUID) -> EvidenceToken? {
        if let token = snapshot.placedTokens[id] {
            return token
        }
        if let token = snapshot.pendingEvaluationTokens.first(where: { $0.token.id == id })?.token {
            return token
        }
        if case .pinEvidence(let token, _) = snapshot.pendingPrompt?.kind, token.id == id {
            return token
        }
        if case .evaluationPin(_, let tokens) = snapshot.pendingPrompt?.kind,
           let token = tokens.first(where: { $0.id == id }) {
            return token
        }
        return snapshot.trackEvidence.first(where: { $0.id == id })?.token
    }

    private func canRemotePlayerAct(_ role: PlayerRole) -> Bool {
        if let passRole = snapshot.awaitingPassTo, passRole != role {
            return false
        }
        if let prompt = snapshot.pendingPrompt {
            switch prompt.kind {
            case .evaluationPin(let promptRole, _), .pinEvidence(_, let promptRole):
                return promptRole == role
            case .offerReaction(let window, _):
                return window.responder == role
            case .peekOpponentDeck(let promptRole, _), .chooseTrackEvidence(let promptRole, _, _), .momentumPinFromTrack(let promptRole, _),
                 .chooseTrackEvidenceMulti(let promptRole, _, _, _, _):
                return promptRole == role
            case .chooseBoardEvidence(let card), .chooseRemovedCard(let card),
                 .chooseInformant(let card, _, _, _), .chooseInitiativeOrMomentum(let card, _):
                return card.role == role
            case .gambitChoice:
                return role == .nixon
            case .nixonHiddenEvidenceAsk, .nixonHiddenEvidencePick, .nixonSetupEvidence:
                return role == .nixon
            default:
                return snapshot.activeRole == role
            }
        }
        return snapshot.activeRole == role
    }

    private func remoteTarget(from target: ValueMoveOption.Target) -> RemoteValueTarget {
        switch target {
        case .initiative: return .initiative
        case .momentum: return .momentum
        case .evidence(let id): return .evidence(id)
        case .hiddenEvidence(let id, let color): return .hiddenEvidence(id, color)
        }
    }

    private func localTarget(from target: RemoteValueTarget) -> ValueMoveOption.Target {
        switch target {
        case .initiative: return .initiative
        case .momentum: return .momentum
        case .evidence(let id): return .evidence(id)
        case .hiddenEvidence(let id, let color): return .hiddenEvidence(id, color)
        }
    }
}
