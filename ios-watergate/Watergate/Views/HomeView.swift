import SwiftUI

struct HomeView: View {
    @ObservedObject var store: GameStore

    var body: some View {
        ZStack {
            ShatteredGlassBackground()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: 16) {
                    roleButtons
                    startButton
                }
                .padding(.horizontal, 24)

                branding
                    .padding(.top, 28)
                    .padding(.bottom, 24)
            }
        }
    }

    private var roleButtons: some View {
        VStack(spacing: 10) {
            Text("Роль для игры на одном устройстве")
                .font(WatergateTheme.bodySerif(14))
                .foregroundStyle(WatergateTheme.mutedOnDark)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)

            ForEach(PlayerRole.allCases) { role in
                Button {
                    store.selectedRole = role
                } label: {
                    ZStack {
                        Text(role.title)
                            .frame(maxWidth: .infinity)
                            .multilineTextAlignment(.center)
                        HStack {
                            Spacer()
                            Image(systemName: "checkmark")
                                .opacity(store.selectedRole == role ? 1 : 0)
                        }
                    }
                }
                .buttonStyle(WatergateMenuButtonStyle(
                    tint: store.selectedRole == role ? WatergateTheme.menuTeal : WatergateTheme.menuGray
                ))
            }
        }
    }

    private var startButton: some View {
        VStack(spacing: 10) {
            Button {
                store.startGame()
            } label: {
                Text("На одном iPhone")
                    .frame(maxWidth: .infinity)
                    .multilineTextAlignment(.center)
            }
            .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))

            Button {
                store.selectedRole = .editor
                store.openLobby(asHost: true)
            } label: {
                Text("Создать игру по Wi‑Fi")
                    .frame(maxWidth: .infinity)
                    .multilineTextAlignment(.center)
            }
            .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))

            Button {
                store.openLobby(asHost: false)
            } label: {
                Text("Присоединиться по Wi‑Fi")
                    .frame(maxWidth: .infinity)
                    .multilineTextAlignment(.center)
            }
            .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
        }
    }

    private var branding: some View {
        VStack(spacing: 4) {
            Text("МАТТИАС КРАМЕР")
                .font(.system(size: 11, weight: .medium, design: .default))
                .tracking(2)
                .foregroundStyle(WatergateTheme.mutedOnDark)
            Text("УОТЕРГЕЙТ")
                .font(WatergateTheme.titleFont(42))
                .tracking(3)
                .foregroundStyle(WatergateTheme.textOnDark)
            Text("Настольная игра")
                .font(WatergateTheme.bodySerif(14))
                .italic()
                .foregroundStyle(WatergateTheme.mutedOnDark)
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity, alignment: .center)
    }
}
