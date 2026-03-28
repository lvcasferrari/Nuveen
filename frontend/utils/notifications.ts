import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alarm } from './storage';

const ALARM_CHANNEL_ID = 'nuveen_alarms';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
          allowCriticalAlerts: false,
          allowsTimeSensitiveNotifications: true,
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

export const scheduleAlarmNotification = async (alarm: Alarm): Promise<string | null> => {
  try {
    await cancelAlarmNotification(alarm.id);

    if (!alarm.enabled) return null;

    const [hours, minutes] = alarm.time.split(':').map(Number);

    // One-time alarms need a Date trigger; repeating alarms use calendar trigger
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const trigger: any = alarm.repeatDays.length > 0
      ? { hour: hours, minute: minutes, repeats: true }
      : scheduledTime;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.name || 'Nuveen Alarm',
        body: 'Scan your NFC tag to stop the alarm',
        sound: 'alarm.mp3',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 500, 500, 500],
        sticky: true,
        autoDismiss: false,
        data: {
          alarmId: alarm.id,
          requiresNFC: alarm.nfcRequired,
          alarmName: alarm.name,
          alarmTime: alarm.time,
          customSoundUri: alarm.customSoundUri ?? null,
        },
        ...(Platform.OS === 'android' && {
          channelId: ALARM_CHANNEL_ID,
        }),
        ...(Platform.OS === 'ios' && {
          interruptionLevel: 'timeSensitive',
        }),
      },
      trigger,
    });

    console.log(`Alarm scheduled: ${alarm.name} at ${alarm.time} (ID: ${notificationId})`);
    return notificationId;
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

export const cancelAllAlarmNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};
