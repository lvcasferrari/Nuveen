import Foundation
import AlarmKit
import AppIntents
import SwiftUI
import CryptoKit

// MARK: - Metadata
// This type must stay identical anywhere it is decoded (app + any widget
// extension), otherwise the Live Activity silently fails to decode.

@available(iOS 26.0, *)
struct NuveenAlarmMetadata: AlarmMetadata {
  let alarmId: String
}

// MARK: - Shared flags

enum NuveenAlarmStore {
  /// How many times a stopped alarm comes back before we stop nagging.
  /// At 60s apart this is the ~10 minute backup exit for a lost tag.
  static let maxRearms = 10
  static let rearmDelay: TimeInterval = 60

  private static var defaults: UserDefaults { .standard }

  /// A scan only counts for the ringing it answered; a stale flag must not
  /// let tomorrow's repeat be stopped without scanning.
  static let verifiedWindow: TimeInterval = 5 * 60

  static func isVerified(_ id: String) -> Bool {
    let at = defaults.double(forKey: "nuveen.verified.\(id)")
    return at > 0 && Date().timeIntervalSince1970 - at < verifiedWindow
  }

  static func setVerified(_ id: String) {
    defaults.set(Date().timeIntervalSince1970, forKey: "nuveen.verified.\(id)")
  }

  static func clear(_ id: String) {
    defaults.removeObject(forKey: "nuveen.verified.\(id)")
    defaults.removeObject(forKey: "nuveen.rearms.\(id)")
  }

  static func rearmCount(_ id: String) -> Int {
    defaults.integer(forKey: "nuveen.rearms.\(id)")
  }

  static func bumpRearm(_ id: String) {
    defaults.set(rearmCount(id) + 1, forKey: "nuveen.rearms.\(id)")
  }
}

/// Set by the "Scan NFC" button so the app knows which alarm to open on.
enum NuveenPendingScan {
  static var alarmId: String? {
    get { UserDefaults.standard.string(forKey: "nuveen.pendingScan") }
    set { UserDefaults.standard.set(newValue, forKey: "nuveen.pendingScan") }
  }
}

// MARK: - Deterministic ids
// Stable UUIDs mean re-syncing on app launch reconciles instead of duplicating.

enum NuveenAlarmID {
  static func uuid(for key: String) -> UUID {
    var bytes = Array(Insecure.MD5.hash(data: Data(key.utf8)))
    bytes[6] = (bytes[6] & 0x0F) | 0x30 // version 3
    bytes[8] = (bytes[8] & 0x3F) | 0x80 // RFC 4122 variant
    let hex = bytes.map { String(format: "%02x", $0) }.joined()
    let groups = [
      String(hex.prefix(8)),
      String(hex.dropFirst(8).prefix(4)),
      String(hex.dropFirst(12).prefix(4)),
      String(hex.dropFirst(16).prefix(4)),
      String(hex.dropFirst(20).prefix(12)),
    ]
    return UUID(uuidString: groups.joined(separator: "-")) ?? UUID()
  }

  static func rearmKey(_ alarmId: String, _ attempt: Int) -> String {
    "\(alarmId)#rearm\(attempt)"
  }
}

// MARK: - Engine

@available(iOS 26.0, *)
enum NuveenAlarmEngine {
  /// Nuveen amber (#F4C07A)
  static let tint = Color(red: 0.957, green: 0.753, blue: 0.478)
  /// Same file the app plays (bundled by the expo-notifications plugin), so the
  /// alarm sounds the same whether or not the app is open.
  static let alarmSound = AlertConfiguration.AlertSound.named("alarm.mp3")

  static func attributes(title: String, alarmId: String) -> AlarmAttributes<NuveenAlarmMetadata> {
    let scan = AlarmButton(
      text: "Scan NFC",
      textColor: .black,
      systemImageName: "wave.3.right"
    )
    // Required by the iOS 26.0 SDK (EAS); deprecated in 26.1. Stopping re-arms
    // the alarm via NuveenStopIntent unless the tag was scanned.
    let stop = AlarmButton(text: "Stop", textColor: .white, systemImageName: "stop.circle")
    let alert = AlarmPresentation.Alert(
      title: LocalizedStringResource(stringLiteral: title),
      stopButton: stop,
      secondaryButton: scan,
      secondaryButtonBehavior: .custom
    )
    return AlarmAttributes(
      presentation: AlarmPresentation(alert: alert),
      metadata: NuveenAlarmMetadata(alarmId: alarmId),
      tintColor: tint
    )
  }

