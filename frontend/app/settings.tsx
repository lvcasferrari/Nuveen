import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { useGradient } from '../contexts/GradientContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSettings, saveSettings } from '../utils/storage';
import { readNFCTag, isNFCAvailable } from '../utils/nfc';

export default function SettingsScreen() {
  const { setGradientStyle } = useGradient();
  const [settings, setSettings] = useState({
    nfcTagId: null as string | null,
    theme: 'auto' as 'light' | 'dark' | 'auto',
    vibrationEnabled: true,
    gradientStyle: 'dawn' as 'dawn' | 'amber' | 'warm' | 'dark',
  });
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loaded = await getSettings();
    setSettings(loaded);
  };

  const handleScanNFC = async () => {
    try {
      const available = await isNFCAvailable();
      if (!available) {
        Alert.alert(
          'NFC Not Available',
          'NFC is not available or enabled on this device.'
        );
        return;
      }

      setScanning(true);
      const tagId = await readNFCTag();

      if (tagId) {
        const newSettings = { ...settings, nfcTagId: tagId };
        await saveSettings(newSettings);
        setSettings(newSettings);
        Alert.alert('Success', 'NFC tag registered successfully!');
      } else {
        Alert.alert('Failed', 'Could not read NFC tag.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setScanning(false);
    }
  };

  const handleRemoveNFC = () => {
    Alert.alert(
      'Remove NFC Tag',
      'Are you sure you want to remove your NFC tag?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const newSettings = { ...settings, nfcTagId: null };
            await saveSettings(newSettings);
            setSettings(newSettings);
          },
        },
      ]
    );
  };

  const toggleVibration = async () => {
    const newSettings = { ...settings, vibrationEnabled: !settings.vibrationEnabled };
    await saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleChangeGradient = async (gradientStyle: 'dawn' | 'amber' | 'warm' | 'dark') => {
    const newSettings = { ...settings, gradientStyle };
    await saveSettings(newSettings);
    setSettings(newSettings);
    setGradientStyle(gradientStyle);
  };

  const GRADIENT_STYLES = [
    { id: 'dawn', label: 'Dawn', colors: ['#F4C07A', '#EAA85B', '#F4C07A'] },
    { id: 'amber', label: 'Amber', colors: ['#EAA85B', '#F4C07A', '#EAA85B'] },
    { id: 'warm', label: 'Warm', colors: ['#F4C07A', '#D7D3CC', '#F4C07A'] },
    { id: 'dark', label: 'Dark', colors: ['#0C0C0C', '#1A1A1A', '#0C0C0C'] },
  ] as const;

  return (
    <GradientBackground theme="dawn" animated>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0C0C0C" />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* NFC Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NFC Tag</Text>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardInfo}>
                  <Ionicons name="scan" size={24} color="#F4C07A" />
                  <View style={styles.cardText}>
                    <Text style={styles.cardLabel}>Nuveen Tag</Text>
                    <Text style={styles.cardValue}>
                      {settings.nfcTagId ? 'Configured' : 'Not Set'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* NFC Configuration Instructions */}
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsTitle}>📱 Como Configurar sua Tag NFC</Text>
                <Text style={styles.instructionsText}>
                  1. Use o app "NFC Tools" para escrever na sua tag{'\n'}
                  2. Selecione "Write" → "Add a record" → "Text"{'\n'}
                  3. Digite exatamente:{'\n'}
                  <Text style={styles.instructionsCode}>NUVEEN:ALARM:2025:SECRET_KEY_12345</Text>{'\n'}
                  4. Aproxime a tag e clique em "Write"{'\n'}
                  5. Depois, volte aqui e escaneie sua tag configurada
                </Text>
              </View>
              
              <View style={styles.cardActions}>
                {settings.nfcTagId ? (
                  <TouchableOpacity
                    onPress={handleRemoveNFC}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>Remove Tag</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleScanNFC}
                    disabled={scanning}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#F4C07A', '#EAA85B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryButton}
                    >
                      <Text style={styles.primaryButtonText}>
                        {scanning ? 'Scanning...' : 'Scan NFC Tag'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="phone-portrait" size={24} color="#F4C07A" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Vibration</Text>
                    <Text style={styles.settingDescription}>Vibrate when alarm rings</Text>
                  </View>
                </View>
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={toggleVibration}
                  trackColor={{ false: '#3e3e3e', true: '#F4C07A' }}
                  thumbColor={'#fff'}
                  ios_backgroundColor="#3e3e3e"
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="color-palette" size={24} color="#F4C07A" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Gradient Style</Text>
                    <Text style={styles.settingDescription}>Choose your theme color</Text>
                  </View>
                </View>
              </View>

              <View style={styles.gradientGrid}>
                {GRADIENT_STYLES.map((gradient) => (
                  <TouchableOpacity
                    key={gradient.id}
                    onPress={() => handleChangeGradient(gradient.id as any)}
                    style={[
                      styles.gradientOption,
                      settings.gradientStyle === gradient.id && styles.gradientOptionSelected,
                    ]}
                  >
                    <LinearGradient
                      colors={gradient.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientPreview}
                    >
                      {settings.gradientStyle === gradient.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                      )}
                    </LinearGradient>
                    <Text style={styles.gradientLabel}>{gradient.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.card}>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Version</Text>
                <Text style={styles.aboutValue}>1.0.0</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Build</Text>
                <Text style={styles.aboutValue}>2025.01</Text>
              </View>
            </View>
          </View>

          {/* Branding */}
          <View style={styles.branding}>
            <Text style={styles.brandText}>nuveen</Text>
            <Text style={styles.brandSubtext}>Wake with intention</Text>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C0C0C',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
  },
  card: {
    backgroundColor: 'rgba(12, 12, 12, 0.1)',
    borderRadius: 24,
    padding: 20,
  },
  cardRow: {
    marginBottom: 16,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    marginLeft: 16,
    flex: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C0C0C',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    color: '#0C0C0C',
    opacity: 0.6,
  },
  cardActions: {
    marginTop: 8,
  },
  primaryButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C0C0C',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4444',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C0C0C',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#0C0C0C',
    opacity: 0.6,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(12, 12, 12, 0.1)',
  },
  aboutLabel: {
    fontSize: 16,
    color: '#0C0C0C',
    opacity: 0.6,
  },
  aboutValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C0C0C',
  },
  branding: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 48,
  },
  brandText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#0C0C0C',
    letterSpacing: 3,
    marginBottom: 8,
  },
  brandSubtext: {
    fontSize: 14,
    color: '#0C0C0C',
    opacity: 0.5,
  },
  gradientGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  gradientOption: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  gradientOptionSelected: {
    opacity: 1,
  },
  gradientPreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gradientLabel: {
    fontSize: 12,
    color: '#0C0C0C',
    fontWeight: '500',
  },
});