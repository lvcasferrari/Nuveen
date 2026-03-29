import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { GradientBackground } from './GradientBackground';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { playMediumFeedback } from '../utils/feedback';
import { useThemeColors } from '../contexts/GradientContext';

const WEEKDAYS = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

export interface AlarmFormData {
  time: string;
  name: string;
  repeatDays: number[];
  customSoundUri?: string;
  soundName?: string;
}

interface Props {
  title: string;
  submitLabel: string;
  initialTime?: Date;
  initialName?: string;
  initialRepeatDays?: number[];
  initialCustomSoundUri?: string;
  initialSoundName?: string;
  onSubmit: (data: AlarmFormData) => Promise<void>;
}

export default function AlarmForm({
  title,
  submitLabel,
  initialTime,
  initialName = '',
  initialRepeatDays = [],
  initialCustomSoundUri,
  initialSoundName,
  onSubmit,
}: Props) {
  const { text, textFaded, card } = useThemeColors();
  const [time, setTime] = useState(initialTime ?? new Date());
  const [name, setName] = useState(initialName);
  const [repeatDays, setRepeatDays] = useState<number[]>(initialRepeatDays);
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
  const [customSoundUri, setCustomSoundUri] = useState<string | undefined>(initialCustomSoundUri);
  const [soundName, setSoundName] = useState<string | undefined>(initialSoundName);

  const toggleDay = (dayId: number) => {
    playMediumFeedback();
    setRepeatDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const ext = asset.name.split('.').pop();
        const destPath = `${FileSystem.documentDirectory}alarm_sound_${Date.now()}.${ext}`;
        await FileSystem.copyAsync({ from: asset.uri, to: destPath });
        setCustomSoundUri(destPath);
        setSoundName(asset.name);
        playMediumFeedback();
      }
    } catch {
      Alert.alert('Error', 'Could not select audio file');
    }
  };

  const handleRemoveAudio = () => {
    setCustomSoundUri(undefined);
    setSoundName(undefined);
    playMediumFeedback();
  };

  const handleSave = async () => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    await onSubmit({
      time: `${hours}:${minutes}`,
      name: name || 'Morning Ritual',
      repeatDays,
      customSoundUri,
      soundName,
    });
    router.back();
  };

  return (
    <GradientBackground animated>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: text }]}>{title}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Time */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: text }]}>Time</Text>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={time}
                mode="time"
                display="spinner"
                onChange={(_, d) => d && setTime(d)}
                textColor="#0C0C0C"
                style={styles.timePicker}
              />
            ) : (
              <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.timeDisplay}>
                <Text style={[styles.timeText, { color: text }]}>
                  {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            )}
            {Platform.OS === 'android' && showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display="default"
                onChange={(_, d) => { setShowTimePicker(false); if (d) setTime(d); }}
              />
            )}
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: text }]}>Alarm Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Morning Ritual"
              placeholderTextColor={textFaded}
              style={[styles.input, { color: text, backgroundColor: card }]}
            />
          </View>

          {/* Repeat */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: text }]}>Repeat</Text>
            <View style={styles.daysContainer}>
              {WEEKDAYS.map(day => (
                <TouchableOpacity key={day.id} onPress={() => toggleDay(day.id)} activeOpacity={0.7}>
                  <LinearGradient
                    colors={
                      repeatDays.includes(day.id)
                        ? ['#F4C07A', '#EAA85B']
                        : [card, card]
                    }
                    style={styles.dayButton}
                  >
                    <Text style={[styles.dayText, { color: text }, repeatDays.includes(day.id) && styles.dayTextActive]}>
                      {day.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sound */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: text }]}>Alarm Sound</Text>
            <View style={styles.audioSection}>
              <View style={styles.audioInfo}>
                <Ionicons name={customSoundUri ? 'musical-notes' : 'volume-high'} size={24} color="#F4C07A" />
                <View style={styles.audioText}>
                  <Text style={[styles.audioLabel, { color: text }]}>{customSoundUri ? 'Custom Sound' : 'Default Sound'}</Text>
                  <Text style={[styles.audioSubtext, { color: textFaded }]}>{customSoundUri ? soundName : 'Nuveen alarm tone'}</Text>
                </View>
              </View>
              {customSoundUri ? (
                <TouchableOpacity onPress={handleRemoveAudio} style={styles.removeAudioButton}>
                  <Ionicons name="close-circle" size={20} color="#FF4444" />
                  <Text style={styles.removeAudioText}>Remove</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handlePickAudio} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#F4C07A', '#EAA85B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.pickAudioButton}
                  >
                    <Ionicons name="add" size={20} color="#0C0C0C" />
                    <Text style={styles.pickAudioText}>Choose Audio</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.nfcInfo}>
            <Ionicons name="scan" size={20} color="#F4C07A" />
            <Text style={[styles.nfcText, { color: text }]}>NFC scan required to stop alarm</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.8}>
            <LinearGradient
              colors={['#F4C07A', '#EAA85B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>{submitLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  title: { fontSize: 24, fontWeight: '600', color: '#0C0C0C' },
  content: { padding: 24 },
  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C0C0C',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timePicker: { height: 120 },
  timeDisplay: {
    backgroundColor: 'rgba(12, 12, 12, 0.05)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  timeText: { fontSize: 48, fontWeight: '300', color: '#0C0C0C' },
  input: {
    backgroundColor: 'rgba(12, 12, 12, 0.05)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    fontSize: 16,
    color: '#0C0C0C',
  },
  daysContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: { fontSize: 14, fontWeight: '600', color: '#0C0C0C', opacity: 0.5 },
  dayTextActive: { opacity: 1 },
  audioSection: {
    backgroundColor: 'rgba(12, 12, 12, 0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  audioInfo: { flexDirection: 'row', alignItems: 'center' },
  audioText: { marginLeft: 12, flex: 1 },
  audioLabel: { fontSize: 16, fontWeight: '600', color: '#0C0C0C', marginBottom: 4 },
  audioSubtext: { fontSize: 14, color: '#0C0C0C', opacity: 0.6 },
  pickAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 20,
  },
  pickAudioText: { fontSize: 14, fontWeight: '600', color: '#0C0C0C', marginLeft: 8 },
  removeAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  removeAudioText: { fontSize: 14, fontWeight: '600', color: '#FF4444', marginLeft: 8 },
  nfcInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 192, 122, 0.1)',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  nfcText: { fontSize: 14, color: '#0C0C0C', marginLeft: 8, fontWeight: '500' },
  footer: { padding: 24, paddingBottom: 0 },
  saveButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 18, fontWeight: '600', color: '#0C0C0C' },
});
