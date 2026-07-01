import SwiftUI

@main
struct DymNadLdomApp: App {
    var body: some Scene {
        WindowGroup {
            PhoneWebView()
                .ignoresSafeArea()
                .preferredColorScheme(.dark)
        }
    }
}
