import SwiftUI

struct CardArt: Hashable {
    let symbol: String
    let accent: Color
    let secondaryAccent: Color
    let sceneLabel: String
}

enum CardArtCatalog {
    static func art(for card: CardDefinition) -> CardArt {
        arts[card.id] ?? defaultArt(for: card)
    }

    private static func defaultArt(for card: CardDefinition) -> CardArt {
        CardArt(
            symbol: card.role == .editor ? "newspaper.fill" : "folder.fill",
            accent: WatergateTheme.roleColor(card.role),
            secondaryAccent: WatergateTheme.roleColor(card.role).opacity(0.55),
            sceneLabel: card.kind == .journalist ? "Журналист" : card.kind == .conspirator ? "Заговорщик" : "Событие"
        )
    }

    private static let arts: [String: CardArt] = [
        "e01": .init(symbol: "lock.open.fill", accent: Color(red: 0.78, green: 0.62, blue: 0.18), secondaryAccent: Color(red: 0.45, green: 0.34, blue: 0.10), sceneLabel: "Уотергейт"),
        "e02": .init(symbol: "dollarsign.circle.fill", accent: Color(red: 0.20, green: 0.45, blue: 0.82), secondaryAccent: Color(red: 0.10, green: 0.24, blue: 0.46), sceneLabel: "Финансы"),
        "e03": .init(symbol: "person.text.rectangle.fill", accent: Color(red: 0.18, green: 0.58, blue: 0.36), secondaryAccent: Color(red: 0.09, green: 0.32, blue: 0.22), sceneLabel: "Вудворд"),
        "e04": .init(symbol: "magnifyingglass.circle.fill", accent: Color(red: 0.20, green: 0.45, blue: 0.82), secondaryAccent: Color(red: 0.78, green: 0.62, blue: 0.18), sceneLabel: "Бернстайн"),
        "e05": .init(symbol: "newspaper.fill", accent: Color(red: 0.12, green: 0.28, blue: 0.52), secondaryAccent: Color(red: 0.78, green: 0.62, blue: 0.18), sceneLabel: "Брэдли"),
        "e06": .init(symbol: "person.3.fill", accent: Color(red: 0.55, green: 0.14, blue: 0.16), secondaryAccent: Color(red: 0.12, green: 0.28, blue: 0.52), sceneLabel: "Протест"),
        "e07": .init(symbol: "building.columns.fill", accent: Color(red: 0.18, green: 0.58, blue: 0.36), secondaryAccent: Color(red: 0.12, green: 0.28, blue: 0.52), sceneLabel: "Суд"),
        "e08": .init(symbol: "mic.fill", accent: Color(red: 0.18, green: 0.58, blue: 0.36), secondaryAccent: Color(red: 0.30, green: 0.30, blue: 0.34), sceneLabel: "Сенат"),
        "e09": .init(symbol: "banknote.fill", accent: Color(red: 0.20, green: 0.45, blue: 0.82), secondaryAccent: Color(red: 0.18, green: 0.58, blue: 0.36), sceneLabel: "Слоун"),
        "e10": .init(symbol: "quote.bubble.fill", accent: Color(red: 0.78, green: 0.62, blue: 0.18), secondaryAccent: Color(red: 0.55, green: 0.14, blue: 0.16), sceneLabel: "Марта"),
        "e11": .init(symbol: "recordingtape", accent: Color(red: 0.18, green: 0.58, blue: 0.36), secondaryAccent: Color(red: 0.35, green: 0.35, blue: 0.38), sceneLabel: "Плёнка"),
        "e12": .init(symbol: "envelope.open.fill", accent: Color(red: 0.20, green: 0.45, blue: 0.82), secondaryAccent: Color(red: 0.55, green: 0.14, blue: 0.16), sceneLabel: "Маккорд"),
        "e13": .init(symbol: "antenna.radiowaves.left.and.right", accent: Color(red: 0.78, green: 0.62, blue: 0.18), secondaryAccent: Color(red: 0.20, green: 0.45, blue: 0.82), sceneLabel: "Болдуин"),
        "e14": .init(symbol: "person.fill.questionmark", accent: Color(red: 0.12, green: 0.18, blue: 0.28), secondaryAccent: Color(red: 0.45, green: 0.50, blue: 0.58), sceneLabel: "Источник"),
        "e15": .init(symbol: "doc.richtext.fill", accent: Color(red: 0.12, green: 0.28, blue: 0.52), secondaryAccent: Color(red: 0.20, green: 0.45, blue: 0.82), sceneLabel: "Газета"),
        "e16": .init(symbol: "doc.text.fill", accent: Color(red: 0.18, green: 0.58, blue: 0.36), secondaryAccent: Color(red: 0.12, green: 0.28, blue: 0.52), sceneLabel: "Субпоена"),
        "e17": .init(symbol: "shield.lefthalf.filled", accent: Color(red: 0.20, green: 0.45, blue: 0.82), secondaryAccent: Color(red: 0.30, green: 0.30, blue: 0.34), sceneLabel: "ФБР"),
        "e18": .init(symbol: "tv.fill", accent: Color(red: 0.78, green: 0.62, blue: 0.18), secondaryAccent: Color(red: 0.12, green: 0.28, blue: 0.52), sceneLabel: "Эрвин"),
        "e19": .init(symbol: "gavel.fill", accent: Color(red: 0.55, green: 0.14, blue: 0.16), secondaryAccent: Color(red: 0.12, green: 0.28, blue: 0.52), sceneLabel: "Импичмент"),
        "e20": .init(symbol: "door.left.hand.open", accent: Color(red: 0.35, green: 0.35, blue: 0.38), secondaryAccent: Color(red: 0.18, green: 0.58, blue: 0.36), sceneLabel: "Отставка"),
        "n01": .init(symbol: "brain.head.profile", accent: Color(red: 0.20, green: 0.45, blue: 0.82), secondaryAccent: Color(red: 0.55, green: 0.14, blue: 0.16), sceneLabel: "Гамбит"),
        "n02": .init(symbol: "figure.walk", accent: Color(red: 0.78, green: 0.62, blue: 0.18), secondaryAccent: Color(red: 0.35, green: 0.35, blue: 0.38), sceneLabel: "Лидди"),
        "n03": .init(symbol: "list.bullet.rectangle.fill", accent: Color(red: 0.18, green: 0.58, blue: 0.36), secondaryAccent: Color(red: 0.55, green: 0.14, blue: 0.16), sceneLabel: "Колсон"),
        "n04": .init(symbol: "flame.fill", accent: Color(red: 0.20, green: 0.45, blue: 0.82), secondaryAccent: Color(red: 0.55, green: 0.14, blue: 0.16), sceneLabel: "Халдеман"),
        "n05": .init(symbol: "eye.fill", accent: Color(red: 0.18, green: 0.58, blue: 0.36), secondaryAccent: Color(red: 0.12, green: 0.18, blue: 0.28), sceneLabel: "Хант"),
        "n06": .init(symbol: "hand.raised.fill", accent: Color(red: 0.78, green: 0.62, blue: 0.18), secondaryAccent: Color(red: 0.55, green: 0.14, blue: 0.16), sceneLabel: "Митчелл"),
        "n07": .init(symbol: "wrench.and.screwdriver.fill", accent: Color(red: 0.20, green: 0.45, blue: 0.82), secondaryAccent: Color(red: 0.18, green: 0.58, blue: 0.36), sceneLabel: "Эрлихман"),
        "n08": .init(symbol: "diamond.fill", accent: Color(red: 0.78, green: 0.62, blue: 0.18), secondaryAccent: Color(red: 0.18, green: 0.58, blue: 0.36), sceneLabel: "Джемстоун"),
        "n09": .init(symbol: "building.2.fill", accent: Color(red: 0.20, green: 0.45, blue: 0.82), secondaryAccent: Color(red: 0.12, green: 0.18, blue: 0.28), sceneLabel: "ЦРУ"),
        "n10": .init(symbol: "trash.fill", accent: Color(red: 0.18, green: 0.58, blue: 0.36), secondaryAccent: Color(red: 0.35, green: 0.35, blue: 0.38), sceneLabel: "Уничтожение"),
        "n11": .init(symbol: "dollarsign.arrow.circlepath", accent: Color(red: 0.20, green: 0.45, blue: 0.82), secondaryAccent: Color(red: 0.78, green: 0.62, blue: 0.18), sceneLabel: "Взятки"),
        "n12": .init(symbol: "wineglass.fill", accent: Color(red: 0.78, green: 0.62, blue: 0.18), secondaryAccent: Color(red: 0.55, green: 0.14, blue: 0.16), sceneLabel: "Дискредитация"),
        "n13": .init(symbol: "moon.stars.fill", accent: Color(red: 0.18, green: 0.58, blue: 0.36), secondaryAccent: Color(red: 0.12, green: 0.18, blue: 0.28), sceneLabel: "Кокс"),
        "n14": .init(symbol: "lock.doc.fill", accent: Color(red: 0.20, green: 0.45, blue: 0.82), secondaryAccent: Color(red: 0.18, green: 0.58, blue: 0.36), sceneLabel: "Привилегия"),
        "n15": .init(symbol: "megaphone.fill", accent: Color(red: 0.78, green: 0.62, blue: 0.18), secondaryAccent: Color(red: 0.35, green: 0.35, blue: 0.38), sceneLabel: "Пресса"),
        "n16": .init(symbol: "person.badge.shield.checkmark.fill", accent: Color(red: 0.18, green: 0.58, blue: 0.36), secondaryAccent: Color(red: 0.20, green: 0.45, blue: 0.82), sceneLabel: "Грэй"),
        "n17": .init(symbol: "flag.fill", accent: Color(red: 0.20, green: 0.45, blue: 0.82), secondaryAccent: Color(red: 0.55, green: 0.14, blue: 0.16), sceneLabel: "Кампания"),
        "n18": .init(symbol: "person.2.badge.gearshape.fill", accent: Color(red: 0.20, green: 0.45, blue: 0.82), secondaryAccent: Color(red: 0.78, green: 0.62, blue: 0.18), sceneLabel: "Сенат"),
        "n19": .init(symbol: "trophy.fill", accent: Color(red: 0.78, green: 0.62, blue: 0.18), secondaryAccent: Color(red: 0.18, green: 0.58, blue: 0.36), sceneLabel: "1972"),
        "n20": .init(symbol: "hand.thumbsdown.fill", accent: Color(red: 0.55, green: 0.14, blue: 0.16), secondaryAccent: Color(red: 0.35, green: 0.35, blue: 0.38), sceneLabel: "Отрицание")
    ]
}

