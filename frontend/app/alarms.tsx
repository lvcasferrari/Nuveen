import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { GradientBackground } from '../components/GradientBackground';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlarms } from '../contexts/AlarmContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function AlarmsScreen() {
  const { alarms, toggleAlarm, deleteAlarm } = useAlarms();

  const formatRepeatDays = (days: number[]) => {
    if (days.length === 0) return 'Once';
    if (days.length === 7) return 'Every day';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(d => dayNames[d]).join(', ');
  };

  const renderAlarmItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/edit-alarm', params: { id: item.id } })}
      activeOpacity={0.8}
      style={styles.alarmItem}
    >
      <LinearGradient
        colors={item.enabled ? ['rgba(244, 192, 122, 0.15)', 'rgba(234, 168, 91, 0.15)'] : ['rgba(12, 12, 12, 0.1)', 'rgba(12, 12, 12, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.alarmCard}
      >
        <View style={styles.alarmInfo}>
          <Text style={[styles.alarmTime, !item.enabled && styles.disabledText]}>
            {item.time}
          </Text>
          <Text style={[styles.alarmName, !item.enabled && styles.disabledText]}>
            {item.name || 'Alarm'}
          </Text>
          <View style={styles.alarmMeta}>
            <Text style={[styles.repeatText, !item.enabled && styles.disabledText]}>
              {formatRepeatDays(item.repeatDays)}
            </Text>
            {item.nfcRequired && (
              <View style={styles.nfcBadge}>
                <Ionicons name="scan" size={12} color="#F4C07A" />
                <Text style={styles.nfcBadgeText}>NFC</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.alarmActions}>
          <Switch
            value={item.enabled}
            onValueChange={() => toggleAlarm(item.id)}
            trackColor={{ false: '#3e3e3e', true: '#F4C07A' }}
            thumbColor={'#fff'}
            ios_backgroundColor="#3e3e3e"
          />
          <TouchableOpacity
            onPress={() => deleteAlarm(item.id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <GradientBackground theme="dawn" animated>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#0C0C0C" />
          </TouchableOpacity>
          <Text style={styles.title}>Alarms</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Alarms List */}
        {alarms.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="alarm-outline" size={80} color="rgba(12, 12, 12, 0.2)" />
            <Text style={styles.emptyText}>No alarms yet</Text>
            <Text style={styles.emptySubtext}>Create your first alarm to get started</Text>
          </View>
        ) : (
          <FlatList
            data={alarms}
            renderItem={renderAlarmItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
          />
        )}

        {/* Add Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => router.push('/add-alarm')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F4C07A', '#EAA85B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButton}
            >
              <Ionicons name="add" size={28} color="#0C0C0C" />
              <Text style={styles.addButtonText}>Add Alarm</Text>
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
  list: {
    padding: 24,
    gap: 16,
  },
  alarmItem: {
    marginBottom: 16,
  },
  alarmCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    shadowColor: '#0C0C0C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 32,
    fontWeight: '500',
    color: '#0C0C0C',
    marginBottom: 4,
  },
  alarmName: {
    fontSize: 16,
    color: '#0C0C0C',
    marginBottom: 8,
    opacity: 0.8,
  },
  alarmMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  repeatText: {
    fontSize: 14,
    color: '#0C0C0C',
    opacity: 0.6,
  },
  nfcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  nfcBadgeText: {
    fontSize: 11,
    color: '#0C0C0C',
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.3,
  },
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#0C0C0C',
    marginTop: 24,
    opacity: 0.4,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#0C0C0C',
    marginTop: 8,
    opacity: 0.3,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
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
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C0C0C',
    marginLeft: 8,
  },
});