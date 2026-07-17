import Foundation
import CoreGraphics

enum BoardLayout {
    static let maxTrackDistance = 5

    static let informantNodes: [InformantID: BoardNodeID] = [
        .dean: .dean,
        .butterfield: .butterfield,
        .sloan: .sloan,
        .mitchell: .mitchell,
        .woods: .woods,
        .baldwin: .baldwin,
        .mccord: .mccord
    ]

    /// Осевые координаты гекс-сетки (как на оригинальной пробковой доске).
    /// (q, r): Nixon в (0,0), информаторы на внешнем кольце, улики на рёбрах.
    static let nodeHexCoords: [BoardNodeID: (q: CGFloat, r: CGFloat)] = [
        .nixon: (0, 0),
        // Informants — 7 outer positions (official color zones)
        .mitchell: (0, -3),
        .dean: (2.5, -3),
        .butterfield: (3, -0.5),
        .mccord: (2, 2),
        .baldwin: (-0.5, 3),
        .woods: (-3, 2),
        .sloan: (-3, -0.5),
        // Outer path evidence
        .e1: (0, -1.5),          // toward Mitchell / Nixon north
        .e2: (1.6, -2.2),        // Dean–Butterfield arc
        .e3: (2.6, -1.4),
        .e4: (2.2, 0.6),
        .e5: (1.2, 0),           // Nixon east hub
        .e6: (-1.4, 2.2),
        .e7: (-2.4, 1.4),
        .e8: (-1.6, -1.2),
        .e9: (-1.2, 0),          // Nixon west hub
        // Inner ring
        .e10: (-0.7, -0.7),
        .e11: (0.2, -1.0),
        .e12: (0.9, -0.5),
        .e13: (0, 1.2),          // Nixon south hub
        .e14: (-0.85, 0.85),
        .e15: (-1.0, 0.35),
        .e16: (0.85, 0.85),
        .e17: (1.0, 0.35),
        .e18: (0, -0.55)
    ]

    static func point(for node: BoardNodeID, in size: CGSize, inset: CGFloat = 22) -> CGPoint {
        let (q, r) = nodeHexCoords[node] ?? (0, 0)
        return hexToPoint(q: q, r: r, in: size, inset: inset)
    }

    static func hexToPoint(q: CGFloat, r: CGFloat, in size: CGSize, inset: CGFloat = 22) -> CGPoint {
        let usable = min(size.width, size.height) - inset * 2
        // Hex size so ring ±3 fits with margin
        let hexSize = usable / 7.2
        let x = hexSize * (sqrt(3) * q + sqrt(3) / 2 * r)
        let y = hexSize * (1.5 * r)
        return CGPoint(x: size.width / 2 + x, y: size.height / 2 + y)
    }

    /// Вершины декоративной треугольной сетки (радиус 3).
    static func decorativeHexVertices(in size: CGSize, inset: CGFloat = 22) -> [CGPoint] {
        let radius = 3
        var points: [CGPoint] = []
        for q in -radius...radius {
            for r in -radius...radius {
                let s = -q - r
                if abs(s) > radius { continue }
                points.append(hexToPoint(q: CGFloat(q), r: CGFloat(r), in: size, inset: inset))
            }
        }
        return points
    }

    static let adjacency: [BoardNodeID: Set<BoardNodeID>] = [
        // Nixon spokes
        .nixon: [.e1, .e5, .e9, .e13],
        // Outer informants clockwise: Mitchell → Dean → Butterfield → McCord → Baldwin → Woods → Sloan
        .mitchell: [.e1, .e2, .e8],
        .dean: [.e2, .e3],
        .butterfield: [.e3, .e4, .e5],
        .mccord: [.e4, .e16],
        .baldwin: [.e6, .e13, .e16],
        .woods: [.e6, .e7, .e9],
        .sloan: [.e7, .e8, .e9],
        // Evidence graph matching hex coords
        .e1: [.nixon, .mitchell, .e11, .e18],
        .e2: [.mitchell, .dean, .e3, .e11],
        .e3: [.dean, .butterfield, .e2, .e4],
        .e4: [.butterfield, .mccord, .e3, .e5],
        .e5: [.nixon, .butterfield, .e4, .e12, .e17],
        .e6: [.baldwin, .woods, .e7, .e14],
        .e7: [.woods, .sloan, .e6, .e8],
        .e8: [.sloan, .mitchell, .e7, .e9, .e10],
        .e9: [.nixon, .woods, .sloan, .e8, .e10, .e15],
        .e10: [.e8, .e9, .e11, .e15],
        .e11: [.e1, .e2, .e10, .e12, .e18],
        .e12: [.e5, .e11, .e17],
        .e13: [.nixon, .baldwin, .e14, .e16],
        .e14: [.e6, .e13, .e15],
        .e15: [.e9, .e10, .e14],
        .e16: [.mccord, .baldwin, .e13, .e17],
        .e17: [.e5, .e12, .e16, .e18],
        .e18: [.e1, .e11, .e17]
    ]

