import nuveenAlarm from '../modules/nuveen-alarm';
import { getAlarms } from './storage';

interface RingingRoute {
  pathname: '/alarm-ringing';
  params: Record<string, string>;
}

/**
 * Opens the ringing screen with the NFC scan already started when the user
 * tapped "Scan NFC" on the lock-screen alarm. Returns true if it navigated.
 */
export const openPendingScan = async (replace: (route: RingingRoute) => void): Promise<boolean> => {
  const alarmId = nuveenAlarm.pendingScanAlarmId();
  if (!alarmId) return false;
  nuveenAlarm.clearPendingScan();
  const match = (await getAlarms()).find((a) => a.id === alarmId);
  replace({
    pathname: '/alarm-ringing',
    params: {
      alarmId,
      alarmName: match?.name ?? 'Alarm',
      time: match?.time ?? '',
      customSoundUri: match?.customSoundUri ?? '',
      autoScan: '1',
    },
  });
  return true;
};
