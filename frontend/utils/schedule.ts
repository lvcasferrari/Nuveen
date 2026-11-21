import type { Alarm } from './storage';

export interface Occurrence {
  alarm: Alarm;
  date: Date;
}

// Next ring times of all enabled alarms, soonest first. One-time alarms ring once.
export const upcomingOccurrences = (alarms: Alarm[], now: Date, days = 8): Occurrence[] => {
  const out: Occurrence[] = [];
  for (const alarm of alarms) {
    if (!alarm.enabled) continue;
    const [h, m] = alarm.time.split(':').map(Number);
    for (let d = 0; d < days; d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, h, m, 0, 0);
      if (date <= now) continue;
      if (alarm.repeatDays.length > 0 && !alarm.repeatDays.includes(date.getDay())) continue;
      out.push({ alarm, date });
      if (alarm.repeatDays.length === 0) break;
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
};

// "today", "tomorrow", or the weekday name, relative to `from`.
export const dayLabel = (date: Date, from: Date): string => {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(date) - start(from)) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `on ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
};
