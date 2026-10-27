import nuveenAlarm, { isAlarmKitLinked } from '../../modules/nuveen-alarm';
import { scheduleAlarmNotification, cancelAlarmNotification } from '../notifications';
import { syncAlarm } from '../alarmScheduler';
import type { Alarm } from '../storage';

jest.mock('../../modules/nuveen-alarm', () => ({
  __esModule: true,
  isAlarmKitLinked: jest.fn(),
  default: {
    getAuthorizationState: jest.fn(),
    requestAuthorization: jest.fn(),
    cancel: jest.fn(),
    schedule: jest.fn(),
  },
}));
jest.mock('../notifications', () => ({
  scheduleAlarmNotification: jest.fn(),
  cancelAlarmNotification: jest.fn(),
}));

const native = nuveenAlarm as jest.Mocked<typeof nuveenAlarm>;
const alarm = { id: 'a1', name: 'Wake', time: '07:30', enabled: true, repeatDays: [1, 2] } as Alarm;

beforeEach(() => {
  jest.clearAllMocks();
  (isAlarmKitLinked as jest.Mock).mockReturnValue(true);
  native.getAuthorizationState.mockReturnValue('authorized');
});

describe('syncAlarm', () => {
  it('schedules through AlarmKit when authorized', async () => {
    await syncAlarm(alarm);
    expect(native.schedule).toHaveBeenCalledWith({
      id: 'a1', title: 'Wake', hour: 7, minute: 30, weekdays: [1, 2],
    });
    expect(scheduleAlarmNotification).not.toHaveBeenCalled();
  });

  it('removes notifications left by older builds so the alarm does not ring twice', async () => {
    await syncAlarm(alarm);
    expect(cancelAlarmNotification).toHaveBeenCalledWith('a1');
  });

  it('falls back to notifications when alarm access is denied', async () => {
    native.getAuthorizationState.mockReturnValue('denied');
    await syncAlarm(alarm);
    expect(native.schedule).not.toHaveBeenCalled();
    expect(scheduleAlarmNotification).toHaveBeenCalledWith(alarm);
  });

  it('falls back to notifications when the user declines the prompt', async () => {
    native.getAuthorizationState.mockReturnValue('notDetermined');
    native.requestAuthorization.mockResolvedValue('denied');
    await syncAlarm(alarm);
    expect(native.schedule).not.toHaveBeenCalled();
    expect(scheduleAlarmNotification).toHaveBeenCalledWith(alarm);
  });

  it('uses notifications when the native module is missing', async () => {
    (isAlarmKitLinked as jest.Mock).mockReturnValue(false);
    await syncAlarm(alarm);
    expect(scheduleAlarmNotification).toHaveBeenCalledWith(alarm);
  });

  it('rejects a malformed time instead of passing NaN to native code', async () => {
    await expect(syncAlarm({ ...alarm, time: 'bad' })).rejects.toThrow('Invalid alarm time');
    expect(native.schedule).not.toHaveBeenCalled();
  });
});
