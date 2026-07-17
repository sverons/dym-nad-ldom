import Foundation
import MultipeerConnectivity
import Combine

@MainActor
final class LocalMultiplayerService: NSObject, ObservableObject {
    static let serviceType = "watergate-game"

    @Published private(set) var discoveredPeers: [MCPeerID] = []
    @Published private(set) var connectedPeerName: String?
    @Published private(set) var statusMessage = "Не подключено"
    @Published private(set) var isHosting = false
    @Published private(set) var isBrowsing = false

    var onMessage: ((NetworkMessage, MCPeerID) -> Void)?

    private let peerID: MCPeerID
    private var session: MCSession?
    private var advertiser: MCNearbyServiceAdvertiser?
    private var browser: MCNearbyServiceBrowser?

    override init() {
        let name = UIDevice.current.name
        peerID = MCPeerID(displayName: name)
        super.init()
    }

    var isConnected: Bool {
        session?.connectedPeers.isEmpty == false
    }

    func startHosting() {
        stop()
        let session = MCSession(peer: peerID, securityIdentity: nil, encryptionPreference: .required)
        session.delegate = self
        self.session = session

        let advertiser = MCNearbyServiceAdvertiser(
            peer: peerID,
            discoveryInfo: ["mode": "watergate"],
            serviceType: Self.serviceType
        )
        advertiser.delegate = self
        advertiser.startAdvertisingPeer()
        self.advertiser = advertiser
        isHosting = true
        statusMessage = "Ожидание соперника по Wi‑Fi…"
    }

    func startBrowsing() {
        stop()
        let session = MCSession(peer: peerID, securityIdentity: nil, encryptionPreference: .required)
        session.delegate = self
        self.session = session

        let browser = MCNearbyServiceBrowser(peer: peerID, serviceType: Self.serviceType)
        browser.delegate = self
        browser.startBrowsingForPeers()
        self.browser = browser
        isBrowsing = true
        statusMessage = "Поиск игр в локальной сети…"
    }

    func invite(_ peer: MCPeerID) {
        guard let session else { return }
        browser?.invitePeer(peer, to: session, withContext: nil, timeout: 20)
        statusMessage = "Подключение к \(peer.displayName)…"
    }

    func stop() {
        advertiser?.stopAdvertisingPeer()
        browser?.stopBrowsingForPeers()
        session?.disconnect()
        advertiser = nil
        browser = nil
        session = nil
        discoveredPeers = []
        connectedPeerName = nil
        isHosting = false
        isBrowsing = false
        if statusMessage != "Не подключено" {
            statusMessage = "Не подключено"
        }
    }

    func send(_ message: NetworkMessage) {
        guard let session, let data = try? NetworkCodec.encode(message) else { return }
        guard !session.connectedPeers.isEmpty else { return }
        do {
            try session.send(data, toPeers: session.connectedPeers, with: .reliable)
        } catch {
            statusMessage = "Ошибка отправки: \(error.localizedDescription)"
        }
    }

    private func handleReceived(_ data: Data, from peer: MCPeerID) {
        guard let message = try? NetworkCodec.decode(data) else { return }
        onMessage?(message, peer)
    }
}

extension LocalMultiplayerService: MCSessionDelegate {
    nonisolated func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
        Task { @MainActor in
            switch state {
            case .connected:
                connectedPeerName = peerID.displayName
                statusMessage = "Подключено: \(peerID.displayName)"
                send(.hello(peerID.displayName))
            case .connecting:
                statusMessage = "Подключение…"
            case .notConnected:
                if connectedPeerName == peerID.displayName {
                    connectedPeerName = nil
                }
                statusMessage = "Соединение потеряно"
            @unknown default:
                break
            }
        }
    }

    nonisolated func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
        Task { @MainActor in
            handleReceived(data, from: peerID)
        }
    }

    nonisolated func session(_ session: MCSession, didReceive stream: InputStream, withName streamName: String, fromPeer peerID: MCPeerID) {}
    nonisolated func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, with progress: Progress) {}
    nonisolated func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {}
}

extension LocalMultiplayerService: MCNearbyServiceAdvertiserDelegate {
    nonisolated func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didReceiveInvitationFromPeer peerID: MCPeerID, withContext context: Data?, invitationHandler: @escaping (Bool, MCSession?) -> Void) {
        Task { @MainActor in
            statusMessage = "Запрос от \(peerID.displayName)"
            invitationHandler(true, session)
        }
    }
}

extension LocalMultiplayerService: MCNearbyServiceBrowserDelegate {
    nonisolated func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID, withDiscoveryInfo info: [String: String]?) {
        Task { @MainActor in
            if !discoveredPeers.contains(where: { $0.displayName == peerID.displayName }) {
                discoveredPeers.append(peerID)
            }
        }
    }

    nonisolated func browser(_ browser: MCNearbyServiceBrowser, lostPeer peerID: MCPeerID) {
        Task { @MainActor in
            discoveredPeers.removeAll { $0.displayName == peerID.displayName }
        }
    }
}

import UIKit