  static func weekday(_ index: Int) -> Locale.Weekday? {
    switch index {
    case 0: return .sunday
    case 1: return .monday
    case 2: return .tuesday
    case 3: return .wednesday
    case 4: return .thursday
    case 5: return .friday
    case 6: return .saturday
    default: return nil
    }
  }

  static func schedule(
    alarmId: String,
    title: String,
    hour: Int,
    minute: Int,
    weekdays: [Int]
  ) async throws -> String {
    let time = Alarm.Schedule.Relative.Time(hour: hour, minute: minute)
    let recurrence: Alarm.Schedule.Relative.Recurrence =
      weekdays.isEmpty ? .never : .weekly(weekdays.compactMap(weekday))
    let schedule = Alarm.Schedule.relative(
      Alarm.Schedule.Relative(time: time, repeats: recurrence)
    )

    let config = AlarmManager.AlarmConfiguration.alarm(
      schedule: schedule,
      attributes: attributes(title: title, alarmId: alarmId),
      stopIntent: NuveenStopIntent(alarmId: alarmId),
      secondaryIntent: NuveenScanIntent(alarmId: alarmId),
      sound: alarmSound
    )

    NuveenAlarmStore.clear(alarmId)
    let id = NuveenAlarmID.uuid(for: alarmId)
    _ = try await AlarmManager.shared.schedule(id: id, configuration: config)
    return id.uuidString
  }

  /// Runs when the user stops a ringing alarm. If they have not scanned their
  /// tag, put the alarm back in 60s — that is the whole point of the product.
  static func handleStop(alarmId: String) async {
    if NuveenAlarmStore.isVerified(alarmId) {
      NuveenAlarmStore.clear(alarmId)
      return
    }
    guard NuveenAlarmStore.rearmCount(alarmId) < NuveenAlarmStore.maxRearms else {
      NuveenAlarmStore.clear(alarmId) // backup exit for a lost or broken tag
      return
    }
    NuveenAlarmStore.bumpRearm(alarmId)

    let attempt = NuveenAlarmStore.rearmCount(alarmId)
    let config = AlarmManager.AlarmConfiguration.alarm(
      schedule: .fixed(Date().addingTimeInterval(NuveenAlarmStore.rearmDelay)),
      attributes: attributes(title: "Scan your tag to stop", alarmId: alarmId),
      stopIntent: NuveenStopIntent(alarmId: alarmId),
      secondaryIntent: NuveenScanIntent(alarmId: alarmId),
      sound: alarmSound
    )
    try? await AlarmManager.shared.schedule(
      id: NuveenAlarmID.uuid(for: NuveenAlarmID.rearmKey(alarmId, attempt)),
      configuration: config
    )
  }

  /// Cancel an alarm and every follow-up we may have queued for it.
  static func cancelChain(alarmId: String) {
    try? AlarmManager.shared.cancel(id: NuveenAlarmID.uuid(for: alarmId))
    for attempt in 1...NuveenAlarmStore.maxRearms {
      try? AlarmManager.shared.cancel(
        id: NuveenAlarmID.uuid(for: NuveenAlarmID.rearmKey(alarmId, attempt))
      )
    }
  }
}

// MARK: - Intents
// These run even when the app is not in the foreground, which is what makes
// the re-arm chain work after the app has been closed.

@available(iOS 26.0, *)
struct NuveenStopIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Stop Alarm"

  @Parameter(title: "Alarm")
  var alarmId: String

  init() {}

  init(alarmId: String) {
    self.alarmId = alarmId
  }

  func perform() async throws -> some IntentResult {
    await NuveenAlarmEngine.handleStop(alarmId: alarmId)
    return .result()
  }
}

@available(iOS 26.0, *)
struct NuveenScanIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Scan NFC"
  static var openAppWhenRun: Bool { true }

  @Parameter(title: "Alarm")
  var alarmId: String

  init() {}

  init(alarmId: String) {
    self.alarmId = alarmId
  }

  func perform() async throws -> some IntentResult {
    NuveenPendingScan.alarmId = alarmId
    return .result()
  }
}
