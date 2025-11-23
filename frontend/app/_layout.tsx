import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AlarmProvider } from '../contexts/AlarmContext';
import { GradientProvider } from '../contexts/GradientContext';
import { requestNotificationPermissions } from '../utils/notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  useEffect(() => {
    // Request permissions when app loads
    requestNotificationPermissions().catch(console.error);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GradientProvider>
        <AlarmProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0C0C0C' },
              animation: 'fade',
            }}
          />
        </AlarmProvider>
      </GradientProvider>
    </GestureHandlerRootView>
  );
}