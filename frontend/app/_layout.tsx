import React, { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { AlarmProvider } from '../contexts/AlarmContext';
import { GradientProvider } from '../contexts/GradientContext';
import { requestNotificationPermissions, setupNotificationChannel } from '../utils/notifications';
import { getActiveAlarm, setActiveAlarm, getAlarms, updateAlarm } from '../utils/storage';
import { startAlarmSound, configureAudioSession } from '../utils/alarmAudio';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

export default function RootLayout() {
  const notificationSubscription = useRef<Notifications.Subscription | null>(null);
  const receivedSubscription = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    requestNotificationPermissions().catch(console.error);
    setupNotificationChannel().catch(console.error);

    const navigateToAlarm = async (data: Record<string, unknown>) => {
      if (!data?.alarmId) return;

      const alarmId = data.alarmId as string;
      const uri = (data.customSoundUri as string) || undefined;

      // Store active alarm so cold-start restore works
      await setActiveAlarm({
        alarmId,
        alarmName: (data.alarmName as string) ?? 'Alarm',
        alarmTime: (data.alarmTime as string) ?? '',
        customSoundUri: uri,
        nfcFailedAttempts: 0,
        startedAt: new Date().toISOString(),
      }).catch(() => {});

      // Auto-disable one-time alarms (no repeat days) so they don't re-fire
      try {
        const alarms = await getAlarms();
        const alarm = alarms.find(a => a.id === alarmId);
        if (alarm && alarm.repeatDays.length === 0) {
          await updateAlarm({ ...alarm, enabled: false });
        }
      } catch {}

      // Fire alarm sound immediately — don't wait for UI navigation
      configureAudioSession()
        .then(() => startAlarmSound(uri))
        .catch(() => {});

      router.replace({
        pathname: '/alarm-ringing',
        params: {
          alarmId,
          alarmName: (data.alarmName as string) ?? 'Alarm',
          time: (data.alarmTime as string) ?? '',
          customSoundUri: (data.customSoundUri as string) ?? '',
        },
      });
    };

    // Restore active alarm session if one was interrupted (e.g. app killed while alarm was ringing)
    const checkActiveAlarm = async () => {
      // First try stored active alarm
      const active = await getActiveAlarm();
      if (active) {
        // Restart sound on cold-start restore — the original sound died with the process
        configureAudioSession()
          .then(() => startAlarmSound(active.customSoundUri))
          .catch(() => {});

        router.replace({
          pathname: '/alarm-ringing',
          params: {
            alarmId: active.alarmId,
            alarmName: active.alarmName,
            time: active.alarmTime,
            customSoundUri: active.customSoundUri ?? '',
          },
        });
        return;
      }
      // Fallback: check if there's a delivered alarm notification (app killed while alarm fired)
      try {
        const presented = await Notifications.getPresentedNotificationsAsync();
        const alarmNotif = presented.find(n => n.request.content.data?.alarmId);
        if (alarmNotif) {
          const data = alarmNotif.request.content.data as Record<string, unknown>;
          await navigateToAlarm(data);
        }
      } catch {
        // getPresentedNotificationsAsync may not be available on all platforms
      }
    };
    const restoreTimer = setTimeout(() => checkActiveAlarm(), 200);

    // Navigate immediately when notification arrives (app running in foreground/background)
    receivedSubscription.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        navigateToAlarm(notification.request.content.data as Record<string, unknown>);
      }
    );

    // Navigate to alarm-ringing when user taps an alarm notification (app killed/suspended)
    notificationSubscription.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        navigateToAlarm(response.notification.request.content.data as Record<string, unknown>);
      }
    );

    return () => {
      clearTimeout(restoreTimer);
      receivedSubscription.current?.remove();
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
