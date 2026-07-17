import SwiftUI

struct LocalLobbyView: View {
    @ObservedObject var store: GameStore
    let isHosting: Bool

    var body: some View {
        ZStack {
            ShatteredGlassBackground()

            VStack(spacing: 20) {
                header
                statusCard
                peerList
                rolePickerIfHost
                actionButtons
            }
            .padding(20)
        }
    }

    private var header: some View {
        VStack(spacing: 6) {
            Text(isHosting ? "Создать игру" : "Присоединиться")
                .font(WatergateTheme.titleFont(26))
                .foregroundStyle(WatergateTheme.textOnDark)
            Text("Локальная сеть Wi‑Fi")
                .font(WatergateTheme.bodySerif(14))
                .foregroundStyle(WatergateTheme.mutedOnDark)
        }
    }

    private var statusCard: some View {
        Text(store.multiplayer.statusMessage)
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.textOnDark)
            .frame(maxWidth: .infinity)
            .padding(14)
            .background(Color.white.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    @ViewBuilder
    private var peerList: some View {
        if !isHosting {
            VStack(alignment: .leading, spacing: 10) {
                Text("Найденные игры")
                    .font(WatergateTheme.labelFont())
                    .foregroundStyle(WatergateTheme.mutedOnDark)

                if store.multiplayer.discoveredPeers.isEmpty {
                    Text("Убедитесь, что оба устройства в одной Wi‑Fi сети")
                        .font(.caption)
                        .foregroundStyle(WatergateTheme.mutedOnDark)
                        .frame(maxWidth: .infinity, alignment: .leading)
                } else {
                    ForEach(store.multiplayer.discoveredPeers, id: \.displayName) { peer in
                        Button {
                            store.multiplayer.invite(peer)
                        } label: {
                            HStack {
                                Image(systemName: "wifi")
                                Text(peer.displayName)
                                Spacer()
                                Text("Подключить")
                                    .font(.caption.weight(.semibold))
                            }
                        }
                        .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))
                    }
                }
            }
        } else if store.multiplayer.isConnected {
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(WatergateTheme.menuTeal)
                Text("Соперник подключён: \(store.multiplayer.connectedPeerName ?? "")")
                    .font(WatergateTheme.bodySerif(14))
                    .foregroundStyle(WatergateTheme.textOnDark)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private var rolePickerIfHost: some View {
        if isHosting && store.multiplayer.isConnected {
            VStack(alignment: .leading, spacing: 10) {
                Text("Ваша роль")
                    .font(WatergateTheme.labelFont())
                    .foregroundStyle(WatergateTheme.mutedOnDark)

                ForEach(PlayerRole.allCases) { role in
                    Button {
                        store.selectedRole = role
                    } label: {
                        HStack {
                            Text(role.title)
                            Spacer()
                            if store.selectedRole == role {
                                Image(systemName: "checkmark")
                            }
                        }
                    }
                    .buttonStyle(WatergateMenuButtonStyle(
                        tint: store.selectedRole == role ? WatergateTheme.menuTeal : WatergateTheme.menuGray
                    ))
                }
            }
        }
    }

    private var actionButtons: some View {
        VStack(spacing: 10) {
            if isHosting && store.multiplayer.isConnected {
                Button {
                    store.startNetworkGameAsHost()
                } label: {
                    Text("Начать игру")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))
            }

            if !isHosting && store.multiplayer.isConnected {
                Text("Ожидание старта от хоста…")
                    .font(WatergateTheme.bodySerif(14))
                    .foregroundStyle(WatergateTheme.mutedOnDark)
            }

            Button {
                store.closeLobby()
            } label: {
                Text("Отмена")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
        }
    }
}
