import SwiftUI

/// Полная доска как в «Уотергейтском деле»: пробковая сеть + вертикальный трек.
struct BoardView: View {
    let snapshot: GameSnapshot
    var onPin: ((BoardNodeID, EvidenceToken) -> Void)?

    var body: some View {
        GeometryReader { geo in
            fullBoard(size: geo.size)
        }
        .frame(height: 300)
        .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 6, style: .continuous)
                .stroke(Color.black.opacity(0.3), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.25), radius: 5, y: 2)
    }

    private func fullBoard(size: CGSize) -> some View {
        ZStack {
            corkFill
            investigationWeb(size: size)
        }
    }

    private var corkFill: some View {
        ZStack {
            Image("InvestigationBoard")
                .resizable()
                .scaledToFill()
                .opacity(0.42)
                .blur(radius: 0.3)

            LinearGradient(
                colors: [
                    Color(red: 0.60, green: 0.46, blue: 0.32).opacity(0.88),
                    Color(red: 0.48, green: 0.36, blue: 0.24).opacity(0.92),
                    Color(red: 0.40, green: 0.29, blue: 0.19).opacity(0.95)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Canvas { context, size in
                for i in 0..<140 {
                    let x = CGFloat((i * 61) % max(Int(size.width), 1))
                    let y = CGFloat((i * 89) % max(Int(size.height), 1))
                    context.fill(
                        Path(ellipseIn: CGRect(x: x, y: y, width: 1.6, height: 1.6)),
                        with: .color(.black.opacity(0.06 + Double(i % 4) * 0.01))
                    )
                }
            }
        }
    }

    private func investigationWeb(size: CGSize) -> some View {
        let points = Dictionary(uniqueKeysWithValues: BoardNodeID.allCases.map {
            ($0, BoardLayout.point(for: $0, in: size, inset: 28))
        })

        return ZStack {
            titleStrip
                .position(x: size.width * 0.28, y: 16)

            campaignPoster
                .position(x: size.width * 0.88, y: 26)

            newspaperScrap
                .position(x: size.width * 0.22, y: size.height - 14)

            Canvas { context, _ in
                drawStringWeb(context: context, size: size)
                drawPlayEdges(context: context, points: points)
            }

            ForEach(BoardLayout.evidenceSpaceDefinitions, id: \.0) { node, colors in
                evidenceSlip(node, colors: colors)
                    .position(points[node] ?? .zero)
                    .rotationEffect(.degrees(slipRotation(for: node)))
            }

            ForEach(InformantID.allCases) { informant in
                let state = snapshot.informants.first(where: { $0.id == informant }) ?? InformantState(id: informant)
                informantPolaroid(state)
                    .position(points[BoardLayout.informantNodes[informant]!] ?? .zero)
                    .rotationEffect(.degrees(informantRotation(for: informant)))
            }

            nixonPolaroid
                .position(points[.nixon] ?? CGPoint(x: size.width / 2, y: size.height / 2))
        }
        .frame(width: size.width, height: size.height)
    }

    private var titleStrip: some View {
        Text("Уотергейтское дело")
            .font(.system(size: 10, weight: .semibold, design: .serif))
            .foregroundStyle(Color.black.opacity(0.82))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color(red: 0.96, green: 0.93, blue: 0.86))
            .overlay(Rectangle().stroke(Color.black.opacity(0.18), lineWidth: 0.5))
            .shadow(color: .black.opacity(0.2), radius: 1, y: 1)
            .rotationEffect(.degrees(-1.5))
    }

    private var campaignPoster: some View {
        VStack(spacing: 0) {
            Text("STRENGTH")
            Text("PEACE")
            Text("STABILITY")
        }
        .font(.system(size: 5, weight: .black))
        .foregroundStyle(.white)
        .padding(.horizontal, 5)
        .padding(.vertical, 4)
        .background(
            LinearGradient(
                colors: [Color(red: 0.75, green: 0.12, blue: 0.14), Color(red: 0.12, green: 0.2, blue: 0.55)],
                startPoint: .top,
                endPoint: .bottom
            )
        )
        .rotationEffect(.degrees(5))
        .shadow(color: .black.opacity(0.25), radius: 1, y: 1)
    }

    private var newspaperScrap: some View {
        Text("Nixon bugged own Office")
            .font(.system(size: 6, weight: .bold, design: .serif))
            .foregroundStyle(.black.opacity(0.7))
            .padding(.horizontal, 5)
            .padding(.vertical, 3)
            .background(Color(red: 0.93, green: 0.90, blue: 0.82))
            .rotationEffect(.degrees(-3))
    }

    // MARK: - Web drawing

    private func drawStringWeb(context: GraphicsContext, size: CGSize) {
        let verts = BoardLayout.decorativeHexVertices(in: size, inset: 28)
        let usable = min(size.width, size.height) - 56
        let hexSize = usable / 7.0
        let linkLimit = hexSize * 1.12

        for i in 0..<verts.count {
            for j in (i + 1)..<verts.count {
                let dx = verts[i].x - verts[j].x
                let dy = verts[i].y - verts[j].y
                let dist = sqrt(dx * dx + dy * dy)
                if dist > 1, dist < linkLimit {
                    var path = Path()
                    path.move(to: verts[i])
                    path.addLine(to: verts[j])
                    context.stroke(path, with: .color(WatergateTheme.stringRed.opacity(0.62)), lineWidth: 1.35)
                }
            }
        }

        for p in verts {
            let pin = CGRect(x: p.x - 2.5, y: p.y - 2.5, width: 5, height: 5)
            context.fill(Path(ellipseIn: pin), with: .color(WatergateTheme.stringRed))
            context.stroke(Path(ellipseIn: pin.insetBy(dx: -0.35, dy: -0.35)), with: .color(.black.opacity(0.25)), lineWidth: 0.5)
            context.fill(
                Path(ellipseIn: CGRect(x: p.x - 1.2, y: p.y - 1.5, width: 1.4, height: 1.4)),
                with: .color(.white.opacity(0.35))
            )
        }
    }

    private func drawPlayEdges(context: GraphicsContext, points: [BoardNodeID: CGPoint]) {
        var drawn = Set<String>()
        for (from, neighbors) in BoardLayout.adjacency {
            guard let a = points[from] else { continue }
            for to in neighbors {
                let key = [from.rawValue, to.rawValue].sorted().joined(separator: "|")
                if drawn.contains(key) { continue }
                drawn.insert(key)
                guard let b = points[to] else { continue }
                let active = isEdgeActive(from: from, to: to)
                var path = Path()
                path.move(to: a)
                path.addLine(to: b)
                context.stroke(
                    path,
                    with: .color(WatergateTheme.stringRed.opacity(active ? 0.98 : 0.28)),
                    lineWidth: active ? 2.2 : 0.8
                )
            }
        }
    }

    private func isEdgeActive(from: BoardNodeID, to: BoardNodeID) -> Bool {
        func faceUp(_ node: BoardNodeID) -> Bool {
            guard let space = snapshot.evidenceSpaces.first(where: { $0.nodeID == node }) else { return false }
            return space.tokenID != nil && space.isFaceUp
        }
        if from == .nixon { return faceUp(to) }
        if to == .nixon { return faceUp(from) }
        if BoardLayout.informantNodes.values.contains(from) { return faceUp(to) }
        if BoardLayout.informantNodes.values.contains(to) { return faceUp(from) }
        return faceUp(from) && faceUp(to)
    }

    // MARK: - Pieces

    private var nixonPolaroid: some View {
        VStack(spacing: 1) {
            ZStack {
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color(red: 0.95, green: 0.93, blue: 0.88))
                    .frame(width: 34, height: 38)
                    .shadow(color: .black.opacity(0.3), radius: 2, y: 1)
                RoundedRectangle(cornerRadius: 1)
                    .fill(LinearGradient(colors: [Color(white: 0.4), Color(white: 0.18)], startPoint: .top, endPoint: .bottom))
                    .frame(width: 26, height: 24)
                Circle().fill(Color(white: 0.75)).frame(width: 9, height: 9).offset(y: -3)
                Capsule().fill(Color(white: 0.68)).frame(width: 13, height: 5).offset(y: 6)
                Circle().fill(WatergateTheme.stringRed).frame(width: 6, height: 6).offset(y: -17)
            }
            Text("Никсон")
                .font(.system(size: 7, weight: .bold, design: .serif))
                .padding(.horizontal, 3)
                .background(Color.white.opacity(0.9))
        }
    }

    private func informantPolaroid(_ informant: InformantState) -> some View {
        let connected = informant.isPinned && informant.isFaceUp
            && BoardLayout.isConnected(informant: informant.id, snapshot: snapshot)
        let color = WatergateTheme.evidenceColor(informant.id.boardColor)

        return VStack(spacing: 1) {
            ZStack {
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color(red: 0.96, green: 0.94, blue: 0.90).opacity(informant.isPinned ? 1 : 0.5))
                    .frame(width: 28, height: 32)
                    .overlay(
                        RoundedRectangle(cornerRadius: 2)
                            .stroke(connected ? WatergateTheme.editorAccent : Color.black.opacity(0.2), lineWidth: connected ? 1.4 : 0.5)
                    )
                    .shadow(color: .black.opacity(0.2), radius: 1, y: 1)
                RoundedRectangle(cornerRadius: 1)
                    .fill(color.opacity(informant.isFaceUp ? 0.5 : 0.22))
                    .frame(width: 20, height: 18)
                Circle().fill(color).frame(width: 6, height: 6).offset(x: 10, y: -12)
                Circle().fill(WatergateTheme.stringRed).frame(width: 5, height: 5).offset(y: -15)
            }
            Text(informant.isPinned ? informant.id.displayName : "\(informant.id.displayName)?")
                .font(.system(size: 6, weight: .bold, design: .serif))
                .lineLimit(1)
                .minimumScaleFactor(0.55)
                .padding(.horizontal, 2)
                .background(Color.white.opacity(0.88))
        }
        .opacity(informant.isPinned ? 1 : 0.75)
    }

    private func evidenceSlip(_ node: BoardNodeID, colors: [EvidenceColor]) -> some View {
        let space = snapshot.evidenceSpaces.first { $0.nodeID == node }
        let occupied = space?.tokenID != nil
        let faceUp = space?.isFaceUp == true
        let token = space.flatMap { $0.tokenID }.flatMap { snapshot.placedTokens[$0] }
        let width: CGFloat = colors.count > 1 ? 22 : 16

        return Button {
            guard let space, let tokenID = space.tokenID, let token = snapshot.placedTokens[tokenID] else { return }
            onPin?(node, token)
        } label: {
            ZStack {
                RoundedRectangle(cornerRadius: 1)
                    .fill(occupied ? (faceUp ? Color(red: 0.97, green: 0.95, blue: 0.9) : Color(white: 0.22)) : Color(red: 0.95, green: 0.92, blue: 0.85))
                    .frame(width: width, height: 10)
                    .overlay(RoundedRectangle(cornerRadius: 1).stroke(Color.black.opacity(0.25), lineWidth: 0.45))
                    .shadow(color: .black.opacity(0.18), radius: 0.6, y: 0.4)

                if occupied, let token {
                    if faceUp {
                        HStack(spacing: 1) {
                            Circle().fill(WatergateTheme.evidenceColor(token.colors.primary)).frame(width: 5.5, height: 5.5)
                            if let s = token.colors.secondary {
                                Circle().fill(WatergateTheme.evidenceColor(s)).frame(width: 5.5, height: 5.5)
                            }
                        }
                    } else {
                        RoundedRectangle(cornerRadius: 1)
                            .fill(Color(red: 0.28, green: 0.2, blue: 0.15))
                            .frame(width: 11, height: 7)
                    }
                } else {
                    HStack(spacing: 0) {
                        ForEach(Array(colors.enumerated()), id: \.offset) { _, color in
                            Rectangle()
                                .fill(WatergateTheme.evidenceColor(color).opacity(0.85))
                                .frame(width: colors.count > 1 ? width / 2 - 1 : width - 3, height: 6)
                        }
                    }
                }

                Circle()
                    .fill(WatergateTheme.stringRed)
                    .frame(width: 3.8, height: 3.8)
                    .offset(y: -6.5)
            }
        }
        .buttonStyle(.plain)
        .disabled(onPin == nil || occupied)
    }

    private func slipRotation(for node: BoardNodeID) -> Double {
        Double(abs(node.rawValue.hashValue % 11)) - 5
    }

    private func informantRotation(for id: InformantID) -> Double {
        switch id {
        case .dean: return -4
        case .butterfield: return 5
        case .sloan: return -5
        case .mitchell: return 2
        case .woods: return -3
        case .baldwin: return 6
        case .mccord: return -4
        }
    }
}
