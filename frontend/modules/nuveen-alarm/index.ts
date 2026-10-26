import { requireOptionalNativeModule } from 'expo-modules-core';

export type AuthorizationState = 'notDetermined' | 'denied' | 'authorized';

export interface NativeAlarmInput {
  /** Our own alarm id (from storage). Used to derive a stable AlarmKit UUID. */
  id: string;
  /** Shown on the full-screen alarm UI. */
  title: string;
  hour: number;
  minute: number;
  /** 0=Sunday..6=Saturday. Empty means fire once at the next occurrence. */
  weekdays: number[];
}

interface NuveenAlarmNativeModule {
  isSupported(): boolean;
  getAuthorizationState(): AuthorizationState;
  requestAuthorization(): Promise<AuthorizationState>;
  schedule(input: NativeAlarmInput): Promise<string>;
  cancel(id: string): Promise<void>;
  cancelAll(): Promise<void>;
  /**
   * Called after a valid NFC tag scan. Clears the re-arm chain so the alarm
   * stops coming back. Without this, stopping the alarm re-arms it in 60s.
   */
  markVerified(id: string): Promise<void>;
  /** Alarm id the user tapped "Scan NFC" for on the lock screen, if any. */
  /** Empty string when nothing is pending. */
  pendingScanAlarmId(): string;
  clearPendingScan(): void;
  scheduledIds(): string[];
}

// Optional on purpose: requireNativeModule throws at import time when the
// binary does not contain the module (e.g. a JS-only update over an older
// build), which crashes the app on launch before anything can report why.
const native = requireOptionalNativeModule<NuveenAlarmNativeModule>('NuveenAlarmModule');

export const isAlarmKitLinked = (): boolean => native != null;

const api = {
  isSupported: (): boolean => {
    try {
      return native?.isSupported() ?? false;
    } catch {
      return false;
    }
  },
  getAuthorizationState: (): AuthorizationState => {
    try {
      return native?.getAuthorizationState() ?? 'notDetermined';
    } catch {
      return 'notDetermined';
    }
  },
  requestAuthorization: async (): Promise<AuthorizationState> =>
    native ? native.requestAuthorization() : 'notDetermined',
  schedule: async (input: NativeAlarmInput): Promise<string | null> =>
    native ? native.schedule(input) : null,
  cancel: async (id: string): Promise<void> => {
    await native?.cancel(id);
  },
  cancelAll: async (): Promise<void> => {
    await native?.cancelAll();
  },
  markVerified: async (id: string): Promise<void> => {
    await native?.markVerified(id);
  },
  pendingScanAlarmId: (): string | null => {
    try {
      return native?.pendingScanAlarmId() || null;
    } catch {
      return null;
    }
  },
  clearPendingScan: (): void => {
    try {
      native?.clearPendingScan();
    } catch {
      // nothing to clear
    }
  },
  scheduledIds: (): string[] => {
    try {
      return native?.scheduledIds() ?? [];
    } catch {
      return [];
    }
  },
};

export default api;
