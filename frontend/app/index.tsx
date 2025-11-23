import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function IndexScreen() {
  useEffect(() => {
    setTimeout(() => {
      router.replace('/home');
    }, 500);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0C0C0C', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#F4C07A" />
    </View>
  );
}