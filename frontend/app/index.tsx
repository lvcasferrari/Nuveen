import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getActiveAlarm, getAlarms, isOnboardingComplete } from '../utils/storage';
import nuveenAlarm from '../modules/nuveen-alarm';

export default function IndexScreen() {
  useEffect(() => {
    const route = async () => {
      // A ringing alarm or a lock-screen "Scan NFC" tap is handled by the root layout, which
      // opens the ringing screen. Redirecting home here would replace it.
      if (nuveenAlarm.pendingScanAlarmId() || (await getActiveAlarm())) return;
      // Users from builds where onboarding was unreachable already have alarms: skip it for them.
      const [done, alarms] = await Promise.all([isOnboardingComplete(), getAlarms()]);
      router.replace(done || alarms.length > 0 ? '/home' : '/onboarding');
    };
    route().catch(() => router.replace('/home'));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0C0C0C', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#F4C07A" />
    </View>
  );
}
