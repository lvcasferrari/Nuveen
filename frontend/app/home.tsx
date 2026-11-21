import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlarms } from '../contexts/AlarmContext';
import { useThemeColors } from '../contexts/GradientContext';
import { Alarm, getActiveAlarm, ActiveAlarm } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { differenceInMinutes } from 'date-fns';
import { dayLabel, upcomingOccurrences } from '../utils/schedule';
import * as Notifications from 'expo-notifications';

export default function HomeScreen() {
  const { alarms, refreshAlarms } = useAlarms();
  const { text, textFaded, textLight, card, isDark } = useThemeColors();
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);
  const [notificationsOff, setNotificationsOff] = useState(false);

  useEffect(() => {
    refreshAlarms();
    getActiveAlarm().then(setActiveAlarm).catch(() => {});
    Notifications.getPermissionsAsync()
      .then(p => setNotificationsOff(p.status !== 'granted'))
      .catch(() => {});
  }, []);

  type NextAlarm = Alarm & { scheduledTime: Date; minutesUntil: number };
  // Same occurrence logic the scheduler uses, so repeat days are respected.
  const nextAlarm = useMemo((): NextAlarm | null => {
    const now = new Date();
    const next = upcomingOccurrences(alarms, now)[0];
    return next ? { ...next.alarm, scheduledTime: next.date, minutesUntil: differenceInMinutes(next.date, now) } : null;
  }, [alarms]);

  const formatCountdown = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `in ${hours}h ${mins}m`;
  };

  return (
    <GradientBackground animated>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brand}>
              <Image source={require('../assets/images/icon.png')} style={styles.brandMark} accessibilityIgnoresInvertColors />
              <Text style={[styles.logo, { color: text }]}>Nuveen</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={[styles.settingsButton, { backgroundColor: card }]}
            >
              <Ionicons name="settings-outline" size={24} color={text} />
            </TouchableOpacity>
          </View>

          {/* Main Card */}
          <View style={styles.mainCard}>
            {nextAlarm ? (
              <View style={[styles.alarmCard, { backgroundColor: card }]}>
                <Text style={[styles.cardLabel, { color: textFaded }]}>Next Alarm</Text>
                <Text style={[styles.alarmTime, { color: text }]}>{nextAlarm.time}</Text>
                <Text style={[styles.alarmName, { color: text }]}>{nextAlarm.name || 'Alarm'}</Text>
                <Text style={[styles.countdown, { color: textFaded }]}>
                  {nextAlarm.minutesUntil >= 24 * 60 ? dayLabel(nextAlarm.scheduledTime, new Date()) : formatCountdown(nextAlarm.minutesUntil)}
                </Text>
                {nextAlarm.nfcRequired && (
                  <View style={[styles.nfcBadge, { backgroundColor: card }]}>
                    <Ionicons name="scan" size={16} color="#F4C07A" />
                    <Text style={[styles.nfcText, { color: text }]}>NFC Required</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.noAlarmCard, { backgroundColor: card }]}>
                <Ionicons name="moon-outline" size={64} color={textLight} />
                <Text style={[styles.noAlarmText, { color: textFaded }]}>No alarms set</Text>
                <Text style={[styles.noAlarmSubtext, { color: textLight }]}>Create your first morning ritual</Text>
              </View>
            )}
          </View>

          {notificationsOff && (
            <TouchableOpacity
              onPress={() => Linking.openSettings()}
              activeOpacity={0.8}
              style={[styles.warningCard, { backgroundColor: card }]}
              accessibilityRole="button"
            >
              <Ionicons name="notifications-off-outline" size={26} color="#CC2200" />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.warningTitle, { color: text }]}>Notifications are off</Text>
                <Text style={[styles.warningBody, { color: textFaded }]}>
                  Nuveen cannot ring when the app is closed. Tap to turn them on in Settings.
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* SOS: Stop Ringing Alarm */}
          {activeAlarm && (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/alarm-ringing',
                params: {
                  alarmId: activeAlarm.alarmId,
                  alarmName: activeAlarm.alarmName,
                  time: activeAlarm.alarmTime,
                  customSoundUri: activeAlarm.customSoundUri ?? '',
                },
              })}
              activeOpacity={0.8}
              style={styles.sosCard}
            >
              <LinearGradient
                colors={isDark ? ['#F4C07A', '#EAA85B'] : ['#0C0C0C', '#1A1A1A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sosCardInner}
              >
                <Ionicons name="scan" size={28} color={isDark ? '#0C0C0C' : '#F4C07A'} />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.sosTitle, { color: isDark ? '#0C0C0C' : '#F2EEE7' }]}>Your alarm is ringing</Text>
                  <Text style={[styles.sosSubtitle, { color: isDark ? 'rgba(12,12,12,0.7)' : '#D7D3CC' }]}>Walk to your tag and scan to stop</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={isDark ? '#0C0C0C' : '#F4C07A'} />
              </LinearGradient>
            </TouchableOpacity>
          )}

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
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 9,
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
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  warningTitle: { fontSize: 16, fontWeight: '700' },
  warningBody: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  sosCard: {
    marginBottom: 16,
  },
  sosCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
  },
  sosTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sosSubtitle: {
    fontSize: 14,
    marginTop: 2,
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