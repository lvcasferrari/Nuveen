import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alarm } from './storage';

const ALARM_CHANNEL_ID = 'nuveen_alarms';

// Number of follow-up notifications to schedule after the main alarm.
// Each fires 1 minute apart, so 5 follow-ups = 5 minutes of repeated ringing.
// This is critical on iOS: when the app is closed, the ONLY way to make sound
// is through notification sounds. Each notification plays the sound once (~4-30s),
// then goes silent. Burst notifications keep "ringing" until the user opens the app.
const BURST_COUNT = 5;
const BURST_INTERVAL_SECONDS = 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const setupNotificationChannel = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
      name: 'Alarms',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'alarm.mp3',
      vibrationPattern: [0, 500, 500, 500],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      enableLights: true,
      lightColor: '#F4C07A',
    });
  } catch (error) {
    console.error('Error setting up notification channel:', error);
  }
};

export const setupNotificationCategories = async (): Promise<void> => {
  try {
    await Notifications.setNotificationCategoryAsync('ALARM', [
      {
        identifier: 'SCAN_NFC',
        buttonTitle: 'Open & Scan NFC',
        options: { opensAppToForeground: true },
      },
    ]);
  } catch (error) {
    console.error('Error setting up notification categories:', error);
  }
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
          allowCriticalAlerts: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

const buildAlarmContent = (alarm: Alarm, burstIndex: number): Notifications.NotificationContentInput => ({
  title: alarm.name || 'Nuveen Alarm',
  body: burstIndex === 0
    ? 'Scan your NFC tag to stop the alarm'
    : 'Alarm is still ringing! Open to scan NFC.',
  sound: 'alarm.mp3',
  priority: Notifications.AndroidNotificationPriority.MAX,
  vibrate: [0, 500, 500, 500],
  sticky: true,
  autoDismiss: false,
  categoryIdentifier: 'ALARM',
  data: {
    alarmId: alarm.id,
    requiresNFC: alarm.nfcRequired,
    alarmName: alarm.name,
    alarmTime: alarm.time,
    customSoundUri: alarm.customSoundUri ?? null,
    burstIndex,
  },
  ...(Platform.OS === 'android' && {
    channelId: ALARM_CHANNEL_ID,
  }),
  ...(Platform.OS === 'ios' && {
    interruptionLevel: 'timeSensitive',
  }),
});

export const scheduleAlarmNotification = async (alarm: Alarm): Promise<string | null> => {
  try {
    await cancelAlarmNotification(alarm.id);

    if (!alarm.enabled) return null;

    const [hours, minutes] = alarm.time.split(':').map(Number);
    let firstId: string | null = null;

    if (alarm.repeatDays.length > 0) {
      // Weekly repeating: schedule one set of burst notifications per selected day
      for (const weekday of alarm.repeatDays) {
        // expo-notifications weekday: 1=Sunday...7=Saturday
        // our repeatDays: 0=Sunday...6=Saturday
        for (let burst = 0; burst <= BURST_COUNT; burst++) {
          const burstMinute = minutes + burst;
          const triggerHour = hours + Math.floor(burstMinute / 60);
          const triggerMinute = burstMinute % 60;

          const notificationId = await Notifications.scheduleNotificationAsync({
            content: buildAlarmContent(alarm, burst),
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: weekday + 1,
              hour: triggerHour % 24,
              minute: triggerMinute,
              channelId: Platform.OS === 'android' ? ALARM_CHANNEL_ID : undefined,
            },
          });

          if (burst === 0 && !firstId) firstId = notificationId;
        }
      }
      console.log(`Alarm scheduled: ${alarm.name} at ${alarm.time} on days [${alarm.repeatDays}] with ${BURST_COUNT} follow-ups`);
    } else {
      // One-time alarm: schedule DATE triggers for burst
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      for (let burst = 0; burst <= BURST_COUNT; burst++) {
        const burstTime = new Date(scheduledTime.getTime() + burst * BURST_INTERVAL_SECONDS * 1000);

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: buildAlarmContent(alarm, burst),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: burstTime,
            channelId: Platform.OS === 'android' ? ALARM_CHANNEL_ID : undefined,
          },
        });

        if (burst === 0) firstId = notificationId;
      }
      console.log(`Alarm scheduled: ${alarm.name} at ${alarm.time} one-time with ${BURST_COUNT} follow-ups`);
    }

    return firstId;
  } catch (error) {
    console.error('Error scheduling alarm notification:', error);
    return null;
  }
};

export const cancelAlarmNotification = async (alarmId: string): Promise<void> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.content.data?.alarmId === alarmId) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (error) {
    console.error('Error canceling alarm notification:', error);
  }
};

// Cancel all pending notifications for a specific alarm AND dismiss delivered ones.
// Called when an alarm is dismissed via NFC to stop burst follow-ups from firing.
export const cancelAndDismissAlarmNotifications = async (alarmId: string): Promise<void> => {
  try {
    // Cancel all pending scheduled notifications for this alarm (burst follow-ups)
    await cancelAlarmNotification(alarmId);
    // Dismiss any already-delivered notifications from the notification tray
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error canceling/dismissing alarm notifications:', error);
  }
};

export const cancelAllAlarmNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};
