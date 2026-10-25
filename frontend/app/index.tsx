import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { isOnboardingComplete } from '../utils/storage';

export default function IndexScreen() {
  useEffect(() => {
    const timer = setTimeout(async () => {
      const done = await isOnboardingComplete();
      router.replace(done ? '/home' : '/onboarding');
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0C0C0C', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#F4C07A" />
    </View>
  );
}