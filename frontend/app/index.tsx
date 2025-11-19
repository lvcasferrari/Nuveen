import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { isOnboardingComplete } from '../utils/storage';
import { GradientBackground } from '../components/GradientBackground';

export default function IndexScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const completed = await isOnboardingComplete();
      
      setTimeout(() => {
        if (completed) {
          router.replace('/home');
        } else {
          router.replace('/onboarding');
        }
      }, 1000);
    } catch (error) {
      console.error('Error checking onboarding:', error);
      router.replace('/onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground theme="dark">
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F4C07A" />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});