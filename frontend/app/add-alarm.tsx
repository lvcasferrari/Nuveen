import React from 'react';
import AlarmForm, { AlarmFormData } from '../components/AlarmForm';
import { useAlarms } from '../contexts/AlarmContext';

export default function AddAlarmScreen() {
  const { addAlarm } = useAlarms();

  const handleSubmit = async (data: AlarmFormData) => {
    await addAlarm({
      id: Date.now().toString(),
      name: data.name,
      time: data.time,
      repeatDays: data.repeatDays,
      enabled: true,
      nfcRequired: true,
      gradientTheme: 'dawn',
      customSoundUri: data.customSoundUri,
      soundName: data.soundName,
    });
  };

  return (
    <AlarmForm
      title="New Alarm"
      submitLabel="Create Alarm"
      onSubmit={handleSubmit}
    />
  );
}
