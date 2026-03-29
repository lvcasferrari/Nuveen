import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  BackHandler,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { PulsingGlow } from '../components/PulsingGlow';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { readNFCTag, isNFCAvailable, validateNFCTag } from '../utils/nfc';
import {
  getSettings,
  addWakeLog,
  setActiveAlarm,
  clearActiveAlarm,
  incrementNfcFailedAttempts,
} from '../utils/storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { startAlarmSound, stopAlarmSound, isAlarmRinging, configureAudioSession } from '../utils/alarmAudio';

type ScreenState = 'ringing' | 'scanning' | 'success';

export default function AlarmRingingScreen() {
  const params = useLocalSearchParams();
  const alarmId = params.alarmId as string;
  const alarmName = (params.alarmName as string) || 'Alarm';
  const time = params.time as string;
  const customSoundUri = params.customSoundUri as string | undefined;

  const [screenState, setScreenState] = useState<ScreenState>('ringing');
  const [nfcStatusMessage, setNfcStatusMessage] = useState<string | null>(null);
  const vibrationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setActiveAlarm({
      alarmId,
      alarmName,
      alarmTime: time,
      customSoundUri: customSoundUri || undefined,
      nfcFailedAttempts: 0,
      startedAt: new Date().toISOString(),
    }).catch(console.error);

    // Start persistent vibration — restart every 10s to ensure it doesn't stop
    Vibration.vibrate([0, 1000, 500, 1000], true);
    vibrationRef.current = setInterval(() => {
      if (screenState !== 'success') {
        Vibration.vibrate([0, 1000, 500, 1000], true);
      }
    }, 10000);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    playAlarmSound();

    // Dismiss any alarm notifications from the tray (user is now on the ringing screen)
    Notifications.dismissAllNotificationsAsync().catch(() => {});

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    return () => {
      Vibration.cancel();
      if (vibrationRef.current) clearInterval(vibrationRef.current);
      backHandler.remove();
      stopAlarmSound().catch(() => {});
    };
  }, []);

  const playAlarmSound = async () => {
    try {
      await configureAudioSession();
      // If background monitor already started the sound, don't restart it
      if (isAlarmRinging()) return;
      await startAlarmSound(customSoundUri || undefined);
    } catch (error) {
      console.error('Error setting up alarm sound:', error);
    }
  };

  const handleScanNFC = async () => {
    setNfcStatusMessage(null);
    setScreenState('scanning');

    try {
      const available = await isNFCAvailable();
      if (!available) {
        setNfcStatusMessage('NFC is not available on this device. The alarm cannot be dismissed without NFC.');
        setScreenState('ringing');
        return;
      }

      const tagId = await readNFCTag();

      if (tagId) {
        const settings = await getSettings();
        const isValid = settings.nfcTags.length === 0 ||
          settings.nfcTags.some(t => validateNFCTag(tagId, t.tagId, 'strict').valid);

        if (isValid) {
          await handleSuccessfulDismiss();
        } else {
          setNfcStatusMessage('Wrong tag. Please scan your configured Nuveen tag.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          await incrementNfcFailedAttempts();
          setScreenState('ringing');
        }
      } else {
        setNfcStatusMessage('Could not read NFC tag. Please try again.');
        await incrementNfcFailedAttempts();
        setScreenState('ringing');
      }
    } catch (error: any) {
      setNfcStatusMessage(error.message || 'Failed to scan NFC tag. Please try again.');
      await incrementNfcFailedAttempts();
      setScreenState('ringing');
    }
  };

  const handleSuccessfulDismiss = async () => {
    Vibration.cancel();
    if (vibrationRef.current) {
      clearInterval(vibrationRef.current);
      vibrationRef.current = null;
    }
    await stopAlarmSound();
    await clearActiveAlarm();
    // Dismiss any remaining alarm notifications
    await Notifications.dismissAllNotificationsAsync().catch(() => {});
    await addWakeLog({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      alarmId,
      wakeTime: new Date().toTimeString().split(' ')[0],
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScreenState('success');
    setTimeout(() => router.replace('/home'), 5000);
  };

  return (
    <GradientBackground theme={screenState === 'success' ? 'warm' : 'dawn'} animated>
      <Stack.Screen options={{ gestureEnabled: false, headerShown: false, animation: 'none' }} />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {screenState === 'success' ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={120} color="#4CAF50" />
            <Text style={styles.successTitle}>Good Morning</Text>
            <Text style={styles.successSubtitle}>Have a peaceful and intentional day.</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{time}</Text>
              <Text style={styles.alarmName}>{alarmName}</Text>
            </View>

            <View style={styles.glowContainer}>
              <PulsingGlow size={300} color="#F4C07A" />
              <View style={styles.scanIcon}>
                <Ionicons
                  name={screenState === 'scanning' ? 'hourglass' : 'scan'}
                  size={80}
                  color="#0C0C0C"
                />
              </View>
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionText}>
                {screenState === 'scanning'
                  ? 'Hold your NFC tag near your phone...'
                  : 'Scan your Nuveen Tag to stop the alarm'}
              </Text>
              {nfcStatusMessage && (
                <Text style={styles.statusMessage}>{nfcStatusMessage}</Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleScanNFC}
              disabled={screenState === 'scanning'}
              activeOpacity={0.8}
              style={styles.scanButton}
            >
              <View style={[styles.scanButtonInner, screenState === 'scanning' && styles.scanButtonDisabled]}>
                <Text style={styles.scanButtonText}>
                  {screenState === 'scanning' ? 'Scanning...' : 'Tap to Scan'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-around',
  },
  timeContainer: { alignItems: 'center', marginTop: 48 },
  time: {
    fontSize: 72,
    fontWeight: '300',
    color: '#0C0C0C',
    letterSpacing: -2,
  },
  alarmName: {
    fontSize: 24,
    color: '#0C0C0C',
    marginTop: 8,
    opacity: 0.6,
  },
  glowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scanIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: { alignItems: 'center' },
  instructionText: {
    fontSize: 18,
    color: '#0C0C0C',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 26,
  },
  statusMessage: {
    fontSize: 15,
    color: '#CC2200',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 24,
    lineHeight: 22,
    fontWeight: '500',
  },
  scanButton: { marginBottom: 24 },
  scanButtonInner: {
    backgroundColor: 'rgba(12, 12, 12, 0.2)',
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0C0C0C',
  },
  scanButtonDisabled: { opacity: 0.5 },
  scanButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0C0C0C',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successTitle: {
    fontSize: 36,
    fontWeight: '300',
    color: '#0C0C0C',
    marginTop: 24,
  },
  successSubtitle: {
    fontSize: 18,
    color: '#0C0C0C',
    opacity: 0.6,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 26,
  },
});
