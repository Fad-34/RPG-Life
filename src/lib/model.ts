export type Attribute = {
  id: string;
  name: string;
  short: string;
  description: string;
  icon: string;
  core?: boolean;
};

export type QuestCategory = 'Daily' | 'Weekly' | 'Main' | 'Side' | 'Challenge';
export type Difficulty = 'Very Easy' | 'Easy' | 'Normal' | 'Hard' | 'Very Hard' | 'Legendary';
export type Quest = {
  id: string;
  title: string;
  description: string;
  attributeId: string;
  category: QuestCategory;
  difficulty: Difficulty;
  xp: number;
  dueDate?: string;
  recurrence: 'none' | 'daily' | 'weekly';
  minutesPerCompletion?: number;
  createdAt: string;
};
export type XpEvent = {
  id: string;
  questId: string;
  questTitle: string;
  attributeId: string;
  xp: number;
  date: string;
  createdAt: string;
  minutes: number;
};
export type Habit = {
  id: string;
  title: string;
  attributeId: string;
  schedule: 'daily' | 'weekly';
  createdAt: string;
};
export type HabitLog = { id: string; habitId: string; date: string };
export type JournalEntry = {
  id: string;
  date: string;
  mood: string;
  wins: string;
  challenges: string;
  lessons: string;
  gratitude: string;
  reflection: string;
  updatedAt: string;
};
export type Profile = { name: string; title: string; createdAt: string; theme: 'dark' | 'light'; avatar?: string };
export type AppData = {
  version: 1;
  isSampleData: boolean;
  profile: Profile;
  attributes: Attribute[];
  quests: Quest[];
  xpEvents: XpEvent[];
  habits: Habit[];
  habitLogs: HabitLog[];
  journal: JournalEntry[];
};

export const STORAGE_KEY = 'life-rpg-data-v1';
export const DIFFICULTY_XP: Record<Difficulty, number> = {
  'Very Easy': 5,
  Easy: 10,
  Normal: 20,
  Hard: 35,
  'Very Hard': 50,
  Legendary: 100,
};

export const DEFAULT_ATTRIBUTES: Attribute[] = [
  { id: 'spirit', name: 'Spirituality', short: 'SPIRIT', description: 'Faith, values, reflection and inner grounding.', icon: '✧', core: true },
  { id: 'knowledge', name: 'Knowledge', short: 'INT', description: 'Learning, study, reading and intellectual growth.', icon: '⌘', core: true },
  { id: 'vitality', name: 'Vitality', short: 'VIT', description: 'Movement, fitness, rest and physical wellbeing.', icon: '◈', core: true },
  { id: 'discipline', name: 'Discipline', short: 'DIS', description: 'Consistency, routines and self-management.', icon: '◷', core: true },
  { id: 'craft', name: 'Career & Craft', short: 'CRF', description: 'Professional skills, projects and meaningful work.', icon: '⌁', core: true },
  { id: 'relationships', name: 'Relationships', short: 'SOC', description: 'Family, friendships and communication.', icon: '◎', core: true },
  { id: 'finance', name: 'Financial Intelligence', short: 'FIN', description: 'Saving, budgeting and responsible decisions.', icon: '◌', core: true },
  { id: 'contribution', name: 'Contribution', short: 'CON', description: 'Volunteering, leadership and helping others.', icon: '◇', core: true },
];

