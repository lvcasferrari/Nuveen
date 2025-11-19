import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { PulsingGlow } from '../components/PulsingGlow';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { readNFCTag, isNFCAvailable } from '../utils/nfc';
import { getSettings, addWakeLog } from '../utils/storage';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export default function AlarmRingingScreen() {
  const params = useLocalSearchParams();
  const [scanning, setScanning] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const alarmId = params.alarmId as string;
  const alarmName = params.alarmName as string || 'Alarm';
  const time = params.time as string;

  useEffect(() => {
    // Start vibration pattern
    const pattern = [0, 1000, 500, 1000];
    Vibration.vibrate(pattern, true);

    // Play alarm sound (simple beep for now)
    playAlarmSound();

    // Vibrate every few seconds
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    return () => {
      Vibration.cancel();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const playAlarmSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
        { shouldPlay: true, isLooping: true, volume: 0.5 }
      );
      setSound(newSound);
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  };

  const handleScanNFC = async () => {
    try {
      const available = await isNFCAvailable();
      if (!available) {
        Alert.alert(
          'NFC Not Available',
          'NFC is not available. Using backup dismissal method.',
          [
            {
              text: 'Dismiss Alarm',
              onPress: handleDismiss,
            },
          ]
        );
        return;
      }

      setScanning(true);
      const tagId = await readNFCTag();

      if (tagId) {
        const settings = await getSettings();
        
        if (settings.nfcTagId && tagId === settings.nfcTagId) {
          // Correct tag scanned
          await handleDismiss();
        } else if (!settings.nfcTagId) {
          // No tag configured, accept any tag
          await handleDismiss();
        } else {
          // Wrong tag
          Alert.alert('Wrong Tag', 'Please scan your configured Nuveen tag.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } else {
        Alert.alert('Scan Failed', 'Could not read NFC tag. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to scan NFC tag');
    } finally {
      setScanning(false);
    }
  };

  const handleDismiss = async () => {
    // Stop vibration and sound
    Vibration.cancel();
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }

    // Log wake event
    await addWakeLog({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      alarmId: alarmId,
      wakeTime: new Date().toTimeString().split(' ')[0],
    });

    // Success feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show success message briefly
    Alert.alert(
      'Good Morning! ☀️',
      'Have a peaceful and intentional day.',
      [
        {
          text: 'Continue',
          onPress: () => router.replace('/home'),
        },
      ]
    );
  };

  return (
    <GradientBackground theme="dawn" animated>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
                name={scanning ? 'hourglass' : 'scan'}
                size={80}
                color="#0C0C0C"
              />
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              {scanning
                ? 'Hold your NFC tag near your phone...'
                : 'Scan your Nuveen Tag to stop the alarm'}
            </Text>
          </View>

          {/* Scan Button */}
          <TouchableOpacity
            onPress={handleScanNFC}
            disabled={scanning}
            activeOpacity={0.8}
            style={styles.scanButton}
          >
            <View style={styles.scanButtonInner}>
              <Text style={styles.scanButtonText}>
                {scanning ? 'Scanning...' : 'Tap to Scan'}
              </Text>
            </View>
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
  scanButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0C0C0C',
  },
});