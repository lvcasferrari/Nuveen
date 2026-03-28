import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  BackHandler,
  Platform,
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
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

type ScreenState = 'ringing' | 'scanning' | 'success';

export default function AlarmRingingScreen() {
  const params = useLocalSearchParams();
  const alarmId = params.alarmId as string;
  const alarmName = params.alarmName as string || 'Alarm';
  const time = params.time as string;
  const customSoundUri = params.customSoundUri as string | undefined;

  const [screenState, setScreenState] = useState<ScreenState>('ringing');
  const [nfcStatusMessage, setNfcStatusMessage] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Write active alarm to persistent storage so it can be restored after app restart
    setActiveAlarm({
      alarmId,
      alarmName,
      alarmTime: time,
      customSoundUri: customSoundUri || undefined,
      nfcFailedAttempts: 0,
      startedAt: new Date().toISOString(),
    }).catch(console.error);

    // Start vibration and haptic
    Vibration.vibrate([0, 1000, 500, 1000], true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Play alarm sound
    playAlarmSound(customSoundUri || undefined);

    // Block Android hardware back button — returning true suppresses default back behavior
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    return () => {
      Vibration.cancel();
      backHandler.remove();
      soundRef.current?.stopAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const playAlarmSound = async (uri?: string) => {
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: 1,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Try custom sound first, then online fallbacks
      const sources = uri
        ? [
            { uri },
            { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
          ]
        : [
            { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
            { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3' },
          ];

      for (const source of sources) {
        try {
          const { sound: newSound } = await Audio.Sound.createAsync(source, {
            shouldPlay: true,
            isLooping: true,
            volume: 1.0,
            rate: 1.0,
            shouldCorrectPitch: true,
          });
          soundRef.current = newSound;
          console.log('✅ Alarm sound started');
          return;
        } catch {
          continue;
        }
      }

      console.warn('⚠️ Could not play alarm sound from any source');
    } catch (error) {
      console.error('❌ Error setting up alarm sound:', error);
    }
  };

  const handleScanNFC = async () => {
    // Clear previous status message when a new scan starts
    setNfcStatusMessage(null);
    setScreenState('scanning');

    try {
      const available = await isNFCAvailable();
      if (!available) {
        // No bypass — inform user but keep alarm active
        setNfcStatusMessage('NFC is not available on this device. The alarm cannot be dismissed without NFC.');
        setScreenState('ringing');
        return;
      }

      const tagId = await readNFCTag();

      if (tagId) {
        const settings = await getSettings();
        const validation = validateNFCTag(tagId, settings.nfcTagId, 'strict');

        if (validation.valid) {
          console.log('NFC validation successful:', validation.reason);
          await handleSuccessfulDismiss();
        } else {
          console.warn('NFC validation failed:', validation.reason);
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
    // Stop audio and vibration
    Vibration.cancel();
    await soundRef.current?.stopAsync().catch(() => {});
    await soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;

    // Clear persistent alarm state
    await clearActiveAlarm();

    // Log wake event
    await addWakeLog({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      alarmId,
      wakeTime: new Date().toTimeString().split(' ')[0],
    });

    // Success haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show inline success screen, then navigate home after 2 seconds
    setScreenState('success');
    setTimeout(() => {
      router.replace('/home');
    }, 2000);
  };

  return (
    <GradientBackground theme={screenState === 'success' ? 'warm' : 'dawn'} animated>
      {/* Disable iOS swipe-back gesture so user cannot bypass alarm by swiping */}
      <Stack.Screen options={{ gestureEnabled: false }} />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {screenState === 'success' ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={120} color="#4CAF50" />
            <Text style={styles.successTitle}>Good Morning</Text>
            <Text style={styles.successSubtitle}>Have a peaceful and intentional day.</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Time Display */}
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{time}</Text>
              <Text style={styles.alarmName}>{alarmName}</Text>
            </View>

            {/* Pulsing Glow */}
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

            {/* Instructions + status message */}
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

            {/* Scan Button */}
            <TouchableOpacity
              onPress={handleScanNFC}
              disabled={screenState === 'scanning'}
              activeOpacity={0.8}
              style={styles.scanButton}
            >
              <View style={[
                styles.scanButtonInner,
                screenState === 'scanning' && styles.scanButtonDisabled,
              ]}>
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
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-around',
  },
  timeContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
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
  instructions: {
    alignItems: 'center',
  },
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
  scanButton: {
    marginBottom: 24,
  },
  scanButtonInner: {
    backgroundColor: 'rgba(12, 12, 12, 0.2)',
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0C0C0C',
  },
  scanButtonDisabled: {
    opacity: 0.5,
  },
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
