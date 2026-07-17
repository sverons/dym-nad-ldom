import XCTest
@testable import Watergate

@MainActor
final class GameEngineTests: XCTestCase {
    private func startReadyGame(humanRole: PlayerRole = .editor) -> GameEngine {
        let engine = GameEngine()
        engine.startNewGame(humanRole: humanRole)
        if case .nixonSetupEvidence = engine.snapshot.pendingPrompt?.kind {
            engine.confirmNixonSetupEvidence()
        }
        engine.acknowledgePass()
        return engine
    }

    func testNewGameInitialState() {
        let engine = GameEngine()
        engine.startNewGame(humanRole: .editor)

        XCTAssertEqual(engine.snapshot.phase, .setup)
        XCTAssertNotNil(engine.snapshot.pendingPrompt)
        if case .nixonSetupEvidence(let tokens) = engine.snapshot.pendingPrompt?.kind {
            XCTAssertEqual(tokens.count, 3)
            engine.confirmNixonSetupEvidence()
        } else {
            XCTFail("Ожидался просмотр улик Никсоном")
            return
        }

        XCTAssertEqual(engine.snapshot.phase, .cardPlay)
        XCTAssertEqual(engine.snapshot.round, 1)
        XCTAssertEqual(engine.snapshot.initiativeHolder, .editor)
        XCTAssertEqual(engine.snapshot.trackEvidence.count, 3)
        XCTAssertTrue(engine.snapshot.trackEvidence.allSatisfy { $0.position == 0 && !$0.isFaceUp })
        XCTAssertEqual(engine.snapshot.editor.hand.count, 5)
        XCTAssertEqual(engine.snapshot.nixon.hand.count, 4)
        XCTAssertEqual(engine.snapshot.activeRole, .editor)
    }

    func testValueMoveToEndRequestsImmediatePin() {
        let engine = startReadyGame()

        guard let card = engine.snapshot.editor.hand.first(where: { $0.value >= 1 }) else {
            XCTFail("Нет карты редактора для проверки")
            return
        }

        let trackID = engine.snapshot.trackEvidence[0].id
        engine.mutateSnapshotForTesting { snapshot in
            var trackItem = snapshot.trackEvidence[0]
            trackItem.position = -4
            trackItem.isFaceUp = true
            snapshot.trackEvidence[0] = trackItem
        }

        engine.performValueMove(card: card, target: .evidence(trackID))

        if case .pinEvidence(let token, let role) = engine.snapshot.pendingPrompt?.kind {
            XCTAssertEqual(role, .editor)
            XCTAssertEqual(token.id, trackID)
        } else {
            XCTFail("Ожидался запрос на закрепление улики")
        }
    }

    func testResumeAfterImmediatePinAdvancesTurn() {
        let engine = startReadyGame()

        let startingRole = engine.snapshot.activeRole
        let trackID = engine.snapshot.trackEvidence[0].id
        engine.mutateSnapshotForTesting { snapshot in
            var trackItem = snapshot.trackEvidence[0]
            trackItem.position = -4
            trackItem.isFaceUp = true
            snapshot.trackEvidence[0] = trackItem
        }

        guard let card = engine.snapshot.editor.hand.first else {
            XCTFail("Пустая рука")
            return
        }

        engine.performValueMove(card: card, target: .evidence(trackID))
        XCTAssertEqual(engine.snapshot.activeRole, startingRole)

        engine.clearPendingPrompt()
        engine.resumeAfterImmediatePin()

        XCTAssertEqual(engine.snapshot.activeRole, startingRole.opponent)
    }

