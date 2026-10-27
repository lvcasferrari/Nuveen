import ExpoModulesCore
import AlarmKit

struct NuveenAlarmInput: Record {
  @Field var id: String = ""
  @Field var title: String = "Alarm"
  @Field var hour: Int = 7
  @Field var minute: Int = 0
  @Field var weekdays: [Int] = []
}

public class NuveenAlarmModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NuveenAlarmModule")

    Function("isSupported") { () -> Bool in
      if #available(iOS 26.0, *) { return true }
      return false
    }

    Function("getAuthorizationState") { () -> String in
      guard #available(iOS 26.0, *) else { return "denied" }
      return Self.describe(AlarmManager.shared.authorizationState)
    }

    AsyncFunction("requestAuthorization") { () async throws -> String in
      guard #available(iOS 26.0, *) else { return "denied" }
      let state = try await AlarmManager.shared.requestAuthorization()
      return Self.describe(state)
    }

    AsyncFunction("schedule") { (input: NuveenAlarmInput) async throws -> String in
      guard #available(iOS 26.0, *) else {
        throw Exception(
          name: "UnsupportedOS",
          description: "AlarmKit requires iOS 26 or later"
        )
      }
      return try await NuveenAlarmEngine.schedule(
        alarmId: input.id,
        title: input.title,
        hour: input.hour,
        minute: input.minute,
        weekdays: input.weekdays
      )
    }

    AsyncFunction("cancel") { (id: String) in
      guard #available(iOS 26.0, *) else { return }
      NuveenAlarmStore.clear(id)
      NuveenAlarmEngine.cancelChain(alarmId: id)
    }

    AsyncFunction("cancelAll") { () in
      guard #available(iOS 26.0, *) else { return }
      for alarm in (try? AlarmManager.shared.alarms) ?? [] {
        try? AlarmManager.shared.cancel(id: alarm.id)
      }
    }

    // Called after a valid NFC scan: break the re-arm chain and silence it.
    AsyncFunction("markVerified") { (id: String) in
      guard #available(iOS 26.0, *) else { return }
      NuveenAlarmStore.setVerified(id)
      try? AlarmManager.shared.stop(id: NuveenAlarmID.uuid(for: id))
      NuveenAlarmEngine.cancelChain(alarmId: id)
      // Keep the verified flag: stop() may run NuveenStopIntent after this
      // returns, and it must see the scan or it re-arms. handleStop and the
      // next schedule() clear it.
      NuveenPendingScan.alarmId = nil
    }

    // Which alarm (if any) the user tapped "Scan NFC" for.
    // Returns "" rather than nil: optional returns across the bridge are a
    // sharp edge, and an uncaught exception here aborts the whole app.
    Function("pendingScanAlarmId") { () -> String in
      NuveenPendingScan.alarmId ?? ""
    }

    Function("clearPendingScan") {
      NuveenPendingScan.alarmId = nil
    }

    Function("scheduledIds") { () -> [String] in
      guard #available(iOS 26.0, *) else { return [] }
      return ((try? AlarmManager.shared.alarms) ?? []).map { $0.id.uuidString }
    }
  }

  @available(iOS 26.0, *)
  private static func describe(_ state: AlarmManager.AuthorizationState) -> String {
    switch state {
    case .authorized: return "authorized"
    case .denied: return "denied"
    default: return "notDetermined"
    }
  }
}
