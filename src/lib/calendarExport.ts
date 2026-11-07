import type { AppData } from './model'

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\n|\r/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function foldIcsLine(line: string): string {
  const parts: string[] = []
  let current = ''
  let byteLength = 0

  for (const character of Array.from(line)) {
    const characterBytes = new TextEncoder().encode(character).length
    if (byteLength + characterBytes > 75) {
      parts.push(current)
      current = ' '
      byteLength = 1
    }
    current += character
    byteLength += characterBytes
  }

  parts.push(current)
  return parts.join('\r\n')
}

function toIcsDate(dateKey: string): string {
  return dateKey.replace(/-/g, '')
}

function addOneDay(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + 1))
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`
}

function stampNow(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

type IcsEvent = {
  uid: string
  date: string
  summary: string
  description: string
  category: string
}

export function buildLifeRpgCalendar(data: AppData): { content: string; eventCount: number } {
  const events: IcsEvent[] = []
  const attributeName = (id: string) => data.attributes.find((attribute) => attribute.id === id)?.name || 'General'

  for (const quest of data.quests) {
    if (!quest.dueDate || !DATE_KEY.test(quest.dueDate)) continue
    const completedOnce = quest.recurrence === 'none' && data.xpEvents.some((event) => event.questId === quest.id)
    if (completedOnce) continue
    events.push({
      uid: `quest-${quest.id}@life-rpg.app`,
      date: quest.dueDate,
      summary: `Quest deadline: ${quest.title}`,
      description: [
        `LIFE RPG ${quest.category} quest`,
        `Attribute: ${attributeName(quest.attributeId)}`,
        `Difficulty: ${quest.difficulty}`,
        `Reward: ${quest.xp} XP`,
        quest.description,
      ].filter(Boolean).join('\n'),
      category: 'Quest',
    })
  }

  for (const event of data.xpEvents) {
    if (!DATE_KEY.test(event.date)) continue
    events.push({
      uid: `xp-${event.id}@life-rpg.app`,
      date: event.date,
      summary: `Quest completed: ${event.questTitle} (+${event.xp} XP)`,
      description: [
        'LIFE RPG completed activity',
        `Attribute: ${attributeName(event.attributeId)}`,
        `XP earned: ${event.xp}`,
        event.minutes > 0 ? `Time recorded: ${event.minutes} minutes` : '',
      ].filter(Boolean).join('\n'),
      category: 'Completed Activity',
    })
  }

  for (const log of data.habitLogs) {
    if (!DATE_KEY.test(log.date)) continue
    const habit = data.habits.find((item) => item.id === log.habitId)
    events.push({
      uid: `habit-${log.id}@life-rpg.app`,
      date: log.date,
      summary: `Habit completed: ${habit?.title || 'Habit'}`,
      description: [
        'LIFE RPG habit check-in',
        `Attribute: ${habit ? attributeName(habit.attributeId) : 'General'}`,
      ].join('\n'),
      category: 'Habit',
    })
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LIFE RPG//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:LIFE RPG',
    'X-WR-CALDESC:Quest deadlines, completed activities and habit check-ins from LIFE RPG',
  ]

  const stamp = stampNow()
  for (const event of events) {
    const start = toIcsDate(event.date)
    const end = toIcsDate(addOneDay(event.date))
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeIcsText(event.summary)}`,
      `DESCRIPTION:${escapeIcsText(event.description)}`,
      `CATEGORIES:${escapeIcsText(event.category)},LIFE RPG`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  return { content: `${lines.map(foldIcsLine).join('\r\n')}\r\n`, eventCount: events.length }
}
