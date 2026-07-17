import SwiftUI

struct RulesView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                CorkBoardBackground()

                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        ForEach(Self.sections) { section in
                            VStack(alignment: .leading, spacing: 8) {
                                Text(section.title)
                                    .font(WatergateTheme.labelFont(16))
                                    .foregroundStyle(WatergateTheme.text)
                                Text(section.body)
                                    .font(WatergateTheme.bodySerif(14))
                                    .foregroundStyle(WatergateTheme.text.opacity(0.9))
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .padding(14)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(WatergateTheme.paperPanel.opacity(0.95))
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .stroke(WatergateTheme.border.opacity(0.7), lineWidth: 1)
                            )
                        }
                    }
                    .padding(16)
                }
            }
            .navigationTitle("Правила")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Готово") { dismiss() }
                        .foregroundStyle(WatergateTheme.menuTeal)
                }
            }
        }
    }

    private struct Section: Identifiable {
        var id: String { title }
        let title: String
        let body: String
    }

    private static let sections: [Section] = [
        Section(
            title: "Цель игры",
            body: """
            Играют двое: Редактор («Вашингтон пост») и Никсон (администрация).

            Редактор побеждает, если на доске расследования минимум 2 информанта лицом вверх соединены цепочкой открытых улик с Никсоном в центре.

            Никсон побеждает, набрав 5 жетонов влияния на своей карте влияния — или если нужно взять влияние из запаса, а жетонов уже нет.
            """
        ),
        Section(
            title: "Трек расследования",
            body: """
            На треке — маркер инициативы, маркер влияния и улики. Сторона «Редактора» и сторона «Никсона» расходятся от нуля (0).

            В начале раунда Никсон тайно смотрит 3 улики из мешка и кладёт их лицом вниз на «0».
            """
        ),
        Section(
            title: "Ход раунда",
            body: """
            1) Подготовка: оба игрока берут карты по инициативе (5 или 4). Никсон выкладывает новые улики на «0».

            2) Карты: игроки по очереди играют по одной карте, пока руки не опустеют. Карту можно сыграть либо за значение, либо за действие.

            3) Оценка: жетоны и улики на вашей стороне трека достаются вам; затем улики закрепляют на поле расследования.
            """
        ),
        Section(
            title: "Значение карты",
            body: """
            Сдвиньте на вашу сторону инициативы, влияния или улику на число шагов с карты.

            Улика должна совпадать с цветом на карте (или быть двухцветной с этим цветом). Джокер — любая улика.

            Тайные улики на треке: Никсон может открывать их сам. Редактор спрашивает Никсона, есть ли улика нужного цвета; если да — Никсон открывает и двигает одну из них.
            """
        ),
        Section(
            title: "Улики и поле",
            body: """
            Цвета: синий (чеки кампании), жёлтый (планы Уотергейта), зелёный (плёнки).

            При закреплении улику кладут на свободный слот подходящего цвета. Редактор кладёт лицом вверх (связь), Никсон — лицом вниз (блок).

            Информант связан с Никсоном, если непрерывная нить открытых улик идёт от его фото к центру. Пустые и закрытые слоты рвут связь.
            """
        ),
        Section(
            title: "Действия и реакции",
            body: """
            Действие карты разыгрывает текст события, журналиста или сообщника (часто карта затем удаляется из игры).

            Некоторые карты — ответные: их можно сыграть в ход соперника по указанному условию.
            """
        ),
        Section(
            title: "Примечание",
            body: "Краткая справка по официальным правилам Watergate. Точные эффекты отдельных карт смотрите на самих картах в партии."
        )
    ]
}
