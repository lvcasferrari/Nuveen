import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { PulsingGlow } from '../components/PulsingGlow';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { readNFCTag, isNFCAvailable } from '../utils/nfc';
import { getSettings, saveSettings, setOnboardingComplete } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';

export default function NFCSetupScreen() {
  const [scanning, setScanning] = useState(false);
  const [tagScanned, setTagScanned] = useState(false);

  const handleScanNFC = async () => {
    try {
      const available = await isNFCAvailable();
      if (!available) {
        Alert.alert(
          'NFC Not Available',
          'NFC is not available or enabled on this device. Please enable NFC in your device settings.'
        );
        return;
      }

      setScanning(true);
      const tagId = await readNFCTag();

      if (tagId) {
        const settings = await getSettings();
        settings.nfcTagId = tagId;
        await saveSettings(settings);
        setTagScanned(true);

        setTimeout(() => {
          handleComplete();
        }, 1500);
      } else {
        Alert.alert('Scan Failed', 'Could not read NFC tag. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to scan NFC tag');
    } finally {
      setScanning(false);
    }
  };

  const handleComplete = async () => {
    await setOnboardingComplete();
    router.replace('/home');
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip NFC Setup?',
      'You can set up your NFC tag later in Settings. Alarms will work without NFC.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: handleComplete,
        },
      ]
    );
  };

  return (
    <GradientBackground theme="dark">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="scan-outline" size={80} color="#F4C07A" />
            <Text style={styles.title}>Set up your{"\n"}Nuveen Tag</Text>
            <Text style={styles.subtitle}>
              {tagScanned
                ? 'Tag successfully registered!'
                : scanning
                ? 'Hold your NFC tag near the back of your phone'
                : 'Scan your NFC tag to link it with Nuveen'}
            </Text>
          </View>

          <View style={styles.glowContainer}>
            {scanning && <PulsingGlow size={250} color="#F4C07A" />}
            {tagScanned && (
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={120} color="#4CAF50" />
              </View>
            )}
          </View>

          <View style={styles.footer}>
            {!tagScanned && (
              <TouchableOpacity
                onPress={handleScanNFC}
                activeOpacity={0.8}
                disabled={scanning}
              >
                <LinearGradient
                  colors={['#F4C07A', '#EAA85B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.scanButton}
                >
                  {scanning ? (
                    <ActivityIndicator color="#0C0C0C" size="small" />
                  ) : (
                    <Text style={styles.scanButtonText}>Scan NFC Tag</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {!tagScanned && !scanning && (
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            )}
          </View>
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
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '500',
    color: '#F4C07A',
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#D7D3CC',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  glowContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingBottom: 24,
  },
  scanButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F4C07A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C0C0C',
    letterSpacing: 0.5,
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#D7D3CC',
    opacity: 0.6,
  },
});