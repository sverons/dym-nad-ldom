import Foundation

enum PlayMode: Equatable {
    case passAndPlay
    case localWifi(isHost: Bool)
}

enum ConnectionMode: Equatable {
    case sameDevice
    case wifi
}

enum PlayerRole: String, Codable, CaseIterable, Identifiable {
    case editor
    case nixon

    var id: String { rawValue }

    var title: String {
        switch self {
        case .editor: return "Редактор"
        case .nixon: return "Никсон"
        }
    }

    var subtitle: String {
        switch self {
        case .editor: return "«Вашингтон пост»"
        case .nixon: return "Администрация"
        }
    }

    var opponent: PlayerRole {
        self == .editor ? .nixon : .editor
    }
}

enum EvidenceColor: String, Codable, CaseIterable, Identifiable, Hashable {
    case blue
    case yellow
    case green

    var id: String { rawValue }

    var label: String {
        switch self {
        case .blue: return "Синий"
        case .yellow: return "Жёлтый"
        case .green: return "Зелёный"
        }
    }

    var symbol: String {
        switch self {
        case .blue: return "С"
        case .yellow: return "Ж"
        case .green: return "З"
        }
    }
}

enum CardKind: String, Codable {
    case event
    case journalist
    case conspirator
    case reaction
}

enum GamePhase: String, Codable {
    case setup
    case initial
    case cardPlay
    case evaluation
    case finished
}

enum RoundStep: Int, Codable {
    case returnNeutral = 1
    case awardInitiative
    case awardMomentum
    case resetTrack
    case awardEvidence
}

enum InformantID: String, Codable, CaseIterable, Identifiable {
    case dean
    case butterfield
    case sloan
    case mitchell
    case woods
    case baldwin
    case mccord

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .dean: return "Дин"
        case .butterfield: return "Баттерфилд"
        case .sloan: return "Слоун"
        case .mitchell: return "М. Митчелл"
        case .woods: return "Вудс"
        case .baldwin: return "Болдуин"
        case .mccord: return "Маккорд"
        }
    }

    /// Цвет зоны информанта на оригинальной доске.
    var boardColor: EvidenceColor {
        switch self {
        case .dean, .mitchell, .sloan: return .blue
        case .butterfield, .woods: return .green
        case .baldwin, .mccord: return .yellow
        }
    }
}

enum BoardNodeID: String, Codable, Hashable, CaseIterable {
    case nixon
    case dean
    case butterfield
    case sloan
    case mitchell
    case woods
    case baldwin
    case mccord
    case e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15, e16, e17, e18
}

struct TokenColors: Codable, Hashable {
    let primary: EvidenceColor
    let secondary: EvidenceColor?

    init(_ primary: EvidenceColor, _ secondary: EvidenceColor? = nil) {
        self.primary = primary
        self.secondary = secondary
    }

    func matches(_ color: EvidenceColor) -> Bool {
        primary == color || secondary == color
    }

    var isDual: Bool { secondary != nil }
}

struct EvidenceToken: Identifiable, Codable, Hashable {
    let id: UUID
    let colors: TokenColors
    var hasMomentumBonus: Bool

    init(colors: TokenColors, hasMomentumBonus: Bool = false) {
        self.id = UUID()
        self.colors = colors
        self.hasMomentumBonus = hasMomentumBonus
    }
}

struct TrackEvidence: Identifiable, Codable, Hashable {
    let id: UUID
    let token: EvidenceToken
    var position: Int
    var isFaceUp: Bool

    init(token: EvidenceToken, position: Int = 0, isFaceUp: Bool = true) {
        self.id = token.id
        self.token = token
        self.position = position
        self.isFaceUp = isFaceUp
    }
}

struct InformantState: Codable, Hashable {
    let id: InformantID
    var isPinned: Bool
    var isFaceUp: Bool

    init(id: InformantID, isPinned: Bool = false, isFaceUp: Bool = false) {
        self.id = id
        self.isPinned = isPinned
        self.isFaceUp = isFaceUp
    }
}

struct EvidenceSpaceState: Identifiable, Codable, Hashable {
    let nodeID: BoardNodeID
    let allowedColors: [EvidenceColor]
    var tokenID: UUID?
    var isFaceUp: Bool

    var id: BoardNodeID { nodeID }
}

