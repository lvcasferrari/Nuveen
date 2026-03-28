import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { AlarmProvider } from '../contexts/AlarmContext';
import { GradientProvider } from '../contexts/GradientContext';
import { requestNotificationPermissions } from '../utils/notifications';
import { getActiveAlarm } from '../utils/storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

export default function RootLayout() {
  const notificationSubscription = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Request permissions when app loads
    requestNotificationPermissions().catch(console.error);

    // Restore active alarm session if one was interrupted (e.g. app killed while alarm was ringing)
    const checkActiveAlarm = async () => {
      const active = await getActiveAlarm();
      if (active) {
        router.replace({
          pathname: '/alarm-ringing',
          params: {
            alarmId: active.alarmId,
            alarmName: active.alarmName,
            time: active.alarmTime,
            customSoundUri: active.customSoundUri ?? '',
          },
        });
      }
    };
    // Defer slightly to allow the navigator stack to mount before replacing
    const restoreTimer = setTimeout(() => checkActiveAlarm(), 200);

    // Navigate to alarm-ringing when user taps an alarm notification
    notificationSubscription.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.alarmId) {
          router.replace({
            pathname: '/alarm-ringing',
            params: {
              alarmId: data.alarmId as string,
              alarmName: (data.alarmName as string) ?? 'Alarm',
              time: (data.alarmTime as string) ?? '',
              customSoundUri: (data.customSoundUri as string) ?? '',
            },
          });
        }
      }
    );

    return () => {
      clearTimeout(restoreTimer);
      notificationSubscription.current?.remove();
    };
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
