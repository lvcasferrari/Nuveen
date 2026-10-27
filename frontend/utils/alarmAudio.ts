import { Audio } from 'expo-av';
import VolumeManager from 'react-native-volume-manager';
import { clampVolume } from './storage';

let _alarmSound: Audio.Sound | null = null;
let _silentSound: Audio.Sound | null = null;
let _isRinging = false;
let _currentCustomSoundUri: string | undefined;
let _currentVolume = 1;
// Hardware volume steps are coarse; treat anything within this as "at target"
const VOLUME_TOLERANCE = 0.04;
let _volumeSubscription: ReturnType<typeof VolumeManager.addVolumeListener> | null = null;
let _soundWatchdog: ReturnType<typeof setInterval> | null = null;

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
      { shouldPlay: true, isLooping: true, volume: 0.001 }
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

  // Ensure audio session is configured before every play attempt
  await configureAudioSession();

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

// Volume guard: lock system volume to the alarm's chosen level; any change (up or down) is reverted
const _startVolumeGuard = async (): Promise<void> => {
  try {
    await VolumeManager.setVolume(_currentVolume, { showUI: false });

    _volumeSubscription = VolumeManager.addVolumeListener(async ({ volume }) => {
      if (!_isRinging) return;
      if (Math.abs(volume - _currentVolume) > VOLUME_TOLERANCE) {
        const turnedDown = volume < _currentVolume;
        await VolumeManager.setVolume(_currentVolume, { showUI: false });
        if (turnedDown) await _loadAndPlayAlarm(_currentCustomSoundUri);
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

// Watchdog: periodically check if sound is still playing, restart if OS killed it
const _startSoundWatchdog = (): void => {
  if (_soundWatchdog) return;
  _soundWatchdog = setInterval(async () => {
    if (!_isRinging || !_alarmSound) return;
    try {
      const status = await _alarmSound.getStatusAsync();
      if (!status.isLoaded || !status.isPlaying) {
        // Sound was interrupted by OS or another audio event — restart it
        await _loadAndPlayAlarm(_currentCustomSoundUri);
        await VolumeManager.setVolume(_currentVolume, { showUI: false }).catch(() => {});
      }
    } catch {
      // Sound object is dead — reload
      await _loadAndPlayAlarm(_currentCustomSoundUri);
    }
  }, 3000);
};

const _stopSoundWatchdog = (): void => {
  if (_soundWatchdog) {
    clearInterval(_soundWatchdog);
    _soundWatchdog = null;
  }
};

export const startAlarmSound = async (customSoundUri?: string, volume?: number): Promise<void> => {
  if (_isRinging) return;
  _isRinging = true;
  _currentCustomSoundUri = customSoundUri;
  _currentVolume = clampVolume(volume);

  // Stop silent keep-alive — alarm sound keeps the session alive
  await stopSilentKeepAlive();

  await _loadAndPlayAlarm(customSoundUri);
  await _startVolumeGuard();
  _startSoundWatchdog();
};

export const stopAlarmSound = async (): Promise<void> => {
  _isRinging = false;
  _stopVolumeGuard();
  _stopSoundWatchdog();
  if (_alarmSound) {
    await _alarmSound.stopAsync().catch(() => {});
    await _alarmSound.unloadAsync().catch(() => {});
    _alarmSound = null;
  }
};

export const isAlarmRinging = (): boolean => _isRinging;
