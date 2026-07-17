import SwiftUI

struct ContentView: View {
    @StateObject private var store = GameStore()

    var body: some View {
        Group {
            if store.showLobby {
                if store.multiplayer.isHosting {
                    LocalLobbyView(store: store, isHosting: true)
                } else {
                    LocalLobbyView(store: store, isHosting: false)
                }
            } else if store.showHome {
                HomeView(store: store)
            } else {
                GameView(store: store)
            }
        }
        .preferredColorScheme(.dark)
    }
}
