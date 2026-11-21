import nuveenAlarm, { isAlarmKitLinked } from '../modules/nuveen-alarm';
import { scheduleAlarmNotification, cancelAlarmNotification } from './notifications';
import { alarmSoundFile, type Alarm } from './storage';

const parseTime = (time: string): { hour: number; minute: number } => {
  const [hour, minute] = time.split(':').map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Invalid alarm time: ${time}`);
  }
  return { hour, minute };
};

// Asks in context, the first time an alarm is actually scheduled.
const hasAlarmAccess = async (): Promise<boolean> => {
  const state = nuveenAlarm.getAuthorizationState();
  if (state === 'notDetermined') {
    return (await nuveenAlarm.requestAuthorization()) === 'authorized';
  }
  return state === 'authorized';
};

// AlarmKit rings on the lock screen, in silent mode and in Focus, whether or
// not the app is running. Without the module or the user's permission we fall
// back to notifications so the alarm still fires instead of silently never ringing.
export const syncAlarm = async (alarm: Alarm): Promise<void> => {
  const { hour, minute } = parseTime(alarm.time);
  if (!isAlarmKitLinked() || !(await hasAlarmAccess())) {
    await scheduleAlarmNotification(alarm);
    return;
  }
  // Notifications from builds before AlarmKit would ring a second time.
  await cancelAlarmNotification(alarm.id);
  await nuveenAlarm.cancel(alarm.id);
  if (!alarm.enabled) return;
  await nuveenAlarm.schedule({
    id: alarm.id,
    title: alarm.name || 'Nuveen Alarm',
    hour,
    minute,
    weekdays: alarm.repeatDays,
    sound: alarmSoundFile(alarm.volume),
  });
};

export const removeAlarm = async (id: string): Promise<void> => {
  await cancelAlarmNotification(id);
  if (isAlarmKitLinked()) await nuveenAlarm.cancel(id);
};

// How long the preview alarm rings: 2 s scheduling lead plus about 5 s of sound.
const PREVIEW_MS = 7000;
let previewTimer: ReturnType<typeof setTimeout> | null = null;

export const stopAlarmPreview = (): void => {
  if (previewTimer) { clearTimeout(previewTimer); previewTimer = null; }
  if (isAlarmKitLinked()) nuveenAlarm.stopPreview().catch(() => {});
};

// Previews the volume through AlarmKit itself, the same engine and sound file that ring on
// the locked phone, so the preview level matches the real alarm. Returns false when AlarmKit
// is unavailable (the caller falls back to a notification or in-app preview).
export const previewWithAlarmKit = async (volume: number): Promise<boolean> => {
  if (!isAlarmKitLinked() || !(await hasAlarmAccess())) return false;
  stopAlarmPreview();
  await nuveenAlarm.preview(alarmSoundFile(volume));
  previewTimer = setTimeout(stopAlarmPreview, PREVIEW_MS);
  return true;
};
