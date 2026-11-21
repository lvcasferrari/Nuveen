export type DayPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export const dayPeriod = (d: Date): DayPeriod => {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
};

const GREETINGS: Record<DayPeriod, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  night: 'Hello, night owl',
};

export const greeting = (d: Date = new Date()): string => GREETINGS[dayPeriod(d)];

// Brand voice: short, calm, no exclamation marks, no emoji.
const LINES: Record<DayPeriod, string[]> = {
  morning: [
    'The coffee will not make itself.',
    'You beat the snooze button. It never stood a chance.',
    'Sunlight, water, then the world.',
    'Feet on the floor. The hardest part is done.',
  ],
  afternoon: [
    'Nap complete. The afternoon is still yours.',
    'Back from the pillow. Carry on.',
    'Rested and a little dangerous.',
  ],
  evening: [
    'The evening is young, and so are you.',
    'A fresh start, a few hours late. Still counts.',
    'Up and ready. Dinner will not cook itself either.',
  ],
  night: [
    'The world is quiet. Good time to begin.',
    'Night shift mode: on.',
    'Even the moon is impressed.',
  ],
};

const ANYTIME = [
  'You walked to the tag. That counts as exercise.',
  'Small win. Take it.',
  'One scan closer to being a morning person.',
  'Your bed will miss you. It will be fine.',
  'Wake with intention. Or at least wake.',
  'Up, out, onward.',
];

export const punchline = (d: Date = new Date(), rand: () => number = Math.random): string => {
  const pool = [...LINES[dayPeriod(d)], ...ANYTIME];
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
};
