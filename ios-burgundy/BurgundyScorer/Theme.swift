import SwiftUI

enum BurgundyTheme {
    static let accent = Color(red: 0.42, green: 0.12, blue: 0.16)
    static let accentLight = Color(red: 0.94, green: 0.64, blue: 0.68)

    static let background = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.08, green: 0.07, blue: 0.05, alpha: 1)
            : UIColor(red: 0.96, green: 0.95, blue: 0.93, alpha: 1)
    })

    static let surface = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.12, green: 0.10, blue: 0.08, alpha: 1)
            : UIColor.white
    })

    static let surface2 = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.16, green: 0.14, blue: 0.11, alpha: 1)
            : UIColor(red: 0.98, green: 0.97, blue: 0.96, alpha: 1)
    })

    static let text = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.93, green: 0.91, blue: 0.87, alpha: 1)
            : UIColor(red: 0.10, green: 0.09, blue: 0.07, alpha: 1)
    })

    static let muted = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.69, green: 0.65, blue: 0.60, alpha: 1)
            : UIColor(red: 0.35, green: 0.33, blue: 0.29, alpha: 1)
    })

    static let border = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.22, green: 0.19, blue: 0.16, alpha: 1)
            : UIColor(red: 0.87, green: 0.84, blue: 0.79, alpha: 1)
    })

    static func rankColor(_ place: Int) -> Color {
        switch place {
        case 1: return Color(red: 0.85, green: 0.65, blue: 0.13)
        case 2: return Color(red: 0.75, green: 0.75, blue: 0.78)
        case 3: return Color(red: 0.80, green: 0.50, blue: 0.20)
        default: return BurgundyTheme.muted
        }
    }
}