struct CardDefinition: Identifiable, Codable, Hashable {
    let id: String
    let role: PlayerRole
    let name: String
    let value: Int
    let valueColors: [EvidenceColor]
    let isJoker: Bool
    let kind: CardKind
    let actionTitle: String
    let actionDetail: String
    let quote: String
    let isReaction: Bool
}

struct PlayedCard: Identifiable, Codable, Hashable {
    let definition: CardDefinition
    let usedValue: Bool

    var id: String { definition.id }
}

struct PlayerState: Codable, Equatable {
    let role: PlayerRole
    var drawPile: [CardDefinition]
    var hand: [CardDefinition]
    var discard: [CardDefinition]
    var removed: [CardDefinition]
    var momentumCount: Int

    var deckCount: Int { drawPile.count }
}

struct PendingEvaluationToken: Codable, Hashable {
    let role: PlayerRole
    let token: EvidenceToken
}

enum ReactionTrigger: String, Codable, Equatable {
    case nixonEvidenceValueMove
    case nixonConspiratorAction
    case editorEventAction
}

struct EvidenceMoveContext: Codable, Equatable {
    let evidenceID: UUID
    let initialPosition: Int
    let initialFaceUp: Bool
    let moveSteps: Int
}

struct ReactionCheckpoint: Codable, Equatable {
    var trackEvidence: [TrackEvidence]
    var informants: [InformantState]
    var evidenceSpaces: [EvidenceSpaceState]
    var initiativePosition: Int
    var momentumPosition: Int
    var initiativeHolder: PlayerRole
    var editorDrawSize: Int
    var nixonDrawSize: Int
    var initiativeClaimedThisRound: Bool
    var momentumClaimedThisRound: Bool
    var editorEventsBlocked: Bool
    var editor: PlayerState
    var nixon: PlayerState
    var placedTokens: [UUID: EvidenceToken]
    var evidenceBag: [EvidenceToken]
    var momentumSupply: Int

    static func capture(from snapshot: GameSnapshot) -> ReactionCheckpoint {
        ReactionCheckpoint(
            trackEvidence: snapshot.trackEvidence,
            informants: snapshot.informants,
            evidenceSpaces: snapshot.evidenceSpaces,
            initiativePosition: snapshot.initiativePosition,
            momentumPosition: snapshot.momentumPosition,
            initiativeHolder: snapshot.initiativeHolder,
            editorDrawSize: snapshot.editorDrawSize,
            nixonDrawSize: snapshot.nixonDrawSize,
            initiativeClaimedThisRound: snapshot.initiativeClaimedThisRound,
            momentumClaimedThisRound: snapshot.momentumClaimedThisRound,
            editorEventsBlocked: snapshot.editorEventsBlocked,
            editor: snapshot.editor,
            nixon: snapshot.nixon,
            placedTokens: snapshot.placedTokens,
            evidenceBag: snapshot.evidenceBag,
            momentumSupply: snapshot.momentumSupply
        )
    }

    func apply(to snapshot: inout GameSnapshot) {
        snapshot.trackEvidence = trackEvidence
        snapshot.informants = informants
        snapshot.evidenceSpaces = evidenceSpaces
        snapshot.initiativePosition = initiativePosition
        snapshot.momentumPosition = momentumPosition
        snapshot.initiativeHolder = initiativeHolder
        snapshot.editorDrawSize = editorDrawSize
        snapshot.nixonDrawSize = nixonDrawSize
        snapshot.initiativeClaimedThisRound = initiativeClaimedThisRound
        snapshot.momentumClaimedThisRound = momentumClaimedThisRound
        snapshot.editorEventsBlocked = editorEventsBlocked
        snapshot.editor = editor
        snapshot.nixon = nixon
        snapshot.placedTokens = placedTokens
        snapshot.evidenceBag = evidenceBag
        snapshot.momentumSupply = momentumSupply
    }

    func player(_ role: PlayerRole) -> PlayerState {
        role == .editor ? editor : nixon
    }
}

struct ReactionWindowState: Codable, Equatable {
    let trigger: ReactionTrigger
    let triggeringCardID: String
    let triggeringRole: PlayerRole
    let responder: PlayerRole
    let checkpoint: ReactionCheckpoint
    let evidenceContext: EvidenceMoveContext?
    let isReReaction: Bool
}

