import Foundation

enum CardApplyOutcome: Equatable {
    case completed
    case paused
    case extraTurn(PlayerRole)
    case endRound
}

@MainActor
enum CardActionResolver {
    static func canPlayAction(_ card: CardDefinition, snapshot: GameSnapshot) -> Bool {
        if card.isReaction { return false }
        if card.id == "n13" && snapshot.activeRole == .nixon && snapshot.nixonTurnsThisRound == 0 {
            return false
        }
        if card.role == .editor && snapshot.editorEventsBlocked && card.kind == .event {
            return false
        }
        return true
    }

    @discardableResult
    static func apply(_ card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        switch card.id {
        case "e01": return pinInformant(.dean, faceUp: true, card: card, bonus: 1, snapshot: &snapshot)
        case "e08": return pinInformant(.butterfield, faceUp: true, card: card, bonus: 2, snapshot: &snapshot)
        case "e09": return pinInformant(.sloan, faceUp: true, card: card, bonus: 1, snapshot: &snapshot)
        case "e10": return pinInformant(.mitchell, faceUp: true, card: card, bonus: 2, snapshot: &snapshot)
        case "e11": return pinInformant(.woods, faceUp: true, card: card, bonus: 1, snapshot: &snapshot)
        case "e12": return pinInformant(.mccord, faceUp: true, card: card, bonus: 2, snapshot: &snapshot)
        case "e13": return pinInformant(.baldwin, faceUp: true, card: card, bonus: 1, snapshot: &snapshot)
        case "e14": return applyDeepThroat(card: card, snapshot: &snapshot)
        case "e15": return drawAndPinFromBag(role: .editor, snapshot: &snapshot)
        case "e16": return applyMissingTape(card: card, snapshot: &snapshot)
        case "e17": return applyWatergateComplex(card: card, snapshot: &snapshot)
        case "e18": return applyWhoPaysLawyers(card: card, snapshot: &snapshot)
        case "e19": return applySmokingGun(card: card, snapshot: &snapshot)
        case "e20": return applySaturdayMassacre(card: card, snapshot: &snapshot)
        case "e03": return applyWoodward(card: card, snapshot: &snapshot)
        case "e04": return applyBernstein(card: card, snapshot: &snapshot)
        case "e07": return applySystemWorked(card: card, snapshot: &snapshot)
        case "n02": return returnFaceUpEvidenceToBag(card: card, snapshot: &snapshot)
        case "n03": return applyColson(card: card, snapshot: &snapshot)
        case "n04": return moveAllEvidence(steps: 1, role: .nixon, snapshot: &snapshot)
        case "n05": return .completed
        case "n07": return applyEhrlichman(card: card, snapshot: &snapshot)
        case "n08": return applyGemstone(card: card, snapshot: &snapshot)
        case "n09": return pinInformant(.butterfield, faceUp: false, card: card, bonus: 2, snapshot: &snapshot)
        case "n10": return applyCancer(card: card, snapshot: &snapshot)
        case "n11": return pinInformant(.dean, faceUp: false, card: card, bonus: 1, snapshot: &snapshot)
        case "n12": return pinInformant(.mitchell, faceUp: false, card: card, bonus: 2, snapshot: &snapshot)
        case "n13": return applyBrilliantMood(card: card, snapshot: &snapshot)
        case "n14": return applyPresidentSpeech(card: card, snapshot: &snapshot)
        case "n15": return applyZiegler(card: card, snapshot: &snapshot)
        case "n16": return pinInformant(.mccord, faceUp: false, card: card, bonus: 2, snapshot: &snapshot)
        case "n17": return pinInformant(.sloan, faceUp: false, card: card, bonus: 1, snapshot: &snapshot)
        case "n18": return pinInformant(.woods, faceUp: false, card: card, bonus: 1, snapshot: &snapshot)
        case "n19": return applyElection1972(card: card, snapshot: &snapshot)
        case "n20": return pinInformant(.baldwin, faceUp: false, card: card, bonus: 1, snapshot: &snapshot)
        case "n01": return applyGambitPrompt(card: card, snapshot: &snapshot)
        default:
            snapshot.log.append(GameLogEntry("Действие «\(card.name)» отмечено выполненным."))
            return .completed
        }
    }

