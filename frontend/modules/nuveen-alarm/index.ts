import { requireNativeModule } from 'expo-modules-core';

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
  pendingScanAlarmId(): string | null;
  clearPendingScan(): void;
  scheduledIds(): string[];
}

const native = requireNativeModule<NuveenAlarmNativeModule>('NuveenAlarmModule');

export default native;
