jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { clampVolume, MIN_ALARM_VOLUME } from '../storage';

describe('clampVolume', () => {
  it('defaults to full volume for missing or garbage input', () => {
    expect(clampVolume(undefined)).toBe(1);
    expect(clampVolume('abc')).toBe(1);
    expect(clampVolume(NaN)).toBe(1);
  });

  it('never lets an alarm go silent or above max', () => {
    expect(clampVolume(0)).toBe(MIN_ALARM_VOLUME);
    expect(clampVolume(-5)).toBe(MIN_ALARM_VOLUME);
    expect(clampVolume(3)).toBe(1);
  });

  it('parses route-param strings and snaps to 10% steps', () => {
    expect(clampVolume('0.4')).toBe(0.4);
    expect(clampVolume(0.1 + 0.2)).toBe(0.3);
  });
});