    func testEditorWinsWithTwoConnections() {
        let engine = startReadyGame()

        engine.mutateSnapshotForTesting { snapshot in
            snapshot.informants = snapshot.informants.map { informant in
                var copy = informant
                if informant.id == .mitchell || informant.id == .dean {
                    copy.isPinned = true
                    copy.isFaceUp = true
                }
                return copy
            }

            for node in [BoardNodeID.e1, BoardNodeID.e2] {
                guard let index = snapshot.evidenceSpaces.firstIndex(where: { $0.nodeID == node }) else { continue }
                let token = EvidenceToken(colors: .init(.blue))
                snapshot.evidenceSpaces[index].tokenID = token.id
                snapshot.evidenceSpaces[index].isFaceUp = true
                snapshot.placedTokens[token.id] = token
            }
        }

        XCTAssertEqual(BoardLayout.connectedInformantCount(in: engine.snapshot), 2)

        let token = EvidenceToken(colors: .init(.blue))
        engine.pinEvidence(to: .e3, token: token, by: .editor)

        XCTAssertEqual(engine.snapshot.winner, .editor)
        XCTAssertEqual(engine.snapshot.phase, .finished)
    }

    func testBoardAdjacencyMatchesHexRing() {
        // Sloan и Butterfield на разных сторонах — не соседи.
        XCTAssertFalse(BoardLayout.adjacency[.sloan, default: []].contains(.butterfield))
        XCTAssertFalse(BoardLayout.adjacency[.butterfield, default: []].contains(.sloan))
        // Соседи по кольцу.
        XCTAssertTrue(BoardLayout.adjacency[.mitchell, default: []].contains(.e2))
        XCTAssertTrue(BoardLayout.adjacency[.dean, default: []].contains(.e2))
        XCTAssertTrue(BoardLayout.adjacency[.dean, default: []].contains(.e3))
        XCTAssertTrue(BoardLayout.adjacency[.butterfield, default: []].contains(.e3))
        XCTAssertTrue(BoardLayout.adjacency[.nixon, default: []].isSuperset(of: [.e1, .e5, .e9, .e13]))
    }

    func testEvaluationReturnsNeutralEvidenceToBag() {
        let engine = startReadyGame()

        let bagCountBefore = engine.snapshot.evidenceBag.count
        engine.mutateSnapshotForTesting { snapshot in
            snapshot.phase = .evaluation
            snapshot.evaluationStep = .returnNeutral
            snapshot.trackEvidence = [
                TrackEvidence(token: EvidenceToken(colors: .init(.green)), position: 0, isFaceUp: true)
            ]
        }

        engine.continueEvaluation()

        XCTAssertEqual(engine.snapshot.trackEvidence.count, 0)
        XCTAssertEqual(engine.snapshot.evidenceBag.count, bagCountBefore + 1)
        XCTAssertEqual(engine.snapshot.evaluationStep, .awardInitiative)
    }

    func testReactionFollowTheMoneyCancelsNixonEvidenceMove() {
        let engine = startReadyGame(humanRole: .nixon)

        let e02 = CardDefinition(
            id: "e02", role: .editor, name: "Следуй за деньгами!", value: 3, valueColors: [.blue],
            isJoker: false, kind: .reaction, actionTitle: "Реакция",
            actionDetail: "", quote: "", isReaction: true
        )
        engine.mutateSnapshotForTesting { snapshot in
            snapshot.activeRole = .nixon
            snapshot.editor.hand = [e02]
            var trackItem = snapshot.trackEvidence[0]
            trackItem.position = 0
            trackItem.isFaceUp = false
            snapshot.trackEvidence[0] = trackItem
            if let idx = snapshot.nixon.hand.firstIndex(where: { $0.value >= 1 }) {
                let card = snapshot.nixon.hand[idx]
                snapshot.nixon.hand = [card]
            }
        }

        guard let nixonCard = engine.snapshot.nixon.hand.first else {
            XCTFail("Нет карты Никсона")
            return
        }
        let trackID = engine.snapshot.trackEvidence[0].id

        engine.performValueMove(card: nixonCard, target: .evidence(trackID))

        XCTAssertNotNil(engine.snapshot.pendingPrompt)
        if case .offerReaction = engine.snapshot.pendingPrompt?.kind {
            engine.playReaction(e02)
        } else {
            XCTFail("Ожидалось окно реакции")
            return
        }

        XCTAssertEqual(engine.snapshot.trackEvidence.first?.position, -nixonCard.value)
        XCTAssertFalse(engine.snapshot.nixon.hand.contains(where: { $0.id == nixonCard.id }))
    }