    static func applyGambitMomentum(card: CardDefinition, snapshot: inout GameSnapshot) {
        GameEngine.moveMomentumToSpace(5, toward: .nixon, snapshot: &snapshot)
        snapshot.log.append(GameLogEntry("Гамбит: влияние на позицию 5."))
    }

    static func applyGambitSacrifice(conspirator: CardDefinition, gambit: CardDefinition, snapshot: inout GameSnapshot) {
        var nixon = snapshot.nixon
        nixon.hand.removeAll { $0.id == conspirator.id }
        nixon.removed.append(conspirator)
        nixon.hand.removeAll { $0.id == gambit.id }
        nixon.discard.append(gambit)
        snapshot.setPlayer(.nixon, nixon)
        snapshot.log.append(GameLogEntry("Гамбит: сообщник «\(conspirator.name)» убран из игры, «Гамбит» в сброс."))
    }

  // MARK: - Editor

    private static func applyWoodward(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        guard !snapshot.evidenceBag.isEmpty else {
            snapshot.log.append(GameLogEntry("Мешок улик пуст."))
            return promptInitiativeOrMomentum(card: card, steps: 2, snapshot: &snapshot)
        }
        let token = snapshot.evidenceBag.removeFirst()
        let position = -2
        snapshot.trackEvidence.append(TrackEvidence(token: token, position: position, isFaceUp: true))
        snapshot.log.append(GameLogEntry("Вудворд: улика на позиции 2 (редактор)."))
        return promptInitiativeOrMomentum(card: card, steps: 2, snapshot: &snapshot)
    }

