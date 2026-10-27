import nuveenAlarm, { isAlarmKitLinked } from '../modules/nuveen-alarm';
import { scheduleAlarmNotification, cancelAlarmNotification } from './notifications';
import type { Alarm } from './storage';

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
  });
};

export const removeAlarm = async (id: string): Promise<void> => {
  await cancelAlarmNotification(id);
  if (isAlarmKitLinked()) await nuveenAlarm.cancel(id);
};
