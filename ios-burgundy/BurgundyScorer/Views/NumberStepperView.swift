import SwiftUI

/// Калькуляторный ввод: текущее значение + поле числа, кнопки − / + и история вводов.
struct NumberStepperView: View {
    let label: String
    @Binding var value: Int
    var history: [ScoreDeltaEntry] = []
    var onApplyDelta: ((Int) -> Void)?
    var onRemoveHistory: ((UUID) -> Void)?

    @State private var draft = ""
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(label)
                    .font(.subheadline)
                    .foregroundStyle(BurgundyTheme.text)

                Spacer()

                Text("\(value)")
                    .font(.title3.weight(.semibold).monospacedDigit())
                    .foregroundStyle(BurgundyTheme.text)
                    .accessibilityLabel("\(label): \(value)")
            }

            HStack(spacing: 8) {
                Button {
                    apply(-1)
                } label: {
                    Image(systemName: "minus")
                        .font(.body.weight(.semibold))
                        .frame(width: 44, height: 44)
                }
                .buttonStyle(.bordered)
                .tint(BurgundyTheme.accent)
                .disabled(parsedAmount == nil && value == 0)

                TextField("0", text: $draft)
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.center)
                    .font(.title3.monospacedDigit())
                    .padding(.horizontal, 8)
                    .frame(height: 44)
                    .frame(maxWidth: .infinity)
                    .background(BurgundyTheme.surface2)
                    .clipShape(RoundedRectangle(cornerRadius: 9))
                    .overlay(
                        RoundedRectangle(cornerRadius: 9)
                            .stroke(isFocused ? BurgundyTheme.accent : BurgundyTheme.border, lineWidth: 1)
                    )
                    .focused($isFocused)
                    .accessibilityLabel("Число для \(label)")
                    .toolbar {
                        ToolbarItemGroup(placement: .keyboard) {
                            Spacer()
                            Button("Готово") { isFocused = false }
                        }
                    }

                Button {
                    apply(1)
                } label: {
                    Image(systemName: "plus")
                        .font(.body.weight(.semibold))
                        .frame(width: 44, height: 44)
                }
                .buttonStyle(.borderedProminent)
                .tint(BurgundyTheme.accent)
                .disabled(parsedAmount == nil)
            }

            if !history.isEmpty {
                historyRow
            }
        }
        .padding(.vertical, 6)
    }

    private var historyRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                Text("История")
                    .font(.caption2)
                    .foregroundStyle(BurgundyTheme.muted)

                ForEach(history) { entry in
                    Button {
                        onRemoveHistory?(entry.id)
                    } label: {
                        Text(entry.label)
                            .font(.caption.weight(.semibold).monospacedDigit())
                            .foregroundStyle(entry.delta >= 0 ? BurgundyTheme.accent : BurgundyTheme.muted)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                Capsule()
                                    .fill(
                                        entry.delta >= 0
                                            ? BurgundyTheme.accent.opacity(0.12)
                                            : BurgundyTheme.surface2
                                    )
                            )
                            .overlay(
                                Capsule()
                                    .stroke(BurgundyTheme.border, lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Удалить \(entry.label) из истории")
                }
            }
        }
    }

    /// Если поле пустое — шаг = 1; иначе берём введённое число.
    private var parsedAmount: Int? {
        let trimmed = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return 1 }
        guard let n = Int(trimmed), n > 0 else { return nil }
        return n
    }

    private func apply(_ sign: Int) {
        guard let amount = parsedAmount else { return }
        let requested = sign * amount
        let next = max(0, value + requested)
        let actual = next - value
        guard actual != 0 else { return }

        if let onApplyDelta {
            onApplyDelta(actual)
        } else {
            value = next
        }

        draft = ""
        isFocused = false
    }
}
