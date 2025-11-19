import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AlarmProvider } from '../contexts/AlarmContext';
import { requestNotificationPermissions } from '../utils/notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AlarmProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0C0C0C' },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="nfc-setup" />
          <Stack.Screen name="home" />
          <Stack.Screen name="alarms" />
          <Stack.Screen name="add-alarm" />
          <Stack.Screen name="edit-alarm" />
          <Stack.Screen name="alarm-ringing" />
          <Stack.Screen name="settings" />
        </Stack>
      </AlarmProvider>
    </GestureHandlerRootView>
  );
}