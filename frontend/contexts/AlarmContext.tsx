import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alarm, getAlarms, saveAlarms, addAlarm as addAlarmStorage, updateAlarm as updateAlarmStorage, deleteAlarm as deleteAlarmStorage } from '../utils/storage';
import nuveenAlarm from '../modules/nuveen-alarm';

// AlarmKit takes the alarm time directly; no notification scheduling, no
// background timer, no keep-alive. It rings on the lock screen, in silent
// mode and in Focus, whether or not the app is running.
const syncAlarm = async (alarm: Alarm) => {
  await nuveenAlarm.cancel(alarm.id);
  if (!alarm.enabled) return;
  const [hour, minute] = alarm.time.split(':').map(Number);
  await nuveenAlarm.schedule({
    id: alarm.id,
    title: alarm.name || 'Nuveen Alarm',
    hour,
    minute,
    weekdays: alarm.repeatDays,
  });
};

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
    } catch (error) {
      console.error('Error refreshing alarms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAlarms();
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
      await nuveenAlarm.cancel(id);
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