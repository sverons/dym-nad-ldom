import Foundation

enum NetworkMessage: Codable {
    case hello(String)
    case gameStart(hostRole: PlayerRole, guestState: GameSnapshot)
    case stateUpdate(GameSnapshot)
    case action(RemotePlayerAction)
    case error(String)
}

enum RemotePlayerAction: Codable {
    case acknowledgePass
    case selectCard(cardID: String)
    case chooseValue(cardID: String)
    case chooseAction(cardID: String)
    case performValueMove(cardID: String, target: RemoteValueTarget)
    case confirmAction(cardID: String)
    case cancelPrompt
    case declineReaction
    case playReaction(cardID: String)
    case completePeekDeck
    case performTrackEvidenceMove(evidenceID: UUID, steps: Int)
    case beginMomentumPinFromTrack(tokenID: UUID)
    case cancelMomentumPinFromTrack
    case pinEvidence(nodeID: String, tokenID: UUID)
    case completeEvaluationPin
}

enum RemoteValueTarget: Codable {
    case initiative
    case momentum
    case evidence(UUID)
    case hiddenEvidence(UUID, EvidenceColor)
}

struct NetworkCodec {
    static func encode(_ message: NetworkMessage) throws -> Data {
        try JSONEncoder().encode(message)
    }

    static func decode(_ data: Data) throws -> NetworkMessage {
        try JSONDecoder().decode(NetworkMessage.self, from: data)
    }
}
