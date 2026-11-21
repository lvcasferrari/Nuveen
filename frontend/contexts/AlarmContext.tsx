import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alarm, getAlarms, getActiveAlarm, saveAlarms, addAlarm as addAlarmStorage, updateAlarm as updateAlarmStorage, deleteAlarm as deleteAlarmStorage } from '../utils/storage';
import { syncAlarm, removeAlarm } from '../utils/alarmScheduler';
import { scheduleAlarmReminders } from '../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import nuveenAlarm from '../modules/nuveen-alarm';

const SOUND_SYNC_KEY = '@nuveen:alarm_sound_sync_v1';

interface AlarmContextType {
  alarms: Alarm[];
  loading: boolean;
  addAlarm: (alarm: Alarm) => Promise<void>;
  updateAlarm: (alarm: Alarm) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  refreshAlarms: () => Promise<void>;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export const AlarmProvider = ({ children }: { children: ReactNode }) => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAlarms = async () => {
    try {
      const loadedAlarms = await getAlarms();
      setAlarms(loadedAlarms);
      scheduleAlarmReminders(loadedAlarms);
    } catch (error) {
      console.error('Error refreshing alarms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // One-time migration: alarms scheduled by older builds re-sync to pick up their
    // per-volume sound file. Never while an alarm is ringing: re-syncing cancels its re-arm chain.
    const migrate = async () => {
      if ((await AsyncStorage.getItem(SOUND_SYNC_KEY)) === 'done') return;
      if (nuveenAlarm.pendingScanAlarmId() || (await getActiveAlarm())) return;
      for (const a of await getAlarms()) await syncAlarm(a).catch(console.error);
      await AsyncStorage.setItem(SOUND_SYNC_KEY, 'done');
    };
    migrate().catch(console.error).finally(refreshAlarms);
  }, []);

  const addAlarm = async (alarm: Alarm) => {
    try {
      await addAlarmStorage(alarm);
      await syncAlarm(alarm);
      await refreshAlarms();
    } catch (error) {
      console.error('Error adding alarm:', error);
    }
  };

  const updateAlarm = async (alarm: Alarm) => {
    try {
      await updateAlarmStorage(alarm);
      await syncAlarm(alarm);
      await refreshAlarms();
    } catch (error) {
      console.error('Error updating alarm:', error);
    }
  };

  const deleteAlarm = async (id: string) => {
    try {
      await deleteAlarmStorage(id);
      await removeAlarm(id);
      await refreshAlarms();
    } catch (error) {
      console.error('Error deleting alarm:', error);
    }
  };

  const toggleAlarm = async (id: string) => {
    try {
      const alarm = alarms.find(a => a.id === id);
      if (alarm) {
        const updatedAlarm = { ...alarm, enabled: !alarm.enabled };
        await updateAlarm(updatedAlarm);
      }
    } catch (error) {
      console.error('Error toggling alarm:', error);
    }
  };

  return (
    <AlarmContext.Provider value={{ alarms, loading, addAlarm, updateAlarm, deleteAlarm, toggleAlarm, refreshAlarms }}>
      {children}
    </AlarmContext.Provider>
  );
};

export const useAlarms = () => {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error('useAlarms must be used within AlarmProvider');
  }
  return context;
};