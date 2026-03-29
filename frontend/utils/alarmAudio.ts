import { Audio } from 'expo-av';

let _alarmSound: Audio.Sound | null = null;
let _silentSound: Audio.Sound | null = null;
let _isRinging = false;

export const configureAudioSession = async (): Promise<void> => {
  await Audio.setAudioModeAsync({
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    interruptionModeIOS: 1,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
  });
};

export const startSilentKeepAlive = async (): Promise<void> => {
  if (_silentSound) return;
  try {
    await configureAudioSession();
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/alarm.mp3'),
      { shouldPlay: true, isLooping: true, volume: 0 }
    );
    _silentSound = sound;
  } catch (err) {
    console.error('Failed to start silent keep-alive:', err);
  }
};

export const stopSilentKeepAlive = async (): Promise<void> => {
  if (_silentSound) {
    await _silentSound.stopAsync().catch(() => {});
    await _silentSound.unloadAsync().catch(() => {});
    _silentSound = null;
  }
};

export const startAlarmSound = async (customSoundUri?: string): Promise<void> => {
  if (_isRinging) return;
  _isRinging = true;

  // Stop silent keep-alive so we don't have two sounds
  await stopSilentKeepAlive();

  const sources: (object | number)[] = [
    ...(customSoundUri ? [{ uri: customSoundUri }] : []),
    require('../assets/sounds/alarm.mp3'),
  ];

  for (const source of sources) {
    try {
      const { sound } = await Audio.Sound.createAsync(source as any, {
        shouldPlay: true,
        isLooping: true,
        volume: 1.0,
      });
      _alarmSound = sound;
      return;
    } catch {
      continue;
    }
  }
  _isRinging = false;
};

export const stopAlarmSound = async (): Promise<void> => {
  _isRinging = false;
  if (_alarmSound) {
    await _alarmSound.stopAsync().catch(() => {});
    await _alarmSound.unloadAsync().catch(() => {});
    _alarmSound = null;
  }
};

export const isAlarmRinging = (): boolean => _isRinging;