const today = () => localDateKey(new Date());
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
export function createInitialData(sample = true): AppData {
  const now = new Date();
  const day = localDateKey(now);
  const yesterdayDate = new Date(now); yesterdayDate.setDate(now.getDate() - 1);
  const yesterday = localDateKey(yesterdayDate);
  const base: AppData = {
    version: 1,
    isSampleData: sample,
    profile: { name: 'Adventurer', title: 'Rookie Explorer', createdAt: now.toISOString(), theme: 'dark', avatar: '✦' },
    attributes: DEFAULT_ATTRIBUTES,
    quests: [], xpEvents: [], habits: [], habitLogs: [], journal: [],
  };
  if (!sample) return base;
  const q1: Quest = { id: 'sample-q1', title: 'Complete a focused study session', description: 'Spend 45 minutes learning something that moves you forward.', attributeId: 'knowledge', category: 'Daily', difficulty: 'Normal', xp: 20, recurrence: 'daily', createdAt: now.toISOString() };
  const q2: Quest = { id: 'sample-q2', title: 'Move your body', description: 'A walk, gym session or short workout counts.', attributeId: 'vitality', category: 'Daily', difficulty: 'Easy', xp: 10, recurrence: 'daily', createdAt: now.toISOString() };
  const q3: Quest = { id: 'sample-q3', title: 'Build a portfolio project', description: 'Make one concrete improvement to a project.', attributeId: 'craft', category: 'Main', difficulty: 'Hard', xp: 35, recurrence: 'none', createdAt: now.toISOString() };
  const q4: Quest = { id: 'sample-q4', title: 'Reset your space', description: 'Clear your desk and prepare for tomorrow.', attributeId: 'discipline', category: 'Side', difficulty: 'Very Easy', xp: 5, recurrence: 'daily', createdAt: now.toISOString() };
  base.quests = [q1, q2, q3, q4];
  base.habits = [
    { id: 'sample-h1', title: 'Read for 20 minutes', attributeId: 'knowledge', schedule: 'daily', createdAt: now.toISOString() },
    { id: 'sample-h2', title: 'Exercise or walk', attributeId: 'vitality', schedule: 'daily', createdAt: now.toISOString() },
    { id: 'sample-h3', title: 'Review spending', attributeId: 'finance', schedule: 'weekly', createdAt: now.toISOString() },
  ];
  base.habitLogs = [{ id: 'sample-log1', habitId: 'sample-h1', date: yesterday }];
  base.xpEvents = [
    { id: 'sample-event1', questId: 'sample-old', questTitle: 'Read a technical article', attributeId: 'knowledge', xp: 20, date: yesterday, createdAt: yesterdayDate.toISOString(), minutes: 25 },
    { id: 'sample-event2', questId: 'sample-old2', questTitle: 'Evening walk', attributeId: 'vitality', xp: 10, date: yesterday, createdAt: yesterdayDate.toISOString(), minutes: 20 },
  ];
  return base;
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialData(true);
    const parsed = JSON.parse(raw) as AppData;
    if (parsed.version !== 1 || !parsed.profile || !Array.isArray(parsed.attributes)) return createInitialData(true);
    return parsed;
  } catch {
    return createInitialData(true);
  }
}
export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
export function xpToNext(level: number): number {
  return 100 + Math.max(0, level - 1) * 50;
}
export function levelFromXp(totalXp: number): { level: number; current: number; required: number; progress: number } {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  let required = xpToNext(level);
  while (remaining >= required && level < 999) {
    remaining -= required;
    level += 1;
    required = xpToNext(level);
  }
  return { level, current: remaining, required, progress: Math.min(100, (remaining / required) * 100) };
}
export function totalXp(data: AppData): number {
  return data.xpEvents.reduce((sum, event) => sum + event.xp, 0);
}
export function xpForAttribute(data: AppData, attributeId: string): number {
  return data.xpEvents.filter((event) => event.attributeId === attributeId).reduce((sum, event) => sum + event.xp, 0);
}
export function completedToday(data: AppData, quest: Quest, date = today()): boolean {
  return data.xpEvents.some((event) => event.questId === quest.id && event.date === date);
}
export function questIsOverdue(quest: Quest): boolean {
  return Boolean(quest.dueDate && quest.dueDate < today() && !completedTodayForDateIndependent(quest));
}
function completedTodayForDateIndependent(_quest: Quest): boolean { return false; }
export function eventMinutesToday(data: AppData): number {
  const key = today();
  return data.xpEvents.filter((event) => event.date === key).reduce((sum, event) => sum + (event.minutes || 0), 0);
}
export function currentStreak(data: AppData): number {
  const days = new Set(data.xpEvents.map((event) => event.date));
  let cursor = new Date();
  let streak = 0;
  if (!days.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
export function habitDone(data: AppData, habitId: string, date = today()): boolean {
  return data.habitLogs.some((log) => log.habitId === habitId && log.date === date);
}
export function habitStreak(data: AppData, habitId: string): number {
  const dates = new Set(data.habitLogs.filter((log) => log.habitId === habitId).map((log) => log.date));
  let cursor = new Date();
  let streak = 0;
  if (!dates.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(localDateKey(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}
export function weekStart(date: Date): Date {
  const d = new Date(date); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); d.setHours(0,0,0,0); return d;
}
export function dateLabel(key: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  return dateFromKey(key).toLocaleDateString(undefined, options);
}
