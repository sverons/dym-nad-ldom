import SwiftUI

struct PassDeviceView: View {
    let role: PlayerRole
    let onContinue: () -> Void

    var body: some View {
        ZStack {
            ShatteredGlassBackground()

            VStack(spacing: 24) {
                Text("Передайте iPhone")
                    .font(WatergateTheme.titleFont(30))
                    .foregroundStyle(WatergateTheme.textOnDark)

                Text("Сейчас ход: \(role.title)")
                    .font(WatergateTheme.bodySerif(18))
                    .foregroundStyle(WatergateTheme.menuTeal)

                Text(role == .editor
                     ? "Не показывайте карты Никсона."
                     : "Не показывайте карты редактора.")
                    .font(WatergateTheme.bodySerif(14))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(WatergateTheme.mutedOnDark)
                    .padding(.horizontal, 28)

                Button("Готов", action: onContinue)
                    .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))
                    .padding(.horizontal, 48)
                    .padding(.top, 8)
            }
            .padding(32)
        }
    }
}
