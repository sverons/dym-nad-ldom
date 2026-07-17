import SwiftUI

struct ResearchTrackView: View {
    let snapshot: GameSnapshot

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Трек расследования")
                .font(.system(size: 11, weight: .bold, design: .serif))
                .foregroundStyle(WatergateTheme.text.opacity(0.8))

            HStack(spacing: 3) {
                ForEach((-5)...5, id: \.self) { pos in
                    trackCell(position: pos)
                }
            }

            if !snapshot.trackEvidence.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(snapshot.trackEvidence) { item in
                            evidenceChip(item)
                        }
                    }
                }
            }
        }
        .parchmentPanel(cornerRadius: 12, padding: 10)
    }

    @ViewBuilder
    private func trackCell(position: Int) -> some View {
        let hasInitiative = snapshot.initiativePosition == position
        let hasMomentum = snapshot.momentumPosition == position
        VStack(spacing: 2) {
            Text(position == 0 ? "0" : "\(abs(position))")
                .font(.system(size: 8, weight: .bold, design: .monospaced))
                .foregroundStyle(.black.opacity(0.85))
            ZStack {
                RoundedRectangle(cornerRadius: 4, style: .continuous)
                    .fill(cellColor(position))
                    .frame(maxWidth: .infinity, minHeight: 36)
                VStack(spacing: 3) {
                    if hasInitiative {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [Color.white, Color(white: 0.85)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 10, height: 10)
                            .overlay(Circle().stroke(Color.black.opacity(0.15), lineWidth: 0.5))
                    }
                    if hasMomentum {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [WatergateTheme.trackRed, WatergateTheme.trackRed.opacity(0.7)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 10, height: 10)
                            .overlay(Circle().stroke(Color.black.opacity(0.15), lineWidth: 0.5))
                    }
                }
            }
        }
    }

    private func cellColor(_ position: Int) -> Color {
        if position == 0 { return WatergateTheme.trackYellow }
        if position < 0 {
            let intensity = 0.35 + Double(-position) * 0.08
            return WatergateTheme.editorAccent.opacity(intensity)
        }
        let intensity = 0.35 + Double(position) * 0.08
        return WatergateTheme.trackRed.opacity(intensity)
    }

    private func evidenceChip(_ item: TrackEvidence) -> some View {
        HStack(spacing: 6) {
            Circle()
                .fill(WatergateTheme.evidenceColor(item.token.colors.primary))
                .frame(width: 10, height: 10)
            Text(item.isFaceUp ? "открыта" : "тайна")
                .font(.system(size: 11, weight: .bold, design: .serif))
                .foregroundStyle(WatergateTheme.text.opacity(0.8))
            Text("@\(item.position)")
                .font(.caption2.monospacedDigit())
                .foregroundStyle(WatergateTheme.text.opacity(0.8))
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(Color.white.opacity(0.7))
        .clipShape(Capsule())
        .overlay(Capsule().stroke(WatergateTheme.border.opacity(0.6)))
    }
}