    private static func applyBernstein(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        let onBoard = snapshot.evidenceSpaces.compactMap { space -> (BoardNodeID, EvidenceToken)? in
            guard let tokenID = space.tokenID, let token = snapshot.placedTokens[tokenID] else { return nil }
            return (space.nodeID, token)
        }
        guard !onBoard.isEmpty else {
            snapshot.log.append(GameLogEntry("На доске нет улик для Бернстайна."))
            return .completed
        }
        if onBoard.count == 1, let (_, token) = onBoard.first {
            removeEvidenceFromBoard(token: token, snapshot: &snapshot)
            snapshot.trackEvidence.append(TrackEvidence(token: token, position: 0, isFaceUp: true))
            snapshot.log.append(GameLogEntry("Бернстайн: улика на нулевой клетке трека."))
            return .completed
        }
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseBoardEvidence(card))
        snapshot.awaitingPassTo = .editor
        return .paused
    }

    static func completeBernstein(boardNode: BoardNodeID, card: CardDefinition, snapshot: inout GameSnapshot) {
        guard let index = snapshot.evidenceSpaces.firstIndex(where: { $0.nodeID == boardNode }),
              let tokenID = snapshot.evidenceSpaces[index].tokenID,
              let token = snapshot.placedTokens[tokenID]
        else { return }
        snapshot.evidenceSpaces[index].tokenID = nil
        snapshot.evidenceSpaces[index].isFaceUp = false
        snapshot.placedTokens.removeValue(forKey: tokenID)
        snapshot.trackEvidence.append(TrackEvidence(token: token, position: 0, isFaceUp: true))
        snapshot.log.append(GameLogEntry("Бернстайн: улика снята с доски на трек."))
    }

    private static func applySystemWorked(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        let removed = snapshot.editor.removed.filter { !$0.isReaction && $0.kind == .event }
        guard !removed.isEmpty else {
            snapshot.log.append(GameLogEntry("Нет подходящих убранных карт для «Система работает»."))
            return .completed
        }
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseRemovedCard(card))
        snapshot.awaitingPassTo = .editor
        return .paused
    }

    static func replayRemovedCard(_ removed: CardDefinition, systemCard: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        snapshot.log.append(GameLogEntry("«Система работает»: повтор «\(removed.name)»."))
        return apply(removed, snapshot: &snapshot)
    }

    private static func applyDeepThroat(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        let pinnedDown = snapshot.informants.filter { $0.isPinned && !$0.isFaceUp }
        guard !pinnedDown.isEmpty else {
            moveInitiative(steps: 3, role: .editor, snapshot: &snapshot)
            return .completed
        }
        if pinnedDown.count == 1 {
            unpinInformant(pinnedDown[0].id, snapshot: &snapshot)
            moveInitiative(steps: 3, role: .editor, snapshot: &snapshot)
            return .completed
        }
        snapshot.pendingPrompt = PendingPrompt(
            kind: .chooseInformant(card, pinnedDown.map(\.id), false, 3)
        )
        snapshot.awaitingPassTo = .editor
        return .paused
    }

    private static func applyMissingTape(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        let greens = snapshot.trackEvidence.filter {
            $0.isFaceUp && ($0.token.colors.primary == .green || $0.token.colors.secondary == .green)
        }
        guard !greens.isEmpty else {
            snapshot.log.append(GameLogEntry("На треке нет зелёных улик лицом вверх."))
            return .completed
        }
        if greens.count == 1, let item = greens.first {
            snapshot.trackEvidence.removeAll { $0.id == item.id }
            snapshot.pendingPrompt = PendingPrompt(kind: .pinEvidence(item.token, .editor))
            snapshot.awaitingPassTo = .editor
            return .paused
        }
        snapshot.pendingMultiStepCardID = card.id
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseTrackEvidence(.editor, 0, greens))
        snapshot.awaitingPassTo = .editor
        return .paused
    }

    private static func applyWatergateComplex(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        moveInitiative(steps: 3, role: .editor, snapshot: &snapshot)
        let faceUp = snapshot.trackEvidence.filter(\.isFaceUp)
        let faceDown = snapshot.trackEvidence.filter { !$0.isFaceUp }
        if let up = faceUp.first {
            if faceUp.count > 1 {
                snapshot.pendingMultiStepCardID = card.id
                snapshot.pendingMultiStepIndex = 1
                snapshot.pendingPrompt = PendingPrompt(kind: .chooseTrackEvidence(.editor, 2, faceUp))
                snapshot.awaitingPassTo = .editor
                return .paused
            }
            GameEngine.moveEvidence(id: up.id, steps: 2, toward: .editor, flipFaceUp: true, snapshot: &snapshot)
        }
        if let down = faceDown.first {
            if faceDown.count > 1 {
                snapshot.pendingMultiStepCardID = card.id
                snapshot.pendingMultiStepIndex = 2
                snapshot.pendingPrompt = PendingPrompt(kind: .chooseTrackEvidence(.editor, 1, faceDown))
                snapshot.awaitingPassTo = .editor
                return .paused
            }
            GameEngine.moveEvidence(id: down.id, steps: 1, toward: .editor, flipFaceUp: true, snapshot: &snapshot)
        }
        return snapshot.pendingPrompt == nil ? .completed : .paused
    }

    private static func applyWhoPaysLawyers(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        moveInitiative(steps: 2, role: card.role, snapshot: &snapshot)
        moveMomentum(steps: 1, role: card.role, snapshot: &snapshot)
        let faceUp = snapshot.trackEvidence.filter(\.isFaceUp)
        guard !faceUp.isEmpty else { return .completed }
        snapshot.pendingMultiStepCardID = card.id
        snapshot.pendingFaceUpEvidenceMovesLeft = min(2, faceUp.count)
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseTrackEvidence(card.role, 1, faceUp))
        snapshot.awaitingPassTo = card.role
        return .paused
    }

    private static func flipFaceDownBoardEvidence(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        let spaces = snapshot.evidenceSpaces.filter { $0.tokenID != nil && !$0.isFaceUp }
        guard !spaces.isEmpty else {
            snapshot.log.append(GameLogEntry("Нет улик лицом вниз на доске."))
            return .completed
        }
        if spaces.count == 1, let space = spaces.first,
           let tokenID = space.tokenID,
           let index = snapshot.evidenceSpaces.firstIndex(where: { $0.nodeID == space.nodeID }) {
            snapshot.evidenceSpaces[index].isFaceUp = true
            snapshot.log.append(GameLogEntry("Импичмент: улика на \(space.nodeID.rawValue) перевернута."))
            return .completed
        }
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseBoardEvidence(card))
        snapshot.awaitingPassTo = .editor
        return .paused
    }

    static func flipBoardEvidenceFaceUp(node: BoardNodeID, snapshot: inout GameSnapshot) {
        guard let index = snapshot.evidenceSpaces.firstIndex(where: { $0.nodeID == node }) else { return }
        snapshot.evidenceSpaces[index].isFaceUp = true
        snapshot.log.append(GameLogEntry("Улика на \(node.rawValue) перевернута лицом вверх."))
    }

  // MARK: - Nixon

    private static func returnFaceUpEvidenceToBag(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        let faceUp = snapshot.trackEvidence.filter(\.isFaceUp)
        guard !faceUp.isEmpty else {
            snapshot.log.append(GameLogEntry("На треке нет улик лицом вверх."))
            return .completed
        }
        if faceUp.count == 1, let item = faceUp.first {
            snapshot.trackEvidence.removeAll { $0.id == item.id }
            snapshot.evidenceBag.append(item.token)
            snapshot.log.append(GameLogEntry("Лидди: улика возвращена в мешок."))
            return .completed
        }
        snapshot.pendingMultiStepCardID = card.id
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseTrackEvidence(.nixon, 0, faceUp))
        snapshot.awaitingPassTo = .nixon
        return .paused
    }

    static func returnTrackEvidenceToBag(id: UUID, snapshot: inout GameSnapshot) {
        guard let index = snapshot.trackEvidence.firstIndex(where: { $0.id == id }) else { return }
        let token = snapshot.trackEvidence.remove(at: index).token
        snapshot.evidenceBag.append(token)
    }

    private static func applyColson(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        var editor = snapshot.editor
        if !editor.hand.isEmpty {
            let index = Int.random(in: 0..<editor.hand.count)
            let discarded = editor.hand.remove(at: index)
            editor.discard.append(discarded)
            snapshot.setPlayer(.editor, editor)
            snapshot.log.append(GameLogEntry("Колсон: редактор сбрасывает «\(discarded.name)»."))
        }
        snapshot.pendingResumeRole = .nixon
        return .extraTurn(.nixon)
    }

    private static func applyEhrlichman(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        moveInitiative(steps: 2, role: .nixon, snapshot: &snapshot)
        moveMomentum(steps: 2, role: .nixon, snapshot: &snapshot)
        let faceDown = snapshot.trackEvidence.filter { !$0.isFaceUp }
        guard !faceDown.isEmpty else { return .completed }
        if faceDown.count == 1, let item = faceDown.first {
            returnTrackEvidenceToBag(id: item.id, snapshot: &snapshot)
            snapshot.log.append(GameLogEntry("Эрлихман: тайная улика в мешок."))
            return .completed
        }
        snapshot.pendingMultiStepCardID = card.id
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseTrackEvidence(.nixon, 0, faceDown))
        snapshot.awaitingPassTo = .nixon
        return .paused
    }

    private static func applyGemstone(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        moveMomentum(steps: 2, role: .nixon, snapshot: &snapshot)
        let options = snapshot.trackEvidence
        guard !options.isEmpty else { return .completed }
        snapshot.pendingMultiStepCardID = card.id
        snapshot.pendingEvidenceStepBudget = 2
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseTrackEvidenceMulti(.nixon, 2, 2, options, 0))
        snapshot.awaitingPassTo = .nixon
        return .paused
    }

    private static func applyBrilliantMood(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        snapshot.editorEventsBlocked = true
        snapshot.log.append(GameLogEntry("Великолепное настроение: редактор не может играть события до конца раунда."))
        return .completed
    }

    private static func applySmokingGun(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        moveInitiative(steps: 2, role: card.role, snapshot: &snapshot)
        moveMomentum(steps: 2, role: card.role, snapshot: &snapshot)
        let faceDown = snapshot.trackEvidence.filter { !$0.isFaceUp }
        guard !faceDown.isEmpty else { return .completed }
        if faceDown.count == 1, let item = faceDown.first {
            GameEngine.moveEvidence(id: item.id, steps: 1, toward: card.role, flipFaceUp: true, snapshot: &snapshot)
            return snapshot.pendingPrompt == nil ? .completed : .paused
        }
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseTrackEvidence(card.role, 1, faceDown))
        snapshot.awaitingPassTo = card.role
        return .paused
    }

    private static func applyCancer(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        let options = snapshot.trackEvidence
        if options.count == 1, let item = options.first {
            GameEngine.moveEvidence(id: item.id, steps: 3, toward: .nixon, flipFaceUp: !item.isFaceUp, snapshot: &snapshot)
            return .endRound
        }
        if options.isEmpty {
            return .endRound
        }
        snapshot.pendingMultiStepCardID = card.id
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseTrackEvidence(.nixon, 3, options))
        snapshot.awaitingPassTo = .nixon
        return .paused
    }

    private static func applySaturdayMassacre(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        snapshot.initiativePosition = 0
        for index in snapshot.trackEvidence.indices {
            snapshot.trackEvidence[index].position = 0
        }
        snapshot.log.append(GameLogEntry("Субботняя резня: инициатива и улики на «0»."))
        let options = snapshot.trackEvidence
        guard !options.isEmpty else { return .completed }
        if options.count == 1, let item = options.first {
            GameEngine.moveEvidence(id: item.id, steps: 1, toward: card.role, flipFaceUp: !item.isFaceUp, snapshot: &snapshot)
            return snapshot.pendingPrompt == nil ? .completed : .paused
        }
        snapshot.pendingMultiStepCardID = card.id
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseTrackEvidence(card.role, 1, options))
        snapshot.awaitingPassTo = card.role
        return .paused
    }

    private static func applyPresidentSpeech(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        guard !snapshot.evidenceBag.isEmpty else {
            snapshot.log.append(GameLogEntry("Мешок улик пуст."))
            return .completed
        }
        let token = snapshot.evidenceBag.removeFirst()
        snapshot.trackEvidence.append(TrackEvidence(token: token, position: 3, isFaceUp: true))
        snapshot.log.append(GameLogEntry("Речь президента: улика на позиции 3."))
        return .completed
    }

    private static func applyZiegler(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        if let item = snapshot.trackEvidence.first {
            if snapshot.trackEvidence.count > 1 {
                snapshot.pendingMultiStepCardID = card.id
                snapshot.pendingMultiStepIndex = 0
                snapshot.pendingPrompt = PendingPrompt(kind: .chooseTrackEvidence(.nixon, 0, snapshot.trackEvidence))
                snapshot.awaitingPassTo = .nixon
                return .paused
            }
            snapshot.trackEvidence[0].position = 0
        }
        GameEngine.moveMomentumToSpace(1, toward: .nixon, snapshot: &snapshot)
        snapshot.log.append(GameLogEntry("Зиглер: улика на «0», влияние на «1»."))
        return .completed
    }

    static func moveTrackEvidenceToZero(id: UUID, snapshot: inout GameSnapshot) {
        guard let index = snapshot.trackEvidence.firstIndex(where: { $0.id == id }) else { return }
        snapshot.trackEvidence[index].position = 0
    }

    private static func applyElection1972(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        guard !snapshot.trackEvidence.isEmpty else { return .completed }
        snapshot.pendingMultiStepCardID = card.id
        snapshot.pendingEvidenceStepBudget = 4
        snapshot.pendingPrompt = PendingPrompt(
            kind: .chooseTrackEvidenceMulti(.nixon, 0, 4, snapshot.trackEvidence, 4)
        )
        snapshot.awaitingPassTo = .nixon
        return .paused
    }

    private static func applyGambitPrompt(card: CardDefinition, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        let conspirators = snapshot.nixon.hand.filter { $0.kind == .conspirator && $0.id != card.id }
        snapshot.pendingPrompt = PendingPrompt(kind: .gambitChoice(card))
        snapshot.awaitingPassTo = .nixon
        if conspirators.isEmpty {
            snapshot.log.append(GameLogEntry("Гамбит: нет сообщников — только влияние на «5»."))
        }
        return .paused
    }

  // MARK: - Shared helpers

  @discardableResult
    private static func pinInformant(
        _ informant: InformantID,
        faceUp: Bool,
        card: CardDefinition,
        bonus: Int,
        snapshot: inout GameSnapshot
    ) -> CardApplyOutcome {
        guard let index = snapshot.informants.firstIndex(where: { $0.id == informant && !$0.isPinned }) else {
            snapshot.log.append(GameLogEntry("Информант \(informant.displayName) недоступен."))
            return .completed
        }
        snapshot.informants[index].isPinned = true
        snapshot.informants[index].isFaceUp = faceUp
        snapshot.log.append(GameLogEntry("Закреплён \(informant.displayName) (\(faceUp ? "вверх" : "вниз"))."))
        return promptInitiativeOrMomentum(card: card, steps: bonus, snapshot: &snapshot)
    }

    private static func promptInitiativeOrMomentum(
        card: CardDefinition,
        steps: Int,
        snapshot: inout GameSnapshot
    ) -> CardApplyOutcome {
        snapshot.pendingPrompt = PendingPrompt(kind: .chooseInitiativeOrMomentum(card, steps))
        snapshot.awaitingPassTo = card.role
        return .paused
    }

    private static func drawAndPinFromBag(role: PlayerRole, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        guard !snapshot.evidenceBag.isEmpty else {
            snapshot.log.append(GameLogEntry("Мешок улик пуст."))
            return .completed
        }
        let token = snapshot.evidenceBag.removeFirst()
        snapshot.pendingPrompt = PendingPrompt(kind: .pinEvidence(token, role))
        snapshot.awaitingPassTo = role
        return .paused
    }

    private static func unpinInformant(_ id: InformantID, snapshot: inout GameSnapshot) {
        guard let index = snapshot.informants.firstIndex(where: { $0.id == id }) else { return }
        snapshot.informants[index].isPinned = false
        snapshot.informants[index].isFaceUp = false
        snapshot.log.append(GameLogEntry("\(id.displayName) возвращён в резерв."))
    }

    static func unpinInformantAndMoveInitiative(_ id: InformantID, steps: Int, snapshot: inout GameSnapshot) {
        unpinInformant(id, snapshot: &snapshot)
        moveInitiative(steps: steps, role: .editor, snapshot: &snapshot)
    }

    private static func removeEvidenceFromBoard(token: EvidenceToken, snapshot: inout GameSnapshot) {
        if let index = snapshot.evidenceSpaces.firstIndex(where: { $0.tokenID == token.id }) {
            snapshot.evidenceSpaces[index].tokenID = nil
            snapshot.evidenceSpaces[index].isFaceUp = false
        }
        snapshot.placedTokens.removeValue(forKey: token.id)
    }

    private static func moveAllEvidence(steps: Int, role: PlayerRole, snapshot: inout GameSnapshot) -> CardApplyOutcome {
        for item in snapshot.trackEvidence {
            GameEngine.moveEvidence(
                id: item.id,
                steps: steps,
                toward: role,
                flipFaceUp: !item.isFaceUp,
                snapshot: &snapshot
            )
            if snapshot.pendingPrompt != nil { return .paused }
        }
        return .completed
    }

    private static func drawCards(role: PlayerRole, count: Int, snapshot: inout GameSnapshot) {
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

    private static func moveInitiative(steps: Int, role: PlayerRole, snapshot: inout GameSnapshot) {
        GameEngine.moveInitiative(steps: steps, toward: role, snapshot: &snapshot)
    }

    private static func moveMomentum(steps: Int, role: PlayerRole, snapshot: inout GameSnapshot) {
        GameEngine.moveMomentum(steps: steps, toward: role, snapshot: &snapshot)
    }
}
