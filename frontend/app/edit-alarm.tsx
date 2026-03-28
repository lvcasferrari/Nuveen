import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { SafeAreaView } from 'react-native-safe-area-context';
import AlarmForm, { AlarmFormData } from '../components/AlarmForm';
import { useAlarms } from '../contexts/AlarmContext';

export default function EditAlarmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { alarms, updateAlarm } = useAlarms();

  const alarm = alarms.find(a => a.id === id);

  if (!alarm) {
    return (
      <GradientBackground theme="dark">
        <SafeAreaView style={styles.container}>
          <Text style={styles.errorText}>Alarm not found</Text>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  const initialTime = (() => {
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  })();

  const handleSubmit = async (data: AlarmFormData) => {
    await updateAlarm({
      ...alarm,
      name: data.name,
      time: data.time,
      repeatDays: data.repeatDays,
      customSoundUri: data.customSoundUri,
      soundName: data.soundName,
    });
  };

  return (
    <AlarmForm
      title="Edit Alarm"
      submitLabel="Save Alarm"
      initialTime={initialTime}
      initialName={alarm.name}
      initialRepeatDays={alarm.repeatDays}
      initialCustomSoundUri={alarm.customSoundUri}
      initialSoundName={alarm.soundName}
      onSubmit={handleSubmit}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: '#FF4444' },
});
