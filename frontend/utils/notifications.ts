import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alarm, alarmSoundFile, clampVolume, previewSoundFile } from './storage';
import { dayLabel, upcomingOccurrences } from './schedule';
import { greeting } from './greetings';

const ALARM_CHANNEL_ID = 'nuveen_alarms';

// One notification per alarm occurrence. iOS keeps only the 64 soonest pending
// local notifications, so we must not multiply by bursts × weekdays. Continued
// ringing once the app is opened is handled by the in-app sound watchdog.

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

const buildAlarmContent = (alarm: Alarm): Notifications.NotificationContentInput => ({
  title: alarm.name || 'Nuveen Alarm',
  body: 'Scan your NFC tag to stop the alarm',
  // iOS notification sounds must be CAF/WAV/AIFF; the file carries the alarm's volume level.
  sound: Platform.OS === 'ios' ? alarmSoundFile(alarm.volume) : 'alarm.mp3',
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
    volume: clampVolume(alarm.volume),
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
      // Weekly repeating: one notification per selected day.
      // expo-notifications weekday: 1=Sunday...7=Saturday; our repeatDays: 0=Sunday...6=Saturday
      for (const weekday of alarm.repeatDays) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: buildAlarmContent(alarm),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: weekday + 1,
            hour: hours,
            minute: minutes,
            channelId: Platform.OS === 'android' ? ALARM_CHANNEL_ID : undefined,
          },
        });
        if (!firstId) firstId = notificationId;
      }
      console.log(`Alarm scheduled: ${alarm.name} at ${alarm.time} on days [${alarm.repeatDays}]`);
    } else {
      // One-time alarm: a single DATE trigger at the next occurrence
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      firstId = await Notifications.scheduleNotificationAsync({
        content: buildAlarmContent(alarm),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: scheduledTime,
          channelId: Platform.OS === 'android' ? ALARM_CHANNEL_ID : undefined,
        },
      });
      console.log(`Alarm scheduled: ${alarm.name} at ${alarm.time} one-time`);
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

// Plays the level's short preview through the notification sound path, the same alert
// volume AlarmKit rings at, so what you hear is how loud the alarm will be.
// Returns false when notifications are off (the caller then previews in-app).
export const previewAlarmVolume = async (volume: number): Promise<boolean> => {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return false;
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Volume preview',
      body: `${Math.round(clampVolume(volume) * 100)}%. This is how loud your alarm rings.`,
      sound: Platform.OS === 'ios' ? previewSoundFile(volume) : 'alarm.mp3',
      data: { preview: true },
    },
    trigger: null,
  });
  setTimeout(() => { Notifications.dismissNotificationAsync(id).catch(() => {}); }, 6000);
  return true;
};

const REMINDER_HOURS_BEFORE = 9; // around bedtime for a morning alarm
const MAX_REMINDERS = 7;

// "Your alarm is set" reminders ahead of the next alarms, greeting by time of day.
// Rebuilt whenever alarms change or the app opens.
export const scheduleAlarmReminders = async (alarms: Alarm[]): Promise<void> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.content.data?.reminder) await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
    const now = new Date();
    for (const { alarm, date } of upcomingOccurrences(alarms, now).slice(0, MAX_REMINDERS)) {
      const remindAt = new Date(date.getTime() - REMINDER_HOURS_BEFORE * 3600 * 1000);
      if (remindAt.getTime() <= now.getTime() + 60 * 1000) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: greeting(remindAt),
          body: `${alarm.name || 'Your alarm'} is set for ${alarm.time} ${dayLabel(date, remindAt)}. Keep your tag where you can walk to it.`,
          sound: false,
          data: { reminder: true },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: remindAt,
          channelId: Platform.OS === 'android' ? ALARM_CHANNEL_ID : undefined,
        },
      });
    }
  } catch (error) {
    console.error('Error scheduling alarm reminders:', error);
  }
};
