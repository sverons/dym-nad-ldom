import SwiftUI

struct CorkBoardBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [WatergateTheme.corkLight, WatergateTheme.corkMid, WatergateTheme.corkDark],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            Canvas { context, size in
                for index in 0..<120 {
                    let x = CGFloat((index * 47) % Int(size.width))
                    let y = CGFloat((index * 83) % Int(size.height))
                    let dot = CGRect(x: x, y: y, width: 2.2, height: 2.2)
                    context.fill(
                        Path(ellipseIn: dot),
                        with: .color(.black.opacity(0.06 + Double(index % 5) * 0.02))
                    )
                }
            }
            .blendMode(.multiply)
        }
        .ignoresSafeArea()
    }
}

struct ShatteredGlassBackground: View {
    var body: some View {
        ZStack {
            // Night glass / window tone
            LinearGradient(
                colors: [
                    Color(red: 0.10, green: 0.12, blue: 0.16),
                    Color(red: 0.04, green: 0.05, blue: 0.07),
                    Color.black
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            // Soft window highlight
            RadialGradient(
                colors: [
                    Color.white.opacity(0.10),
                    Color.clear
                ],
                center: UnitPoint(x: 0.48, y: 0.36),
                startRadius: 10,
                endRadius: 320
            )

            Canvas { context, size in
                drawShatteredWindow(context: context, size: size)
            }
            .allowsHitTesting(false)

            // Keep UI readable at the bottom
            LinearGradient(
                colors: [
                    Color.clear,
                    Color.black.opacity(0.35),
                    Color.black.opacity(0.62)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        }
        .ignoresSafeArea()
    }

    private func drawShatteredWindow(context: GraphicsContext, size: CGSize) {
        let impact = CGPoint(x: size.width * 0.52, y: size.height * 0.34)
        let maxR = hypot(size.width, size.height)

        // Window sash / frame
        var frame = Path()
        let insetX = size.width * 0.07
        let insetY = size.height * 0.08
        frame.addRoundedRect(
            in: CGRect(x: insetX, y: insetY, width: size.width - insetX * 2, height: size.height - insetY * 2),
            cornerSize: CGSize(width: 10, height: 10)
        )
        context.stroke(frame, with: .color(Color.white.opacity(0.08)), lineWidth: 1.2)

        // Cross mullion
        var mullionV = Path()
        mullionV.move(to: CGPoint(x: size.width * 0.5, y: insetY))
        mullionV.addLine(to: CGPoint(x: size.width * 0.5, y: size.height - insetY))
        context.stroke(mullionV, with: .color(Color.white.opacity(0.06)), lineWidth: 1)

        var mullionH = Path()
        mullionH.move(to: CGPoint(x: insetX, y: size.height * 0.42))
        mullionH.addLine(to: CGPoint(x: size.width - insetX, y: size.height * 0.42))
        context.stroke(mullionH, with: .color(Color.white.opacity(0.06)), lineWidth: 1)

        // Fragment polygons (frosted shards)
        let shards: [(CGFloat, CGFloat, CGFloat, CGFloat, CGFloat)] = [
            (0.52, 0.34, 0.08, -0.35, 0.12),
            (0.52, 0.34, 0.18, 0.05, 0.10),
            (0.52, 0.34, 0.02, 0.22, 0.14),
            (0.52, 0.34, -0.20, 0.08, 0.11),
            (0.52, 0.34, -0.12, -0.24, 0.09),
            (0.40, 0.48, 0.10, 0.16, 0.13),
            (0.62, 0.46, -0.08, 0.18, 0.12),
            (0.35, 0.28, 0.14, -0.06, 0.10),
            (0.70, 0.30, -0.12, 0.08, 0.11)
        ]

        for shard in shards {
            let origin = CGPoint(x: size.width * shard.0, y: size.height * shard.1)
            let tip = CGPoint(
                x: origin.x + size.width * shard.2,
                y: origin.y + size.height * shard.3
            )
            let width = size.width * shard.4
            var path = Path()
            path.move(to: origin)
            path.addLine(to: CGPoint(x: tip.x + width * 0.35, y: tip.y - width * 0.15))
            path.addLine(to: tip)
            path.addLine(to: CGPoint(x: tip.x - width * 0.4, y: tip.y + width * 0.2))
            path.closeSubpath()
            context.fill(path, with: .color(Color.white.opacity(0.045)))
            context.stroke(path, with: .color(Color.white.opacity(0.10)), lineWidth: 0.7)
        }

        // Primary radiating cracks
        let majorAngles: [Double] = [
            -12, 8, 28, 52, 78, 110, 138, 168, 198, 228, 258, 292, 320, 348
        ]
        for (index, angle) in majorAngles.enumerated() {
            let radians = angle * .pi / 180
            let length = maxR * (0.55 + Double(index % 4) * 0.08)
            var path = Path()
            path.move(to: impact)
            let end = CGPoint(
                x: impact.x + CGFloat(cos(radians)) * length,
                y: impact.y + CGFloat(sin(radians)) * length
            )
            // Slight broken polyline for realism
            let mid1 = CGPoint(
                x: impact.x + (end.x - impact.x) * 0.38 + CGFloat(sin(radians)) * 10,
                y: impact.y + (end.y - impact.y) * 0.38 - CGFloat(cos(radians)) * 8
            )
            let mid2 = CGPoint(
                x: impact.x + (end.x - impact.x) * 0.72 - CGFloat(sin(radians)) * 7,
                y: impact.y + (end.y - impact.y) * 0.72 + CGFloat(cos(radians)) * 6
            )
            path.addLine(to: mid1)
            path.addLine(to: mid2)
            path.addLine(to: end)
            context.stroke(path, with: .color(Color.white.opacity(0.22)), lineWidth: index % 3 == 0 ? 1.6 : 1.1)
        }

        // Secondary cracks / branches
        let branches: [(Double, Double, Double)] = [
            (28, 0.35, 18), (52, 0.48, -22), (110, 0.4, 25),
            (168, 0.42, -18), (228, 0.38, 20), (292, 0.45, -16),
            (8, 0.55, 14), (198, 0.5, -12), (320, 0.36, 19)
        ]
        for branch in branches {
            let baseAngle = branch.0 * .pi / 180
            let base = CGPoint(
                x: impact.x + CGFloat(cos(baseAngle)) * maxR * branch.1,
                y: impact.y + CGFloat(sin(baseAngle)) * maxR * branch.1
            )
            let branchAngle = (branch.0 + branch.2) * .pi / 180
            var path = Path()
            path.move(to: base)
            path.addLine(to: CGPoint(
                x: base.x + CGFloat(cos(branchAngle)) * maxR * 0.18,
                y: base.y + CGFloat(sin(branchAngle)) * maxR * 0.18
            ))
            context.stroke(path, with: .color(Color.white.opacity(0.14)), lineWidth: 0.9)
        }

        // Impact star / crater
        for ring in 1...3 {
            let r = CGFloat(ring) * 5.5
            let rect = CGRect(x: impact.x - r, y: impact.y - r, width: r * 2, height: r * 2)
            context.stroke(Path(ellipseIn: rect), with: .color(Color.white.opacity(0.18 - Double(ring) * 0.04)), lineWidth: 0.8)
        }
        context.fill(
            Path(ellipseIn: CGRect(x: impact.x - 2.5, y: impact.y - 2.5, width: 5, height: 5)),
            with: .color(Color.white.opacity(0.35))
        )

        // Sparse dust / chips
        for i in 0..<28 {
            let a = Double(i) * 0.73
            let d = 18 + Double((i * 37) % 120)
            let p = CGPoint(
                x: impact.x + CGFloat(cos(a)) * d,
                y: impact.y + CGFloat(sin(a * 1.3)) * d * 0.85
            )
            let chip = CGRect(x: p.x, y: p.y, width: 1.4, height: 1.4)
            context.fill(Path(ellipseIn: chip), with: .color(Color.white.opacity(0.12)))
        }
    }
}

struct ParchmentPanel: ViewModifier {
    var cornerRadius: CGFloat = 10
    var padding: CGFloat = 12

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [WatergateTheme.parchment, WatergateTheme.parchmentDark],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(WatergateTheme.border.opacity(0.7), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.22), radius: 6, y: 3)
    }
}

extension View {
    func parchmentPanel(cornerRadius: CGFloat = 10, padding: CGFloat = 12) -> some View {
        modifier(ParchmentPanel(cornerRadius: cornerRadius, padding: padding))
    }
}

struct WatergateMenuButtonStyle: ButtonStyle {
    var tint: Color

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(WatergateTheme.labelFont(15))
            .foregroundStyle(tint == WatergateTheme.menuGray ? .black : .white)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(tint.opacity(configuration.isPressed ? 0.75 : 1))
            )
            .shadow(color: .black.opacity(0.35), radius: configuration.isPressed ? 2 : 5, y: configuration.isPressed ? 1 : 3)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

struct GameHUDBar<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(WatergateTheme.hudBar)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
    }
}

struct PaperActionPanel<Content: View>: View {
    let title: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(title)
                .font(WatergateTheme.labelFont(16))
                .foregroundStyle(WatergateTheme.text)
            content
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(WatergateTheme.paperPanel)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(WatergateTheme.border, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.28), radius: 10, y: 5)
    }
}
