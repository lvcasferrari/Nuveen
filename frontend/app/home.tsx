import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlarms } from '../contexts/AlarmContext';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInMinutes, addDays, set } from 'date-fns';

export default function HomeScreen() {
  const { alarms, refreshAlarms } = useAlarms();

  useEffect(() => {
    refreshAlarms();
  }, []);

  const nextAlarm = useMemo(() => {
    const enabledAlarms = alarms.filter(a => a.enabled);
    if (enabledAlarms.length === 0) return null;

    const now = new Date();
    let closestAlarm = null;
    let minDiff = Infinity;

    enabledAlarms.forEach(alarm => {
      const [hours, minutes] = alarm.time.split(':').map(Number);
      let alarmTime = set(now, { hours, minutes, seconds: 0, milliseconds: 0 });

      // If alarm time has passed today, schedule for tomorrow
      if (alarmTime <= now) {
        alarmTime = addDays(alarmTime, 1);
      }

      const diff = differenceInMinutes(alarmTime, now);
      if (diff < minDiff) {
        minDiff = diff;
        closestAlarm = { ...alarm, scheduledTime: alarmTime, minutesUntil: diff };
      }
    });

    return closestAlarm;
  }, [alarms]);

  const formatCountdown = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `in ${hours}h ${mins}m`;
  };

  return (
    <GradientBackground theme="dawn" animated>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>nuveen</Text>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.settingsButton}
            >
              <Ionicons name="settings-outline" size={24} color="#0C0C0C" />
            </TouchableOpacity>
          </View>

          {/* Main Card */}
          <View style={styles.mainCard}>
            {nextAlarm ? (
              <View style={styles.alarmCard}>
                <Text style={styles.cardLabel}>Next Alarm</Text>
                <Text style={styles.alarmTime}>{nextAlarm.time}</Text>
                <Text style={styles.alarmName}>{nextAlarm.name || 'Alarm'}</Text>
                <Text style={styles.countdown}>
                  {formatCountdown(nextAlarm.minutesUntil)}
                </Text>
                {nextAlarm.nfcRequired && (
                  <View style={styles.nfcBadge}>
                    <Ionicons name="scan" size={16} color="#F4C07A" />
                    <Text style={styles.nfcText}>NFC Required</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noAlarmCard}>
                <Ionicons name="moon-outline" size={64} color="rgba(12, 12, 12, 0.3)" />
                <Text style={styles.noAlarmText}>No alarms set</Text>
                <Text style={styles.noAlarmSubtext}>Create your first morning ritual</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => router.push('/alarms')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#0C0C0C', '#1A1A1A']}
                style={styles.actionButton}
              >
                <Ionicons name="list" size={24} color="#F4C07A" />
                <Text style={styles.actionButtonText}>Manage Alarms</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/add-alarm')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#F4C07A', '#EAA85B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButton}
              >
                <Ionicons name="add" size={24} color="#0C0C0C" />
                <Text style={[styles.actionButtonText, { color: '#0C0C0C' }]}>
                  Add Alarm
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 28,
    fontWeight: '300',
    color: '#0C0C0C',
    letterSpacing: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(12, 12, 12, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCard: {
    marginBottom: 32,
  },
  alarmCard: {
    backgroundColor: 'rgba(12, 12, 12, 0.15)',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#0C0C0C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardLabel: {
    fontSize: 14,
    color: '#0C0C0C',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  alarmTime: {
    fontSize: 72,
    fontWeight: '300',
    color: '#0C0C0C',
    letterSpacing: -2,
  },
  alarmName: {
    fontSize: 20,
    color: '#0C0C0C',
    marginTop: 8,
    opacity: 0.8,
  },
  countdown: {
    fontSize: 16,
    color: '#0C0C0C',
    marginTop: 8,
    opacity: 0.6,
  },
  nfcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 16,
  },
  nfcText: {
    fontSize: 12,
    color: '#0C0C0C',
    marginLeft: 6,
    fontWeight: '500',
  },
  noAlarmCard: {
    backgroundColor: 'rgba(12, 12, 12, 0.1)',
    borderRadius: 32,
    padding: 48,
    alignItems: 'center',
  },
  noAlarmText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#0C0C0C',
    marginTop: 16,
    opacity: 0.6,
  },
  noAlarmSubtext: {
    fontSize: 16,
    color: '#0C0C0C',
    marginTop: 8,
    opacity: 0.4,
  },
  actions: {
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    borderRadius: 32,
    paddingHorizontal: 24,
    shadowColor: '#0C0C0C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F4C07A',
    marginLeft: 12,
  },
});