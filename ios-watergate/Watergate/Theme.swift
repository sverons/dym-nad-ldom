import SwiftUI

enum WatergateTheme {
    // Roles
    static let editorAccent = Color(red: 0.16, green: 0.36, blue: 0.62)
    static let nixonAccent = Color(red: 0.72, green: 0.18, blue: 0.16)
    static let editorLight = Color(red: 0.78, green: 0.86, blue: 0.96)
    static let nixonLight = Color(red: 0.95, green: 0.82, blue: 0.82)

    // Eerko-inspired palette
    static let noirBackground = Color(red: 0.04, green: 0.04, blue: 0.05)
    static let corkDark = Color(red: 0.30, green: 0.22, blue: 0.15)
    static let corkMid = Color(red: 0.42, green: 0.31, blue: 0.22)
    static let corkLight = Color(red: 0.52, green: 0.39, blue: 0.28)
    static let parchment = Color(red: 0.91, green: 0.86, blue: 0.76)
    static let parchmentDark = Color(red: 0.82, green: 0.75, blue: 0.64)
    static let paperPanel = Color(red: 0.96, green: 0.94, blue: 0.90)
    static let stringRed = Color(red: 0.72, green: 0.16, blue: 0.14)
    static let menuTeal = Color(red: 0.18, green: 0.72, blue: 0.68)
    static let menuGray = Color(red: 0.82, green: 0.82, blue: 0.82)
    static let hudBar = Color(red: 0.08, green: 0.08, blue: 0.10).opacity(0.88)
    static let trackYellow = Color(red: 0.95, green: 0.82, blue: 0.38)
    static let trackRed = Color(red: 0.78, green: 0.22, blue: 0.18)

    static let background = noirBackground
    static let surface = paperPanel
    static let text = Color(red: 0.12, green: 0.10, blue: 0.09)
    static let textOnDark = Color(red: 0.94, green: 0.93, blue: 0.91)
    static let muted = Color(red: 0.45, green: 0.40, blue: 0.36)
    static let mutedOnDark = Color(red: 0.72, green: 0.68, blue: 0.64)
    static let border = Color(red: 0.68, green: 0.60, blue: 0.52)

    static func roleColor(_ role: PlayerRole) -> Color {
        role == .editor ? editorAccent : nixonAccent
    }

    static func evidenceColor(_ color: EvidenceColor) -> Color {
        switch color {
        case .blue: return Color(red: 0.20, green: 0.45, blue: 0.82)
        case .yellow: return Color(red: 0.90, green: 0.72, blue: 0.18)
        case .green: return Color(red: 0.18, green: 0.58, blue: 0.36)
        }
    }

    static func titleFont(_ size: CGFloat = 34) -> Font {
        .system(size: size, weight: .black, design: .serif)
    }

    static func bodySerif(_ size: CGFloat = 15) -> Font {
        .system(size: size, weight: .regular, design: .serif)
    }

    static func labelFont(_ size: CGFloat = 13) -> Font {
        .system(size: size, weight: .semibold, design: .default)
    }
}
