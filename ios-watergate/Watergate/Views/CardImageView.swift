import SwiftUI
import UIKit

enum CardPhotoAssets {
    static let catalogName = "Cards"

    static func imageName(for cardID: String) -> String {
        cardID
    }

    static func backName(for role: PlayerRole) -> String {
        role == .editor ? "back_editor" : "back_nixon"
    }

    static func uiImage(named name: String) -> UIImage? {
        UIImage(named: name, in: Bundle.main, compatibleWith: nil)
    }

    static func hasPhoto(for cardID: String) -> Bool {
        uiImage(named: cardID) != nil
    }
}

enum CardImageStyle {
    case hand
    case full
    case back(PlayerRole)
}

struct CardImageView: View {
    let card: CardDefinition
    var style: CardImageStyle = .hand
    var isHighlighted = false

    private var cardSize: CGSize {
        switch style {
        case .hand, .back: return CGSize(width: 108, height: 162)
        case .full: return CGSize(width: 300, height: 450)
        }
    }

    private var isFullStyle: Bool {
        if case .full = style { return true }
        return false
    }

    var body: some View {
        Group {
            if case .back(let role) = style {
                photoBack(role: role)
            } else if CardPhotoAssets.hasPhoto(for: card.id) {
                photoFace
            } else {
                CardIllustrationView(card: card, style: style, isHighlighted: isHighlighted)
            }
        }
        .frame(width: cardSize.width, height: cardSize.height)
        .clipShape(RoundedRectangle(cornerRadius: isFullStyle ? 12 : 6, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: isFullStyle ? 12 : 6, style: .continuous)
                .stroke(Color.black.opacity(isHighlighted ? 0.35 : 0.12), lineWidth: isHighlighted ? 2 : 0.8)
        )
        .shadow(color: .black.opacity(isHighlighted ? 0.38 : 0.28), radius: isHighlighted ? 12 : 7, y: isHighlighted ? 6 : 4)
    }

    private var photoFace: some View {
        Group {
            if isFullStyle {
                Image(CardPhotoAssets.imageName(for: card.id))
                    .resizable()
                    .interpolation(.high)
                    .scaledToFit()
            } else {
                Image(CardPhotoAssets.imageName(for: card.id))
                    .resizable()
                    .scaledToFill()
            }
        }
        .frame(width: cardSize.width, height: cardSize.height)
        .clipped()
    }

    private func photoBack(role: PlayerRole) -> some View {
        Image(CardPhotoAssets.backName(for: role))
            .resizable()
            .scaledToFill()
            .frame(width: cardSize.width, height: cardSize.height)
            .clipped()
    }
}