struct PendingPrompt: Identifiable, Equatable, Codable {
    enum Kind: Equatable, Codable {
        case chooseCardMode(CardDefinition)
        case chooseValueTarget(CardDefinition, [ValueMoveOption])
        case chooseEvidenceColor(CardDefinition)
        case nixonHiddenEvidenceAsk(CardDefinition, EvidenceColor, UUID, Int)
        case nixonHiddenEvidencePick(CardDefinition, [TrackEvidence], Int)
        case pinEvidence(EvidenceToken, PlayerRole)
        case confirmAction(CardDefinition)
        case evaluationPin(PlayerRole, [EvidenceToken])
        case offerReaction(ReactionWindowState, [CardDefinition])
        case peekOpponentDeck(PlayerRole, [CardDefinition])
        case chooseTrackEvidence(PlayerRole, Int, [TrackEvidence])
        case momentumPinFromTrack(PlayerRole, [TrackEvidence])
        case chooseRemovedCard(CardDefinition)
        case chooseInformant(CardDefinition, [InformantID], Bool, Int)
        case chooseBoardEvidence(CardDefinition)
        case chooseTrackEvidenceMulti(PlayerRole, Int, Int, [TrackEvidence], Int)
        case gambitChoice(CardDefinition)
        case nixonSetupEvidence([EvidenceToken])
        case chooseInitiativeOrMomentum(CardDefinition, Int)
    }

    let id: UUID
    let kind: Kind

    init(kind: Kind, id: UUID = UUID()) {
        self.id = id
        self.kind = kind
    }
}

struct ValueMoveOption: Identifiable, Hashable, Codable {
    enum Target: Hashable, Codable {
        case initiative
        case momentum
        case evidence(UUID)
        case hiddenEvidence(UUID, EvidenceColor)
    }

    let id: UUID
    let label: String
    let target: Target

    init(label: String, target: Target, id: UUID = UUID()) {
        self.id = id
        self.label = label
        self.target = target
    }
}

struct GameLogEntry: Identifiable, Codable, Hashable {
    let id: UUID
    let message: String

    init(_ message: String) {
        self.id = UUID()
        self.message = message
    }
}

struct GameSnapshot: Codable {
    var phase: GamePhase = .setup
    var round: Int = 0
    var evaluationStep: RoundStep?
    var activeRole: PlayerRole = .editor
    var initiativeHolder: PlayerRole = .editor
    var editorDrawSize: Int = 5
    var nixonDrawSize: Int = 4
    var editor: PlayerState
    var nixon: PlayerState
    var initiativePosition: Int = 0
    var momentumPosition: Int = 0
    var trackEvidence: [TrackEvidence] = []
    var momentumSupply: Int = 8
    var evidenceBag: [EvidenceToken] = []
    var informants: [InformantState]
    var evidenceSpaces: [EvidenceSpaceState]
    var initiativeClaimedThisRound = false
    var momentumClaimedThisRound = false
    var editorEventsBlocked = false
    var editorTurnsThisRound = 0
    var nixonTurnsThisRound = 0
    var winner: PlayerRole?
    var log: [GameLogEntry] = []
    var pendingPrompt: PendingPrompt?
    var awaitingPassTo: PlayerRole?
    var setupEvidencePlaced = false
    var humanRole: PlayerRole = .editor
    var pendingEvaluationTokens: [PendingEvaluationToken] = []
    var placedTokens: [UUID: EvidenceToken] = [:]
    var forcedPlayCardID: String?
    var pendingChainedParentCardID: String?
    var pendingResumeRole: PlayerRole?
    var pendingEvidenceStepBudget: Int?
    var pendingMultiStepCardID: String?
    var pendingMultiStepIndex: Int?
    var pendingFaceUpEvidenceMovesLeft: Int?

    init(editor: PlayerState, nixon: PlayerState, informants: [InformantState], evidenceSpaces: [EvidenceSpaceState]) {
        self.editor = editor
        self.nixon = nixon
        self.informants = informants
        self.evidenceSpaces = evidenceSpaces
    }

    func player(_ role: PlayerRole) -> PlayerState {
        role == .editor ? editor : nixon
    }

    mutating func setPlayer(_ role: PlayerRole, _ state: PlayerState) {
        if role == .editor {
            editor = state
        } else {
            nixon = state
        }
    }

    func sanitized(for viewer: PlayerRole) -> GameSnapshot {
        var copy = self
        var hidden = copy.player(viewer.opponent)
        hidden.hand = []
        hidden.drawPile = []
        copy.setPlayer(viewer.opponent, hidden)
        copy.humanRole = viewer
        return copy
    }
}
