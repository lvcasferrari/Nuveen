import nuveenAlarm from '../../modules/nuveen-alarm';
import { getAlarms } from '../storage';
import { openPendingScan } from '../pendingScan';

jest.mock('../../modules/nuveen-alarm', () => ({
  __esModule: true,
  default: { pendingScanAlarmId: jest.fn(), clearPendingScan: jest.fn() },
}));
jest.mock('../storage', () => ({ getAlarms: jest.fn() }));

const native = nuveenAlarm as jest.Mocked<typeof nuveenAlarm>;

beforeEach(() => jest.clearAllMocks());

describe('openPendingScan', () => {
  it('does nothing when no scan is pending', async () => {
    native.pendingScanAlarmId.mockReturnValue(null);
    const replace = jest.fn();
    expect(await openPendingScan(replace)).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it('opens the ringing screen and starts the scan straight away', async () => {
    native.pendingScanAlarmId.mockReturnValue('a1');
    (getAlarms as jest.Mock).mockResolvedValue([{ id: 'a1', name: 'Wake', time: '07:30' }]);
    const replace = jest.fn();

    expect(await openPendingScan(replace)).toBe(true);
    expect(native.clearPendingScan).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith({
      pathname: '/alarm-ringing',
      params: { alarmId: 'a1', alarmName: 'Wake', time: '07:30', customSoundUri: '', autoScan: '1' },
    });
  });
});
