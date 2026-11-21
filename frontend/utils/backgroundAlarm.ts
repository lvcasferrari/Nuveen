import { router } from 'expo-router';
import { getAlarms, setActiveAlarm, getActiveAlarm, updateAlarm, clampVolume } from './storage';
import {
  startSilentKeepAlive,
  stopSilentKeepAlive,
  startAlarmSound,
} from './alarmAudio';

let checker: ReturnType<typeof setInterval> | null = null;
// Track which alarm ID was triggered at which minute-of-day to prevent double-fire
// Resets automatically when minute changes, allowing same alarm to fire next day
let lastTriggeredKey = '';

export const startBackgroundAlarmMonitor = async (): Promise<void> => {
  if (checker) return; // already running

  try {
    await startSilentKeepAlive();

    checker = setInterval(async () => {
      // Don't trigger if an alarm is already actively ringing
      const active = await getActiveAlarm();
      if (active) return;

      const now = new Date();
      const currentDay = now.getDay(); // 0=Sunday
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const timeKey = `${currentDay}-${currentHour}:${currentMin}`;

      // Already triggered this exact day+minute combo
      if (timeKey === lastTriggeredKey) return;

      const alarms = await getAlarms();
      const due = alarms.find(a => {
        if (!a.enabled) return false;
        const [h, m] = a.time.split(':').map(Number);
        if (h !== currentHour || m !== currentMin) return false;
        // If alarm has repeat days, check if today is included
        if (a.repeatDays.length > 0 && !a.repeatDays.includes(currentDay)) return false;
        return true;
      });

      if (due) {
        lastTriggeredKey = timeKey;

        // Store active alarm BEFORE navigating so cold-start restore works
        await setActiveAlarm({
          alarmId: due.id,
          alarmName: due.name,
          alarmTime: due.time,
          customSoundUri: due.customSoundUri,
          volume: due.volume,
          startedAt: new Date().toISOString(),
        });

        // One-time alarms (no repeat days) fire once — disable so they don't re-fire daily
        if (due.repeatDays.length === 0) {
          await updateAlarm({ ...due, enabled: false });
        }

        // Start alarm sound from background so it plays even on lock screen
        await startAlarmSound(due.customSoundUri, due.volume);

        router.push({
          pathname: '/alarm-ringing',
          params: {
            alarmId: due.id,
            time: due.time,
            alarmName: due.name,
            customSoundUri: due.customSoundUri ?? '',
            volume: String(clampVolume(due.volume)),
          },
        });
      }
    }, 5000);
  } catch (err) {
    console.error('Background alarm monitor failed to start:', err);
  }
};

export const stopBackgroundAlarmMonitor = async (): Promise<void> => {
  if (checker) { clearInterval(checker); checker = null; }
  await stopSilentKeepAlive();
  lastTriggeredKey = '';
};