    func testHuntDrawsAndForcesPlay() {
        let engine = startReadyGame(humanRole: .nixon)

        let hunt = CardDefinition(
            id: "n05", role: .nixon, name: "Говард Хант", value: 4, valueColors: [.green],
            isJoker: false, kind: .conspirator, actionTitle: "Заговорщик",
            actionDetail: "", quote: "", isReaction: false
        )
        let top = CardDefinition(
            id: "n18", role: .nixon, name: "Союзники", value: 1, valueColors: [.blue, .yellow],
            isJoker: false, kind: .event, actionTitle: "Событие",
            actionDetail: "", quote: "", isReaction: false
        )

        engine.mutateSnapshotForTesting { snapshot in
            snapshot.activeRole = .nixon
            snapshot.nixon.hand = [hunt]
            snapshot.nixon.drawPile = [top]
        }

        engine.confirmAction(for: hunt)

        XCTAssertEqual(engine.snapshot.forcedPlayCardID, top.id)
        XCTAssertTrue(engine.snapshot.nixon.hand.contains(where: { $0.id == hunt.id }))
        if case .chooseCardMode(let card) = engine.snapshot.pendingPrompt?.kind {
            XCTAssertEqual(card.id, top.id)
        } else {
            XCTFail("Ожидался принудительный выбор карты")
        }
    }

    func testRoundTwoPlacesNewEvidencePeek() {
        let engine = startReadyGame()
        let bagBefore = engine.snapshot.evidenceBag.count

        engine.mutateSnapshotForTesting { snapshot in
            snapshot.phase = .evaluation
            snapshot.pendingEvaluationTokens = []
            snapshot.trackEvidence = []
            snapshot.round = 1
        }

        engine.promptNextEvaluationPin()

        XCTAssertEqual(engine.snapshot.round, 2)
        XCTAssertEqual(engine.snapshot.phase, .initial)
        if case .nixonSetupEvidence(let tokens) = engine.snapshot.pendingPrompt?.kind {
            XCTAssertEqual(tokens.count, 3)
            XCTAssertEqual(engine.snapshot.evidenceBag.count, bagBefore - 3)
            engine.confirmNixonSetupEvidence()
            XCTAssertEqual(engine.snapshot.phase, .cardPlay)
            XCTAssertEqual(engine.snapshot.trackEvidence.filter { $0.position == 0 }.count, 3)
        } else {
            XCTFail("Ожидался peek улик на раунд 2")
        }
    }

    func testSkipPinNoSpaceDoesNotDeadlock() {
        let engine = startReadyGame()
        let token = EvidenceToken(colors: .init(.yellow))
        engine.mutateSnapshotForTesting { snapshot in
            snapshot.pendingPrompt = PendingPrompt(kind: .pinEvidence(token, .editor))
            snapshot.activeRole = .editor
            for index in snapshot.evidenceSpaces.indices {
                let space = snapshot.evidenceSpaces[index]
                if space.allowedColors.contains(where: { token.colors.matches($0) }) {
                    let filler = EvidenceToken(colors: .init(.yellow))
                    snapshot.evidenceSpaces[index].tokenID = filler.id
                    snapshot.placedTokens[filler.id] = filler
                }
            }
        }

        let roleBefore = engine.snapshot.activeRole
        engine.skipPinBecauseNoSpace()
        XCTAssertNil(engine.snapshot.pendingPrompt)
        XCTAssertEqual(engine.snapshot.activeRole, roleBefore.opponent)
    }
}
