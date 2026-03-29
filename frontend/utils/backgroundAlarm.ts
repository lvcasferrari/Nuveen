import { router } from 'expo-router';
import { getAlarms, setActiveAlarm } from './storage';
import {
  startSilentKeepAlive,
  stopSilentKeepAlive,
  startAlarmSound,
} from './alarmAudio';

let checker: ReturnType<typeof setInterval> | null = null;
let triggeredMinute = -1;

export const startBackgroundAlarmMonitor = async (): Promise<void> => {
  if (checker) return; // already running

  try {
    await startSilentKeepAlive();

    checker = setInterval(async () => {
      const now = new Date();
      const currentMinute = now.getHours() * 60 + now.getMinutes();
      if (currentMinute === triggeredMinute) return;

      const alarms = await getAlarms();
      const due = alarms.find(a => {
        if (!a.enabled) return false;
        const [h, m] = a.time.split(':').map(Number);
        return h === now.getHours() && m === now.getMinutes();
      });

      if (due) {
        triggeredMinute = currentMinute;

        // Store active alarm BEFORE navigating so cold-start restore works
        await setActiveAlarm({
          alarmId: due.id,
          alarmName: due.name,
          alarmTime: due.time,
          customSoundUri: due.customSoundUri,
          nfcFailedAttempts: 0,
          startedAt: new Date().toISOString(),
        });

        // Start alarm sound from background so it plays even on lock screen
        await startAlarmSound(due.customSoundUri);

        router.push({
          pathname: '/alarm-ringing',
          params: {
            alarmId: due.id,
            time: due.time,
            alarmName: due.name,
            customSoundUri: due.customSoundUri ?? '',
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
  triggeredMinute = -1;
};
