// Run: npx tsx scripts/selfcheck.ts — checks the alarm schedule and greeting logic.
import assert from 'node:assert/strict';
import { upcomingOccurrences, dayLabel } from '../utils/schedule';
import { dayPeriod, greeting, punchline } from '../utils/greetings';
import type { Alarm } from '../utils/storage';

const base: Alarm = { id: 'a', name: 'A', time: '07:00', repeatDays: [], enabled: true, nfcRequired: true, gradientTheme: 'dawn' };
const fri2200 = new Date(2026, 10, 20, 22, 0); // Friday 20 Nov 2026, 22:00

// One-time alarm: next 07:00 is tomorrow, exactly once.
const once = upcomingOccurrences([base], fri2200);
assert.equal(once.length, 1);
assert.equal(once[0].date.getDate(), 21);

// Weekdays only (Mon-Fri) from Friday night: next is Monday the 23rd.
const weekdays = upcomingOccurrences([{ ...base, repeatDays: [1, 2, 3, 4, 5] }], fri2200);
assert.equal(weekdays[0].date.getDate(), 23);
assert.ok(weekdays.every(o => o.date.getDay() >= 1 && o.date.getDay() <= 5));

// Disabled alarms never ring; results are sorted across alarms.
assert.equal(upcomingOccurrences([{ ...base, enabled: false }], fri2200).length, 0);
const mixed = upcomingOccurrences([{ ...base, id: 'b', time: '23:00' }, base], fri2200);
assert.deepEqual(mixed.map(o => o.alarm.id), ['b', 'a']);

assert.equal(dayLabel(new Date(2026, 10, 20, 23), fri2200), 'today');
assert.equal(dayLabel(new Date(2026, 10, 21, 7), fri2200), 'tomorrow');
assert.equal(dayLabel(new Date(2026, 10, 23, 7), fri2200), 'on Monday');

assert.equal(dayPeriod(new Date(2026, 0, 1, 7)), 'morning');
assert.equal(dayPeriod(new Date(2026, 0, 1, 14)), 'afternoon');
assert.equal(dayPeriod(new Date(2026, 0, 1, 19)), 'evening');
assert.equal(dayPeriod(new Date(2026, 0, 1, 2)), 'night');
assert.equal(greeting(new Date(2026, 0, 1, 7)), 'Good morning');
assert.ok(punchline(new Date(), () => 0.999999).length > 0);
assert.notEqual(punchline(new Date(2026, 0, 1, 7), () => 0), punchline(new Date(2026, 0, 1, 2), () => 0));

console.log('selfcheck ok');
