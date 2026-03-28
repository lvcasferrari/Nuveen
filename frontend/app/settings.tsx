import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { useGradient } from '../contexts/GradientContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSettings, saveSettings, NfcTag } from '../utils/storage';
import { readNFCTag, isNFCAvailable } from '../utils/nfc';

const GRADIENT_STYLES = [
  { id: 'dawn', label: 'Dawn', colors: ['#F4C07A', '#EAA85B', '#F4C07A'] },
  { id: 'amber', label: 'Amber', colors: ['#EAA85B', '#F4C07A', '#EAA85B'] },
  { id: 'warm', label: 'Warm', colors: ['#F4C07A', '#D7D3CC', '#F4C07A'] },
  { id: 'dark', label: 'Dark', colors: ['#0C0C0C', '#1A1A1A', '#0C0C0C'] },
] as const;

export default function SettingsScreen() {
  const { setGradientStyle } = useGradient();
  const [settings, setSettings] = useState({
    nfcTags: [] as NfcTag[],
    theme: 'auto' as 'light' | 'dark' | 'auto',
    vibrationEnabled: true,
    gradientStyle: 'dawn' as 'dawn' | 'amber' | 'warm' | 'dark',
  });
  const [scanning, setScanning] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loaded = await getSettings();
    setSettings(loaded);
  };

  const persistSettings = async (updated: typeof settings) => {
    setSettings(updated);
    await saveSettings(updated);
  };

  const handleAddTag = async () => {
    try {
      const available = await isNFCAvailable();
      if (!available) {
        Alert.alert('NFC Not Available', 'NFC is not available or enabled on this device.');
        return;
      }
      setScanning(true);
      const tagId = await readNFCTag();
      if (!tagId) {
        Alert.alert('Scan Failed', 'Could not read NFC tag. Please try again.');
        return;
      }
      const defaultName = `Tag ${settings.nfcTags.length + 1}`;
      Alert.prompt(
        'Name this tag',
        'Give this NFC tag a name',
        (name) => {
          const newTag: NfcTag = {
            id: Date.now().toString(),
            name: name?.trim() || defaultName,
            tagId,
          };
          persistSettings({ ...settings, nfcTags: [...settings.nfcTags, newTag] });
        },
        'plain-text',
        defaultName
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to scan NFC tag');
    } finally {
      setScanning(false);
    }
  };

  const handleDeleteTag = (tagId: string) => {
    Alert.alert('Remove Tag', 'Remove this NFC tag?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          persistSettings({
            ...settings,
            nfcTags: settings.nfcTags.filter(t => t.id !== tagId),
          }),
      },
    ]);
  };

  const handleSaveTagName = (tagId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    persistSettings({
      ...settings,
      nfcTags: settings.nfcTags.map(t => (t.id === tagId ? { ...t, name: trimmed } : t)),
    });
    setEditingTagId(null);
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

  return (
    <GradientBackground animated>
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
            <Text style={styles.sectionTitle}>NFC Tags</Text>
            <View style={styles.card}>
              {settings.nfcTags.length === 0 && (
                <Text style={styles.emptyTagsText}>No tags configured</Text>
              )}
              {settings.nfcTags.map(tag => (
                <View key={tag.id} style={styles.tagRow}>
                  <Ionicons name="scan" size={20} color="#F4C07A" />
                  {editingTagId === tag.id ? (
                    <TextInput
                      style={styles.tagNameInput}
                      value={editingName}
                      onChangeText={setEditingName}
                      autoFocus
                      onSubmitEditing={() => handleSaveTagName(tag.id)}
                      onBlur={() => handleSaveTagName(tag.id)}
                      returnKeyType="done"
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.tagNameButton}
                      onPress={() => { setEditingTagId(tag.id); setEditingName(tag.name); }}
                    >
                      <Text style={styles.tagName}>{tag.name}</Text>
                      <Ionicons name="pencil-outline" size={14} color="rgba(12,12,12,0.4)" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDeleteTag(tag.id)} style={styles.tagDeleteButton}>
                    <Ionicons name="trash-outline" size={18} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={handleAddTag} disabled={scanning} activeOpacity={0.8} style={styles.cardActions}>
                <LinearGradient
                  colors={['#F4C07A', '#EAA85B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  {scanning
                    ? <ActivityIndicator color="#0C0C0C" size="small" />
                    : <Text style={styles.primaryButtonText}>+ Add Tag</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
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
  emptyTagsText: {
    fontSize: 14,
    color: '#0C0C0C',
    opacity: 0.4,
    textAlign: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(12,12,12,0.08)',
    gap: 12,
  },
  tagNameButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0C0C0C',
  },
  tagNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#0C0C0C',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F4C07A',
    paddingVertical: 2,
  },
  tagDeleteButton: {
    padding: 4,
  },
});