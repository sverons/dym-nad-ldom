import SwiftUI

struct PromptSheet: View {
    @ObservedObject var store: GameStore
    let prompt: PendingPrompt
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            CorkBoardBackground()

            ScrollView {
                VStack(spacing: 16) {
                    PaperActionPanel(title: title) {
                        content
                    }
                }
                .padding(20)
            }
        }
        .presentationDetents(cardActionDetents)
        .presentationDragIndicator(.visible)
    }

    private var cardActionDetents: Set<PresentationDetent> {
        switch prompt.kind {
        case .chooseCardMode, .confirmAction:
            return [.large, .medium]
        default:
            return [.medium, .large]
        }
    }

    private var title: String {
        switch prompt.kind {
        case .chooseCardMode: return "Действие карты"
        case .chooseValueTarget: return "Сыграть значение"
        case .chooseEvidenceColor: return "Цвет улики"
        case .nixonHiddenEvidenceAsk: return "Тайная улика"
        case .nixonHiddenEvidencePick: return "Какую улику открыть?"
        case .pinEvidence, .evaluationPin: return "Закрепить улику"
        case .confirmAction: return "Действие карты"
        case .offerReaction: return "Ответная карта"
        case .peekOpponentDeck: return "Просмотр колоды"
        case .chooseTrackEvidence: return "Сдвиг улики"
        case .chooseTrackEvidenceMulti: return "Распределение шагов"
        case .momentumPinFromTrack: return "Закрепление с трека"
        case .chooseRemovedCard: return "Система работает"
        case .chooseInformant: return "Выбор информанта"
        case .chooseBoardEvidence: return "Улика на доске"
        case .gambitChoice: return "Гамбит"
        case .nixonSetupEvidence: return "Подготовка раунда"
        case .chooseInitiativeOrMomentum: return "Бонус после закрепления"
        }
    }

    @ViewBuilder
    private var content: some View {
        switch prompt.kind {
        case .chooseCardMode(let card):
            chooseMode(card)
        case .chooseValueTarget(let card, let options):
            chooseValue(card, options)
        case .confirmAction(let card):
            confirmAction(card)
        case .pinEvidence(let token, let role):
            pinEvidence(role: role, tokens: [token])
        case .evaluationPin(let role, let tokens):
            pinEvidence(role: role, tokens: tokens)
        case .offerReaction(let window, let cards):
            offerReaction(window: window, cards: cards)
        case .peekOpponentDeck(let role, let cards):
            peekDeck(role: role, cards: cards)
        case .chooseTrackEvidence(let role, let steps, let tokens):
            chooseTrackEvidence(role: role, steps: steps, tokens: tokens)
        case .chooseTrackEvidenceMulti(let role, let stepSize, _, let tokens, let budget):
            chooseTrackEvidenceMulti(role: role, stepSize: stepSize, tokens: tokens, budget: budget)
        case .momentumPinFromTrack(let role, let tokens):
            momentumPinFromTrack(role: role, tokens: tokens)
        case .nixonHiddenEvidenceAsk(let card, let color, let evidenceID, let steps):
            hiddenEvidenceAsk(card: card, color: color, evidenceID: evidenceID, steps: steps)
        case .nixonHiddenEvidencePick(let card, let tokens, let steps):
            hiddenEvidencePick(card: card, tokens: tokens, steps: steps)
        case .chooseRemovedCard(let card):
            chooseRemovedCard(systemCard: card)
        case .chooseInformant(let card, let options, _, let steps):
            chooseInformant(card: card, options: options, steps: steps)
        case .chooseBoardEvidence(let card):
            chooseBoardEvidence(card: card)
        case .gambitChoice(let card):
            gambitChoice(card: card)
        case .nixonSetupEvidence(let tokens):
            nixonSetupEvidence(tokens: tokens)
        case .chooseInitiativeOrMomentum(let card, let steps):
            chooseInitiativeOrMomentum(card: card, steps: steps)
        default:
            Text("Действие требует подтверждения на столе.")
                .font(WatergateTheme.bodySerif())
                .foregroundStyle(WatergateTheme.muted)
        }
    }

    @ViewBuilder
    private func chooseMode(_ card: CardDefinition) -> some View {
        CardView(card: card, style: .full)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)

        VStack(spacing: 10) {
            Button {
                store.chooseValue(for: card)
            } label: {
                Text("Сыграть значение (\(card.value))")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))

            Button {
                store.chooseAction(for: card)
            } label: {
                Text(actionButtonTitle(for: card))
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
            .disabled(!CardActionResolver.canPlayAction(card, snapshot: store.snapshot))

            Button("Отмена") {
                store.cancelPrompt()
                dismiss()
            }
            .font(WatergateTheme.labelFont())
            .foregroundStyle(WatergateTheme.muted)
            .frame(maxWidth: .infinity)
        }
    }

    private func actionButtonTitle(for card: CardDefinition) -> String {
        switch card.kind {
        case .journalist: return "Сыграть как журналиста"
        case .conspirator: return "Сыграть как сообщника"
        case .event: return "Сыграть как событие"
        case .reaction: return "Сыграть как ответное действие"
        }
    }

    @ViewBuilder
    private func chooseValue(_ card: CardDefinition, _ options: [ValueMoveOption]) -> some View {
        Text("Переместите фишку на \(card.value) шаг(ов)")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        ForEach(options) { option in
            Button(option.label) {
                store.performValueMove(card: card, target: option.target)
                dismiss()
            }
            .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
            .frame(maxWidth: .infinity)
        }
    }

    @ViewBuilder
    private func confirmAction(_ card: CardDefinition) -> some View {
        CardView(card: card, style: .full)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)

        Text(card.actionDetail)
            .font(WatergateTheme.bodySerif())
            .foregroundStyle(WatergateTheme.text)

        Text("«\(card.quote)»")
            .font(WatergateTheme.bodySerif(12))
            .italic()
            .foregroundStyle(WatergateTheme.muted)

        Button("Выполнить") {
            store.confirmAction(for: card)
            dismiss()
        }
        .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private func pinEvidence(role: PlayerRole, tokens: [EvidenceToken]) -> some View {
        Text("\(role.title) закрепляет улику")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        if let token = tokens.first {
            HStack {
                Circle().fill(WatergateTheme.evidenceColor(token.colors.primary)).frame(width: 14, height: 14)
                Text(token.colors.secondary == nil ? token.colors.primary.label : "Двухцветная")
            }

            let spaces = store.snapshot.evidenceSpaces.filter { space in
                space.tokenID == nil && space.allowedColors.contains(where: { token.colors.matches($0) })
            }

            if spaces.isEmpty {
                Text("Нет подходящих клеток — улика уходит из игры.")
                    .foregroundStyle(WatergateTheme.muted)
                Button("Продолжить") {
                    store.skipPinBecauseNoSpace()
                    dismiss()
                }
                .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))
            } else {
                ForEach(spaces, id: \.nodeID) { space in
                    Button(space.nodeID.rawValue.uppercased()) {
                        store.pinEvidence(to: space.nodeID, token: token, by: role)
                        dismiss()
                    }
                    .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }

    @ViewBuilder
    private func offerReaction(window: ReactionWindowState, cards: [CardDefinition]) -> some View {
        Text("\(window.responder.title) может ответить на ход соперника")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        ForEach(cards) { card in
            Button {
                store.playReaction(card)
                dismiss()
            } label: {
                VStack(alignment: .leading, spacing: 4) {
                    Text(card.name)
                    Text(card.actionDetail)
                        .font(.caption)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))
        }

        Button("Пропустить") {
            store.declineReaction()
            dismiss()
        }
        .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private func peekDeck(role: PlayerRole, cards: [CardDefinition]) -> some View {
        Text("Верхние карты колоды \(role.title)")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        if cards.isEmpty {
            Text("Колода пуста.")
                .foregroundStyle(WatergateTheme.muted)
        } else {
            ForEach(cards) { card in
                Text("• \(card.name)")
                    .font(WatergateTheme.bodySerif())
                    .foregroundStyle(WatergateTheme.text)
            }
        }

        Button("Продолжить") {
            store.completePeekDeck()
            dismiss()
        }
        .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private func chooseTrackEvidence(role: PlayerRole, steps: Int, tokens: [TrackEvidence]) -> some View {
        let label = steps == 0 ? "Выберите улику" : "Сдвиньте улику на \(steps)"
        Text("\(role.title): \(label)")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        ForEach(tokens) { item in
            Button("Улика @ \(item.position)") {
                store.performTrackEvidenceMove(evidenceID: item.id, steps: steps, role: role)
                dismiss()
            }
            .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
            .frame(maxWidth: .infinity)
        }
    }

    @ViewBuilder
    private func chooseTrackEvidenceMulti(role: PlayerRole, stepSize: Int, tokens: [TrackEvidence], budget: Int) -> some View {
        Text("\(role.title): осталось \(budget) шаг(ов)")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        ForEach(tokens) { item in
            if stepSize > 0 {
                Button("Улика @ \(item.position) (+\(stepSize))") {
                    store.performTrackEvidenceMove(evidenceID: item.id, steps: stepSize, role: role)
                    dismiss()
                }
                .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
                .frame(maxWidth: .infinity)
            } else {
                ForEach(1...min(budget, 4), id: \.self) { step in
                    Button("Улика @ \(item.position): +\(step)") {
                        store.performTrackEvidenceMove(evidenceID: item.id, steps: step, role: role)
                        dismiss()
                    }
                    .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }

    @ViewBuilder
    private func momentumPinFromTrack(role: PlayerRole, tokens: [TrackEvidence]) -> some View {
        Text("\(role.title): выберите улику с трека для закрепления")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        ForEach(tokens) { item in
            Button("Улика @ \(item.position)") {
                store.beginMomentumPinFromTrack(tokenID: item.token.id, role: role)
            }
            .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
            .frame(maxWidth: .infinity)
        }

        Button("Пропустить") {
            store.cancelMomentumPinFromTrack()
            dismiss()
        }
        .font(WatergateTheme.labelFont())
        .foregroundStyle(WatergateTheme.muted)
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private func hiddenEvidenceAsk(card: CardDefinition, color: EvidenceColor, evidenceID: UUID, steps: Int) -> some View {
        Text("Никсон: есть ли среди тайных улик цвет «\(color.label)»?")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        Button("Да, есть") {
            store.answerHiddenEvidence(hasColor: true, card: card, color: color, evidenceID: evidenceID, steps: steps)
            dismiss()
        }
        .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))
        .frame(maxWidth: .infinity)

        Button("Нет") {
            store.answerHiddenEvidence(hasColor: false, card: card, color: color, evidenceID: evidenceID, steps: steps)
            dismiss()
        }
        .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private func hiddenEvidencePick(card: CardDefinition, tokens: [TrackEvidence], steps: Int) -> some View {
        Text("Никсон: какую улику открыть?")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        ForEach(tokens) { item in
            Button("Улика @ \(item.position)") {
                store.pickHiddenEvidenceToReveal(evidenceID: item.id, card: card, steps: steps)
                dismiss()
            }
            .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
            .frame(maxWidth: .infinity)
        }
    }

    @ViewBuilder
    private func chooseRemovedCard(systemCard: CardDefinition) -> some View {
        let removed = store.snapshot.editor.removed.filter { !$0.isReaction && $0.kind == .event }
        Text("Выберите убранную карту для повтора")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        if removed.isEmpty {
            Text("Нет доступных карт.")
                .foregroundStyle(WatergateTheme.muted)
        } else {
            ForEach(removed) { card in
                Button(card.name) {
                    store.chooseRemovedCardAction(systemCard: systemCard, removed: card)
                    dismiss()
                }
                .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))
                .frame(maxWidth: .infinity)
            }
        }
    }

    @ViewBuilder
    private func chooseInformant(card: CardDefinition, options: [InformantID], steps: Int) -> some View {
        Text("Выберите информанта")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        ForEach(options) { informant in
            Button(informant.displayName) {
                store.chooseInformantAction(card: card, informant: informant, initiativeSteps: steps)
                dismiss()
            }
            .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
            .frame(maxWidth: .infinity)
        }
    }

    @ViewBuilder
    private func chooseBoardEvidence(card: CardDefinition) -> some View {
        let spaces = store.snapshot.evidenceSpaces.filter { $0.tokenID != nil }
        Text("Выберите улику на доске")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        ForEach(spaces, id: \.nodeID) { space in
            Button(space.nodeID.rawValue.uppercased()) {
                store.chooseBoardEvidenceAction(card: card, node: space.nodeID)
                dismiss()
            }
            .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
            .frame(maxWidth: .infinity)
        }
    }

    @ViewBuilder
    private func gambitChoice(card: CardDefinition) -> some View {
        Text("Гамбит: влияние на «5» или пожертвовать сообщником?")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        Button("Влияние на позицию 5") {
            store.chooseGambitMomentum(card: card)
            dismiss()
        }
        .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))
        .frame(maxWidth: .infinity)

        let conspirators = store.snapshot.nixon.hand.filter { $0.kind == .conspirator && $0.id != card.id }
        ForEach(conspirators) { conspirator in
            Button("Убрать «\(conspirator.name)» из игры") {
                store.chooseGambitSacrifice(conspirator: conspirator, gambit: card)
                dismiss()
            }
            .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
            .frame(maxWidth: .infinity)
        }
    }

    @ViewBuilder
    private func nixonSetupEvidence(tokens: [EvidenceToken]) -> some View {
        Text("Никсон: посмотрите 3 улики (не показывайте редактору)")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        ForEach(tokens) { token in
            HStack {
                Circle().fill(WatergateTheme.evidenceColor(token.colors.primary)).frame(width: 14, height: 14)
                if let secondary = token.colors.secondary {
                    Circle().fill(WatergateTheme.evidenceColor(secondary)).frame(width: 14, height: 14)
                }
                Text(token.colors.secondary == nil ? token.colors.primary.label : "Двухцветная")
                    .font(WatergateTheme.bodySerif(16))
                    .foregroundStyle(.black)
            }
        }

        Button("Разместить на «0» лицом вниз") {
            store.confirmNixonSetupEvidence()
            dismiss()
        }
        .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private func chooseInitiativeOrMomentum(card: CardDefinition, steps: Int) -> some View {
        Text("Сдвиньте маркер на \(steps)")
            .font(WatergateTheme.bodySerif(14))
            .foregroundStyle(WatergateTheme.muted)

        Button("Инициатива") {
            store.chooseInitiativeOrMomentum(card: card, useInitiative: true)
            dismiss()
        }
        .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuTeal))
        .frame(maxWidth: .infinity)

        Button("Влияние") {
            store.chooseInitiativeOrMomentum(card: card, useInitiative: false)
            dismiss()
        }
        .buttonStyle(WatergateMenuButtonStyle(tint: WatergateTheme.menuGray))
        .frame(maxWidth: .infinity)
    }
}
