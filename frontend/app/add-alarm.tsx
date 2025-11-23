import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlarms } from '../contexts/AlarmContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

const WEEKDAYS = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

const GRADIENT_THEMES = [
  { id: 'dawn', label: 'Dawn', colors: ['#F4C07A', '#EAA85B'] },
  { id: 'amber', label: 'Amber', colors: ['#EAA85B', '#F4C07A'] },
  { id: 'warm', label: 'Warm', colors: ['#F4C07A', '#D7D3CC'] },
];

export default function AddAlarmScreen() {
  const { addAlarm } = useAlarms();
  const [time, setTime] = useState(new Date());
  const [name, setName] = useState('');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');

  const toggleDay = (dayId: number) => {
    if (repeatDays.includes(dayId)) {
      setRepeatDays(repeatDays.filter(d => d !== dayId));
    } else {
      setRepeatDays([...repeatDays, dayId].sort());
    }
  };

  const handleSave = async () => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const alarm = {
      id: Date.now().toString(),
      name: name || 'Morning Ritual',
      time: timeStr,
      repeatDays,
      enabled: true,
      nfcRequired: true,
      gradientTheme,
    };

    await addAlarm(alarm);
    router.back();
  };

  return (
    <GradientBackground theme="dawn" animated>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color="#0C0C0C" />
          </TouchableOpacity>
          <Text style={styles.title}>New Alarm</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Time Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Time</Text>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={time}
                mode="time"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) setTime(selectedDate);
                }}
                textColor="#0C0C0C"
                style={styles.timePicker}
              />
            ) : (
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={styles.timeDisplay}
              >
                <Text style={styles.timeText}>
                  {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            )}
            {Platform.OS === 'android' && showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowTimePicker(false);
                  if (selectedDate) setTime(selectedDate);
                }}
              />
            )}
          </View>

          {/* Alarm Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Alarm Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Morning Ritual"
              placeholderTextColor="rgba(12, 12, 12, 0.3)"
              style={styles.input}
            />
          </View>

          {/* Repeat Days */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Repeat</Text>
            <View style={styles.daysContainer}>
              {WEEKDAYS.map(day => (
                <TouchableOpacity
                  key={day.id}
                  onPress={() => toggleDay(day.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      repeatDays.includes(day.id)
                        ? ['#F4C07A', '#EAA85B']
                        : ['rgba(12, 12, 12, 0.1)', 'rgba(12, 12, 12, 0.05)']
                    }
                    style={styles.dayButton}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        repeatDays.includes(day.id) && styles.dayTextActive,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Gradient Theme */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Gradient Style</Text>
            <View style={styles.themesContainer}>
              {GRADIENT_THEMES.map(theme => (
                <TouchableOpacity
                  key={theme.id}
                  onPress={() => setGradientTheme(theme.id as any)}
                  activeOpacity={0.7}
                  style={styles.themeOption}
                >
                  <LinearGradient
                    colors={theme.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.themePreview,
                      gradientTheme === theme.id && styles.themePreviewActive,
                    ]}
                  />
                  <Text style={styles.themeLabel}>{theme.label}</Text>
                  {gradientTheme === theme.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#F4C07A" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* NFC Badge */}
          <View style={styles.nfcInfo}>
            <Ionicons name="scan" size={20} color="#F4C07A" />
            <Text style={styles.nfcText}>NFC scan required to stop alarm</Text>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.8}>
            <LinearGradient
              colors={['#F4C07A', '#EAA85B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save Alarm</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(12, 12, 12, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0C0C0C',
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C0C0C',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
  },
  timePicker: {
    backgroundColor: 'rgba(12, 12, 12, 0.1)',
    borderRadius: 16,
  },
  timeDisplay: {
    backgroundColor: 'rgba(12, 12, 12, 0.1)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 48,
    fontWeight: '300',
    color: '#0C0C0C',
  },
  input: {
    backgroundColor: 'rgba(12, 12, 12, 0.1)',
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    color: '#0C0C0C',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C0C0C',
    opacity: 0.4,
  },
  dayTextActive: {
    opacity: 1,
  },
  themesContainer: {
    gap: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.05)',
    padding: 16,
    borderRadius: 16,
  },
  themePreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  themePreviewActive: {
    borderWidth: 3,
    borderColor: '#0C0C0C',
  },
  themeLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#0C0C0C',
  },
  nfcInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.1)',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  nfcText: {
    fontSize: 14,
    color: '#0C0C0C',
    marginLeft: 8,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  saveButton: {
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F4C07A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C0C0C',
  },
});