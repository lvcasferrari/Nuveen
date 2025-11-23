import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Alarm {
  id: string;
  name: string;
  time: string; // HH:mm format
  repeatDays: number[]; // 0-6, Sunday-Saturday
  enabled: boolean;
  nfcRequired: boolean;
  gradientTheme: 'dawn' | 'amber' | 'warm';
}

export interface Settings {
  nfcTagId: string | null;
  theme: 'light' | 'dark' | 'auto';
  vibrationEnabled: boolean;
  gradientStyle: 'dawn' | 'amber' | 'warm' | 'dark';
}

export interface WakeLog {
  id: string;
  date: string;
  alarmId: string;
  wakeTime: string;
}

const STORAGE_KEYS = {
  ALARMS: '@nuveen:alarms',
  SETTINGS: '@nuveen:settings',
  WAKE_LOGS: '@nuveen:wake_logs',
  ONBOARDING_COMPLETE: '@nuveen:onboarding_complete',
};

// Alarms
export const getAlarms = async (): Promise<Alarm[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ALARMS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting alarms:', error);
    return [];
  }
};

export const saveAlarms = async (alarms: Alarm[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarms));
  } catch (error) {
    console.error('Error saving alarms:', error);
  }
};

export const addAlarm = async (alarm: Alarm): Promise<void> => {
  const alarms = await getAlarms();
  alarms.push(alarm);
  await saveAlarms(alarms);
};

export const updateAlarm = async (alarm: Alarm): Promise<void> => {
  const alarms = await getAlarms();
  const index = alarms.findIndex(a => a.id === alarm.id);
  if (index !== -1) {
    alarms[index] = alarm;
    await saveAlarms(alarms);
  }
};

export const deleteAlarm = async (id: string): Promise<void> => {
  const alarms = await getAlarms();
  const filtered = alarms.filter(a => a.id !== id);
  await saveAlarms(filtered);
};

// Settings
export const getSettings = async (): Promise<Settings> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      nfcTagId: null,
      theme: 'auto',
      vibrationEnabled: true,
      gradientStyle: 'dawn',
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      nfcTagId: null,
      theme: 'auto',
      vibrationEnabled: true,
      gradientStyle: 'dawn',
    };
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

// Wake Logs
export const getWakeLogs = async (): Promise<WakeLog[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WAKE_LOGS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting wake logs:', error);
    return [];
  }
};

export const addWakeLog = async (log: WakeLog): Promise<void> => {
  try {
    const logs = await getWakeLogs();
    logs.push(log);
    await AsyncStorage.setItem(STORAGE_KEYS.WAKE_LOGS, JSON.stringify(logs));
  } catch (error) {
    console.error('Error adding wake log:', error);
  }
};

// Onboarding
export const isOnboardingComplete = async (): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return data === 'true';
  } catch (error) {
    console.error('Error checking onboarding:', error);
    return false;
  }
};

export const setOnboardingComplete = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  } catch (error) {
    console.error('Error setting onboarding:', error);
  }
};