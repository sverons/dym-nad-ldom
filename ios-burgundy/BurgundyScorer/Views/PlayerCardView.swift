import SwiftUI

struct PlayerCardView: View {
    @ObservedObject var store: GameStore
    let player: Player
    let index: Int
    var onRemoved: (() -> Void)?

    @State private var selectedMonastery: String = ""
    @State private var selectedShield: Int = 0

    private var breakdown: ScoreBreakdown {
        ScoringData.scoreBreakdown(player)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            header
            resultBlock
            scoreSection
            monasterySection
            shieldSection
            if !store.tiebreakers.isEmpty {
                tiebreakerSection
            }
        }
        .padding(16)
        .background(BurgundyTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(BurgundyTheme.border, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.06), radius: 8, y: 4)
        .padding(.top, 8)
    }

    private var header: some View {
        HStack {
            TextField("Имя игрока", text: Binding(
                get: { player.name },
                set: { store.renamePlayer(id: player.id, name: $0) }
            ))
            .font(.title3.weight(.semibold))
            .foregroundStyle(BurgundyTheme.text)

            if store.players.count > 1 {
                Button(role: .destructive) {
                    if store.removePlayer(id: player.id) {
                        onRemoved?()
                    }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(BurgundyTheme.muted)
                }
                .accessibilityLabel("Удалить \(player.name)")
            }
        }
    }

    private var resultBlock: some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            Text("\(breakdown.total)")
                .font(.system(size: 42, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(BurgundyTheme.text)

            Text("очков")
                .font(.title3)
                .foregroundStyle(BurgundyTheme.muted)

            Spacer()
        }
    }

    private var scoreSection: some View {
        VStack(spacing: 0) {
            ForEach(ScoringData.scoreRows, id: \.key) { row in
                NumberStepperView(
                    label: row.label,
                    value: Binding(
                        get: { ScoringData.numericValue(player, key: row.key) },
                        set: { store.updateNumeric(id: player.id, key: row.key, value: $0) }
                    ),
                    history: player.history(for: row.key.rawValue),
                    onApplyDelta: { delta in
                        store.applyNumericDelta(id: player.id, key: row.key, delta: delta)
                    },
                    onRemoveHistory: { entryId in
                        store.removeHistoryEntry(playerId: player.id, entryId: entryId)
                    }
                )
            }
        }
    }

    private var monasterySection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(
                title: "Монастыри",
                showDouble: player.shields.contains(10),
                sum: breakdown.monastery
            )

            ForEach(player.monasteries) { holding in
                if let tile = ScoringData.monasteryTile(id: holding.tile) {
                    monasteryRow(holding: holding, tile: tile)
                }
            }

            if !store.availableTiles.isEmpty {
                Picker("Добавить монастырь", selection: $selectedMonastery) {
                    Text("+ Добавить монастырь…").tag("")
                    ForEach(store.availableTiles) { tile in
                        Text(tile.label).tag(tile.id)
                    }
                }
                .pickerStyle(.menu)
                .tint(BurgundyTheme.accent)
                .onChange(of: selectedMonastery) { newValue in
                    guard !newValue.isEmpty else { return }
                    store.addMonastery(playerId: player.id, tileId: newValue)
                    selectedMonastery = ""
                }
            }
        }
    }

    @ViewBuilder
    private func monasteryRow(holding: MonasteryHolding, tile: MonasteryTile) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Монастырь \(holding.tile)")
                    .font(.subheadline.weight(.medium))
                Spacer()
                Button {
                    store.removeMonastery(playerId: player.id, tileId: holding.tile)
                } label: {
                    Image(systemName: "xmark")
                        .font(.caption)
                }
                .foregroundStyle(BurgundyTheme.muted)
            }

            NumberStepperView(
                label: tile.unitLabel,
                value: Binding(
                    get: { holding.count },
                    set: { store.setMonasteryCount(playerId: player.id, tileId: holding.tile, count: $0) }
                )
            )

            Text("\(tile.unitLabel) · \(ScoringData.monasteryVp(holding)) ОП")
                .font(.caption)
                .foregroundStyle(BurgundyTheme.muted)
        }
        .padding(10)
        .background(BurgundyTheme.surface2)
        .clipShape(RoundedRectangle(cornerRadius: 9))
    }

    private var shieldSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(
                title: "Щиты",
                showDouble: player.shields.contains(13),
                sum: breakdown.shields
            )

            ForEach(player.shields.sorted(), id: \.self) { shieldId in
                if let shield = ScoringData.shield(id: shieldId) {
                    shieldRow(shield: shield)
                }
            }

            if !store.availableShields.isEmpty {
                Picker("Добавить щит", selection: $selectedShield) {
                    Text("+ Добавить щит…").tag(0)
                    ForEach(store.availableShields) { shield in
                        Text("Щит \(shield.id) — \(shield.effect) (\(shield.vp) ОП)")
                            .tag(shield.id)
                    }
                }
                .pickerStyle(.menu)
                .tint(BurgundyTheme.accent)
                .onChange(of: selectedShield) { newValue in
                    guard newValue != 0 else { return }
                    store.addShield(playerId: player.id, shieldId: newValue)
                    selectedShield = 0
                }
            }
        }
    }

    @ViewBuilder
    private func shieldRow(shield: Shield) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("Щит \(shield.id)")
                    .font(.subheadline.weight(.medium))
                Spacer()
                Text("\(shield.vp) ОП")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(BurgundyTheme.accent)
                Button {
                    store.removeShield(playerId: player.id, shieldId: shield.id)
                } label: {
                    Image(systemName: "xmark")
                        .font(.caption)
                }
                .foregroundStyle(BurgundyTheme.muted)
            }
            Text(shield.effect)
                .font(.caption)
                .foregroundStyle(BurgundyTheme.muted)
        }
        .padding(10)
        .background(BurgundyTheme.surface2)
        .clipShape(RoundedRectangle(cornerRadius: 9))
    }

    private var tiebreakerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Доп. критерии")
                .font(.headline)
                .foregroundStyle(BurgundyTheme.text)

            ForEach(ScoringData.tiebreakerRows.filter { store.tiebreakers.contains($0.key) }, id: \.key) { row in
                NumberStepperView(
                    label: row.label,
                    value: Binding(
                        get: { ScoringData.tiebreakerValue(player, key: row.key) },
                        set: { store.updateTiebreaker(id: player.id, key: row.key, value: $0) }
                    )
                )
            }
        }
        .padding(.top, 4)
    }

    @ViewBuilder
    private func sectionHeader(title: String, showDouble: Bool, sum: Int) -> some View {
        HStack {
            Text(title)
                .font(.headline)
                .foregroundStyle(BurgundyTheme.text)
            Spacer()
            if showDouble {
                Text("×2")
                    .font(.caption.weight(.bold))
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(BurgundyTheme.accent.opacity(0.15))
                    .foregroundStyle(BurgundyTheme.accent)
                    .clipShape(Capsule())
            }
            if sum > 0 {
                Text("+\(sum) ОП")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(BurgundyTheme.muted)
            }
        }
    }
}
