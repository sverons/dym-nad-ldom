import SwiftUI

struct AchievementsView: View {
    @ObservedObject var store: AchievementStore
    @State private var showResetConfirm = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    progressHeader

                    ForEach(AchievementCategory.allCases) { category in
                        categorySection(category)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 32)
            }
            .background(BurgundyTheme.background)
            .navigationTitle("Достижения")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Сброс") { showResetConfirm = true }
                        .disabled(store.completedCount == 0)
                }
            }
            .confirmationDialog(
                "Сбросить все достижения?",
                isPresented: $showResetConfirm,
                titleVisibility: .visible
            ) {
                Button("Сбросить", role: .destructive) { store.resetAll() }
                Button("Отмена", role: .cancel) {}
            }
        }
    }

    private var progressHeader: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Выполнено")
                    .font(.headline)
                    .foregroundStyle(BurgundyTheme.text)
                Spacer()
                Text("\(store.completedCount) / \(store.totalCount)")
                    .font(.title3.weight(.bold).monospacedDigit())
                    .foregroundStyle(BurgundyTheme.accent)
            }

            ProgressView(
                value: Double(store.completedCount),
                total: Double(max(1, store.totalCount))
            )
            .tint(BurgundyTheme.accent)

            Text("Отмечайте вручную, когда условие выполнено в партии.")
                .font(.caption)
                .foregroundStyle(BurgundyTheme.muted)
        }
        .padding(16)
        .background(BurgundyTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(BurgundyTheme.border, lineWidth: 1)
        )
    }

    @ViewBuilder
    private func categorySection(_ category: AchievementCategory) -> some View {
        let items = AchievementsCatalog.byCategory(category)
        let done = items.filter { store.isCompleted($0.id) }.count

        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: category.symbol)
                    .foregroundStyle(BurgundyTheme.accent)
                Text(category.title)
                    .font(.headline)
                    .foregroundStyle(BurgundyTheme.text)
                Spacer()
                Text("\(done)/\(items.count)")
                    .font(.caption.weight(.semibold).monospacedDigit())
                    .foregroundStyle(BurgundyTheme.muted)
            }

            VStack(spacing: 8) {
                ForEach(items) { achievement in
                    achievementRow(achievement)
                }
            }
        }
        .padding(16)
        .background(BurgundyTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(BurgundyTheme.border, lineWidth: 1)
        )
    }

    @ViewBuilder
    private func achievementRow(_ achievement: Achievement) -> some View {
        let done = store.isCompleted(achievement.id)

        Button {
            withAnimation(.easeInOut(duration: 0.15)) {
                store.toggle(achievement.id)
            }
        } label: {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: done ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(done ? BurgundyTheme.accent : BurgundyTheme.border)

                Image(systemName: achievement.symbol)
                    .font(.body)
                    .foregroundStyle(done ? BurgundyTheme.accent : BurgundyTheme.muted)
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 2) {
                    Text(achievement.title)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(BurgundyTheme.text)
                        .strikethrough(done, color: BurgundyTheme.muted)

                    Text(achievement.detail)
                        .font(.caption)
                        .foregroundStyle(BurgundyTheme.muted)
                        .multilineTextAlignment(.leading)
                }

                Spacer(minLength: 0)
            }
            .padding(10)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(done ? BurgundyTheme.accent.opacity(0.08) : BurgundyTheme.surface2)
            )
        }
        .buttonStyle(.plain)
    }
}