    static let evidenceSpaceDefinitions: [(BoardNodeID, [EvidenceColor])] = [
        (.e1, [.yellow]),
        (.e2, [.blue, .yellow]),
        (.e3, [.blue]),
        (.e4, [.green, .yellow]),
        (.e5, [.green]),
        (.e6, [.blue, .green]),
        (.e7, [.yellow]),
        (.e8, [.green]),
        (.e9, [.blue]),
        (.e10, [.yellow, .green]),
        (.e11, [.blue]),
        (.e12, [.yellow]),
        (.e13, [.green, .blue]),
        (.e14, [.yellow]),
        (.e15, [.blue, .green]),
        (.e16, [.green]),
        (.e17, [.blue, .yellow]),
        (.e18, [.yellow])
    ]

    static func makeInformants() -> [InformantState] {
        InformantID.allCases.map { InformantState(id: $0) }
    }

    static func makeEvidenceSpaces() -> [EvidenceSpaceState] {
        evidenceSpaceDefinitions.map { node, colors in
            EvidenceSpaceState(nodeID: node, allowedColors: colors, tokenID: nil, isFaceUp: false)
        }
    }

    static func makeEvidenceBag() -> [EvidenceToken] {
        var bag: [EvidenceToken] = []
        for _ in 0..<8 { bag.append(EvidenceToken(colors: .init(.blue))) }
        for _ in 0..<8 { bag.append(EvidenceToken(colors: .init(.yellow))) }
        for _ in 0..<8 { bag.append(EvidenceToken(colors: .init(.green))) }
        for _ in 0..<2 { bag.append(EvidenceToken(colors: .init(.blue, .yellow), hasMomentumBonus: true)) }
        for _ in 0..<2 { bag.append(EvidenceToken(colors: .init(.yellow, .green))) }
        for _ in 0..<2 { bag.append(EvidenceToken(colors: .init(.blue, .green))) }
        return bag.shuffled()
    }

    static func connectedInformantCount(in snapshot: GameSnapshot) -> Int {
        informantsConnectedToNixon(in: snapshot).count
    }

    static func informantsConnectedToNixon(in snapshot: GameSnapshot) -> [InformantID] {
        snapshot.informants
            .filter { $0.isPinned && $0.isFaceUp }
            .filter { isConnected(informant: $0.id, snapshot: snapshot) }
            .map(\.id)
    }

    static func isConnected(informant id: InformantID, snapshot: GameSnapshot) -> Bool {
        guard let start = informantNodes[id] else { return false }
        var visited: Set<BoardNodeID> = []
        var queue = [start]

        while !queue.isEmpty {
            let node = queue.removeFirst()
            if node == .nixon { return true }
            if visited.contains(node) { continue }
            visited.insert(node)

            for neighbor in adjacency[node, default: []] {
                if neighbor == .nixon {
                    if canTraverse(from: node, to: .nixon, snapshot: snapshot) {
                        return true
                    }
                    continue
                }
                if canTraverse(from: node, to: neighbor, snapshot: snapshot), !visited.contains(neighbor) {
                    queue.append(neighbor)
                }
            }
        }
        return false
    }

    private static func canTraverse(from: BoardNodeID, to: BoardNodeID, snapshot: GameSnapshot) -> Bool {
        if informantNodes.values.contains(from) {
            return evidenceSpace(snapshot, node: to)?.tokenID != nil && evidenceSpace(snapshot, node: to)?.isFaceUp == true
        }
        if to == .nixon {
            guard let fromSpace = evidenceSpace(snapshot, node: from) else { return false }
            return fromSpace.tokenID != nil && fromSpace.isFaceUp
        }
        guard let fromSpace = evidenceSpace(snapshot, node: from),
              let toSpace = evidenceSpace(snapshot, node: to) else { return false }
        return fromSpace.tokenID != nil && fromSpace.isFaceUp && toSpace.tokenID != nil && toSpace.isFaceUp
    }

    private static func evidenceSpace(_ snapshot: GameSnapshot, node: BoardNodeID) -> EvidenceSpaceState? {
        snapshot.evidenceSpaces.first { $0.nodeID == node }
    }
}
