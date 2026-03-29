import { Audio } from 'expo-av';
import VolumeManager from 'react-native-volume-manager';

let _alarmSound: Audio.Sound | null = null;
let _silentSound: Audio.Sound | null = null;
let _isRinging = false;
let _currentCustomSoundUri: string | undefined;
let _volumeSubscription: ReturnType<typeof VolumeManager.addVolumeListener> | null = null;

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

// Internal: (re)create the alarm sound at full volume
const _loadAndPlayAlarm = async (customSoundUri?: string): Promise<void> => {
  if (_alarmSound) {
    await _alarmSound.stopAsync().catch(() => {});
    await _alarmSound.unloadAsync().catch(() => {});
    _alarmSound = null;
  }

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
};

// Volume guard: when user presses volume down, immediately reset to max and restart sound
const _startVolumeGuard = async (): Promise<void> => {
  try {
    // Crank volume to max immediately
    await VolumeManager.setVolume(1.0, { showUI: false });

    _volumeSubscription = VolumeManager.addVolumeListener(async ({ volume }) => {
      if (!_isRinging) return;
      if (volume < 0.95) {
        // Override: snap back to max
        await VolumeManager.setVolume(1.0, { showUI: false });
        // Restart sound to reinitialise audio session at full volume
        await _loadAndPlayAlarm(_currentCustomSoundUri);
      }
    });
  } catch (err) {
    console.error('Volume guard failed:', err);
  }
};

const _stopVolumeGuard = (): void => {
  if (_volumeSubscription) {
    _volumeSubscription.remove();
    _volumeSubscription = null;
  }
};

export const startAlarmSound = async (customSoundUri?: string): Promise<void> => {
  if (_isRinging) return;
  _isRinging = true;
  _currentCustomSoundUri = customSoundUri;

  // Stop silent keep-alive — alarm sound keeps the session alive
  await stopSilentKeepAlive();

  await _loadAndPlayAlarm(customSoundUri);
  await _startVolumeGuard();
};

export const stopAlarmSound = async (): Promise<void> => {
  _isRinging = false;
  _stopVolumeGuard();
  if (_alarmSound) {
    await _alarmSound.stopAsync().catch(() => {});
    await _alarmSound.unloadAsync().catch(() => {});
    _alarmSound = null;
  }
};

export const isAlarmRinging = (): boolean => _isRinging;
