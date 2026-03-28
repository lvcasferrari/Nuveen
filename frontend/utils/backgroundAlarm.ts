import { Audio } from 'expo-av';
import { router } from 'expo-router';
import { getAlarms } from './storage';

let silentSound: Audio.Sound | null = null;
let checker: ReturnType<typeof setInterval> | null = null;
let triggeredMinute = -1; // prevent double-firing in same minute

export const startBackgroundAlarmMonitor = async (): Promise<void> => {
  if (silentSound) return; // already running

  try {
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: 1,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    // Play alarm.mp3 at volume 0 — keeps the iOS audio session alive
    // so the app stays running in background and can fire the alarm
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/alarm.mp3'),
      { shouldPlay: true, isLooping: true, volume: 0 }
    );
    silentSound = sound;

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
    }, 5000); // check every 5 seconds
  } catch (err) {
    console.error('Background alarm monitor failed to start:', err);
  }
};

export const stopBackgroundAlarmMonitor = async (): Promise<void> => {
  if (checker) { clearInterval(checker); checker = null; }
  if (silentSound) {
    await silentSound.unloadAsync().catch(() => {});
    silentSound = null;
  }
  triggeredMinute = -1;
};
