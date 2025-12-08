import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alarm } from './storage';

// Configure notification handler (only for development builds, not Expo Go)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (error) {
  console.log('Notification handler setup skipped (Expo Go limitation)');
}

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
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
    // Cancel existing notifications for this alarm
    await cancelAlarmNotification(alarm.id);

    if (!alarm.enabled) {
      return null;
    }

    const [hours, minutes] = alarm.time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const trigger = {
      hour: hours,
      minute: minutes,
      repeats: alarm.repeatDays.length > 0,
    };

    // Configure notification for maximum visibility and persistence
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.name || 'Nuveen Alarm',
        body: 'Scan your NFC tag to stop the alarm',
        sound: 'default', // Critical: play sound even in background
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250], // Vibration pattern
        sticky: true, // Make notification persistent (Android)
        autoDismiss: false, // Don't auto-dismiss (Android)
        categoryIdentifier: 'alarm', // Custom category for iOS
        data: {
          alarmId: alarm.id,
          requiresNFC: alarm.nfcRequired,
          alarmName: alarm.name,
          alarmTime: alarm.time,
          customSoundUri: alarm.customSoundUri, // Áudio personalizado
        },
      },
      trigger: trigger as any,
    });

    console.log(`✅ Alarm scheduled: ${alarm.name} at ${alarm.time} (ID: ${notificationId})`);
    return notificationId;
  } catch (error) {
    console.error('❌ Error scheduling alarm notification:', error);
    return null;
  }
};

export const cancelAlarmNotification = async (alarmId: string): Promise<void> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const alarmsToCancel = scheduled.filter(
      n => n.content.data?.alarmId === alarmId
    );

    for (const notification of alarmsToCancel) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
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