struct CardIllustrationView: View {
    let card: CardDefinition
    var style: CardImageStyle = .hand
    var isHighlighted = false

    private var art: CardArt { CardArtCatalog.art(for: card) }
    private var isFullStyle: Bool {
        if case .full = style { return true }
        return false
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: isFullStyle ? 14 : 10, style: .continuous)
                .fill(paperGradient)

            VStack(spacing: 0) {
                valueHeader
                    .padding(.horizontal, isFullStyle ? 12 : 8)
                    .padding(.top, isFullStyle ? 12 : 8)
                illustration
                    .padding(.horizontal, isFullStyle ? 12 : 8)
                    .padding(.vertical, isFullStyle ? 10 : 6)
                actionBlock
                    .padding(.horizontal, isFullStyle ? 12 : 8)
                Spacer(minLength: 0)
                quoteBlock
                    .padding(.horizontal, isFullStyle ? 12 : 8)
                    .padding(.bottom, isFullStyle ? 12 : 8)
            }
        }
    }

    private var paperGradient: LinearGradient {
        if card.role == .editor {
            return LinearGradient(
                colors: [Color(red: 0.98, green: 0.97, blue: 0.94), Color(red: 0.92, green: 0.94, blue: 0.98)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
        return LinearGradient(
            colors: [Color(red: 0.97, green: 0.94, blue: 0.88), Color(red: 0.92, green: 0.88, blue: 0.82)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    private var valueHeader: some View {
        HStack {
            HStack(spacing: 4) {
                Text("\(card.value)")
                    .font(.system(size: isFullStyle ? 22 : 14, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                    .frame(width: isFullStyle ? 30 : 20, height: isFullStyle ? 30 : 20)
                    .background(RoundedRectangle(cornerRadius: 5).fill(Color.black.opacity(0.75)))
                if card.isJoker {
                    HStack(spacing: 2) {
                        ForEach(EvidenceColor.allCases, id: \.self) { color in
                            Circle().fill(WatergateTheme.evidenceColor(color)).frame(width: 6, height: 6)
                        }
                    }
                } else {
                    HStack(spacing: 3) {
                        ForEach(card.valueColors, id: \.self) { color in
                            Circle().fill(WatergateTheme.evidenceColor(color)).frame(width: 8, height: 8)
                        }
                    }
                }
            }
            Spacer()
            Text(card.kind == .journalist ? "ЖУРНАЛИСТ" : card.kind == .conspirator ? "СООБЩНИК" : card.kind == .reaction ? "ОТВЕТ" : "СОБЫТИЕ")
                .font(.system(size: isFullStyle ? 10 : 7, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(Capsule().fill(WatergateTheme.roleColor(card.role).opacity(0.85)))
        }
    }

    private var illustration: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(LinearGradient(colors: [art.accent.opacity(0.85), art.secondaryAccent.opacity(0.95)], startPoint: .topLeading, endPoint: .bottomTrailing))
            Image(systemName: art.symbol)
                .font(.system(size: isFullStyle ? 54 : 30, weight: .semibold))
                .foregroundStyle(.white.opacity(0.95))
        }
        .frame(height: isFullStyle ? 130 : 62)
    }

    private var actionBlock: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(card.name)
                .font(.system(size: isFullStyle ? 16 : 10, weight: .bold))
                .lineLimit(2)
            if isFullStyle {
                Text(card.actionDetail).font(.caption).foregroundStyle(WatergateTheme.muted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var quoteBlock: some View {
        Text(card.quote)
            .font(.system(size: isFullStyle ? 11 : 7, design: .serif))
            .italic()
            .foregroundStyle(WatergateTheme.muted)
            .lineLimit(isFullStyle ? 4 : 2)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}
