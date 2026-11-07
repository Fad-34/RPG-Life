import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type ChangeEvent, type CSSProperties } from 'react'
import {
  Activity, ArrowDownToLine, ArrowUpFromLine, Award, BarChart3, BookOpen, CalendarDays,
  Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3,
  Flame, Heart, Home, Layers3, ListTodo, Menu, Moon, MoreHorizontal, Pencil, Plus,
  RefreshCw, Search, Settings, ShieldCheck, Sparkles, Sun, Target, Trash2, Trophy,
  UserRound, Wallet, X, Zap, Dumbbell, Brain, HandHeart, Compass, Bookmark, type LucideIcon,
} from 'lucide-react'
import {
  type AppData, type Attribute, type Difficulty, type Habit, type JournalEntry, type Quest,
  type QuestCategory, DIFFICULTY_XP, STORAGE_KEY, createInitialData, currentStreak,
  dateFromKey, dateLabel, eventMinutesToday, habitStreak, levelFromXp,
  loadData, localDateKey, totalXp, uid, weekStart, xpForAttribute,
} from './lib/model'
import { buildLifeRpgCalendar } from './lib/calendarExport'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'

const NAV: { id: string; label: string; icon: LucideIcon; group?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, group: 'PLAY' },
  { id: 'quests', label: 'Quests', icon: ListTodo },
  { id: 'habits', label: 'Habits', icon: RefreshCw },
  { id: 'attributes', label: 'Attributes', icon: Layers3, group: 'CHARACTER' },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'INSIGHTS' },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'profile', label: 'Profile', icon: UserRound, group: 'PERSONAL' },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const CATEGORY_OPTIONS: QuestCategory[] = ['Daily', 'Weekly', 'Main', 'Side', 'Challenge']
const DIFFICULTIES = Object.keys(DIFFICULTY_XP) as Difficulty[]
const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
const todayKey = () => localDateKey(new Date())
const getQuestDone = (data: AppData, quest: Quest, date = todayKey()) => {
  const events = data.xpEvents.filter((event) => event.questId === quest.id)
  if (quest.recurrence === 'none') return events.length > 0
  if (quest.recurrence === 'daily') return events.some((event) => event.date === date)
  const start = localDateKey(weekStart(dateFromKey(date)))
  return events.some((event) => event.date >= start && event.date <= date)
}
const habitIsDone = (data: AppData, habit: Habit) => {
  if (habit.schedule === 'daily') return data.habitLogs.some((log) => log.habitId === habit.id && log.date === todayKey())
  const start = localDateKey(weekStart(new Date()))
  return data.habitLogs.some((log) => log.habitId === habit.id && log.date >= start)
}
const fmt = (n: number) => new Intl.NumberFormat().format(n)
const uidShort = () => uid().slice(-6).toUpperCase()

function Progress({ value, subtle = false }: { value: number; subtle?: boolean }) {
  return <div className={`progress ${subtle ? 'progress-subtle' : ''}`}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
}
function Modal({ title, onClose, children, size = 'medium' }: { title: string; onClose: () => void; children: ReactNode; size?: 'medium' | 'large' }) {
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
    <section className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-header"><div><div className="eyebrow">LIFE RPG / EDITOR</div><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></header>
      {children}
    </section>
  </div>
}
function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}
function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Sparkles size={20} /></div><h3>{title}</h3><p>{body}</p>{action}</div>
}
function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="section-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [page, setPage] = useState('dashboard')
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState('')
  const [questModal, setQuestModal] = useState(false)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const [questDraft, setQuestDraft] = useState({ title: '', description: '', attributeId: 'knowledge', category: 'Daily' as QuestCategory, difficulty: 'Normal' as Difficulty, xp: 20, dueDate: '', recurrence: 'daily' as Quest['recurrence'], minutesPerCompletion: 0 })
  const [habitModal, setHabitModal] = useState(false)
  const [habitDraft, setHabitDraft] = useState({ title: '', attributeId: 'discipline', schedule: 'daily' as Habit['schedule'] })
  const [journalModal, setJournalModal] = useState(false)
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null)
  const [journalDraft, setJournalDraft] = useState({ date: todayKey(), mood: 'Good', wins: '', challenges: '', lessons: '', gratitude: '', reflection: '' })
  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [attributeModal, setAttributeModal] = useState(false)
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null)
  const [attributeDraft, setAttributeDraft] = useState({ name: '', short: '', description: '', icon: '✦' })
  const [characterName, setCharacterName] = useState(data.profile.name)
  const [characterTitle, setCharacterTitle] = useState(data.profile.title)
  const [characterAvatar, setCharacterAvatar] = useState(data.profile.avatar || data.profile.name.slice(0, 1).toUpperCase())
  const [toast, setToast] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }, [data])
  useEffect(() => { document.documentElement.dataset.theme = data.profile.theme }, [data.profile.theme])
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(''), 2800); return () => window.clearTimeout(id) }, [toast])

  const xp = totalXp(data)
  const level = levelFromXp(xp)
  const today = todayKey()
  const todayXp = data.xpEvents.filter((event) => event.date === today).reduce((sum, event) => sum + event.xp, 0)
  const completedTodayCount = data.xpEvents.filter((event) => event.date === today).length
  const dailyQuests = data.quests.filter((q) => q.category === 'Daily' || q.category === 'Weekly')
  const dailyDone = dailyQuests.filter((q) => getQuestDone(data, q)).length
  const questCompletion = dailyQuests.length ? Math.round(dailyDone / dailyQuests.length * 100) : 0
  const activePage = NAV.find((item) => item.id === page)?.label || 'Dashboard'

  const changeData = (updater: (current: AppData) => AppData) => setData((current) => updater(current))
  const notify = (message: string) => setToast(message)
  const openNewQuest = () => {
    setEditingQuest(null)
    setQuestDraft({ title: '', description: '', attributeId: data.attributes[1]?.id || data.attributes[0]?.id || 'knowledge', category: 'Daily', difficulty: 'Normal', xp: 20, dueDate: '', recurrence: 'daily', minutesPerCompletion: 0 })
    setQuestModal(true)
  }
  const openEditQuest = (quest: Quest) => {
    setEditingQuest(quest)
    setQuestDraft({ title: quest.title, description: quest.description, attributeId: quest.attributeId, category: quest.category, difficulty: quest.difficulty, xp: quest.xp, dueDate: quest.dueDate || '', recurrence: quest.recurrence, minutesPerCompletion: quest.minutesPerCompletion || 0 })
    setQuestModal(true)
  }
  const saveQuest = (event: FormEvent) => {
    event.preventDefault()
    if (!questDraft.title.trim()) return
    const quest: Quest = { ...questDraft, title: questDraft.title.trim(), description: questDraft.description.trim(), id: editingQuest?.id || uid(), dueDate: questDraft.dueDate || undefined, createdAt: editingQuest?.createdAt || new Date().toISOString(), minutesPerCompletion: questDraft.minutesPerCompletion }
    changeData((current) => ({ ...current, quests: editingQuest ? current.quests.map((q) => q.id === editingQuest.id ? quest : q) : [quest, ...current.quests] }))
    setQuestModal(false); notify(editingQuest ? 'Quest updated' : 'Quest added to your log')
  }
  const completeQuest = (quest: Quest) => {
    if (getQuestDone(data, quest)) { notify('This quest has already been claimed'); return }
    const event = { id: uid(), questId: quest.id, questTitle: quest.title, attributeId: quest.attributeId, xp: quest.xp, date: today, createdAt: new Date().toISOString(), minutes: quest.minutesPerCompletion || 0 }
    changeData((current) => ({ ...current, xpEvents: [event, ...current.xpEvents] }))
    notify(`+${quest.xp} XP · ${data.attributes.find((a) => a.id === quest.attributeId)?.short || 'STAT'}`)
  }
  const deleteQuest = (quest: Quest) => {
    if (!window.confirm(`Delete "${quest.title}"? Previous XP history will be retained.`)) return
    changeData((current) => ({ ...current, quests: current.quests.filter((q) => q.id !== quest.id) })); notify('Quest deleted')
  }
  const toggleHabit = (habit: Habit) => {
    const currentWeek = localDateKey(weekStart(new Date()))
    const existing = data.habitLogs.find((log) => log.habitId === habit.id && (habit.schedule === 'daily' ? log.date === today : log.date >= currentWeek))
    const habitEventId = `habit:${habit.id}:${existing?.date || today}`
    changeData((current) => ({
      ...current,
      habitLogs: existing ? current.habitLogs.filter((log) => log.id !== existing.id) : [...current.habitLogs, { id: uid(), habitId: habit.id, date: today }],
      xpEvents: existing ? current.xpEvents.filter((event) => event.id !== habitEventId) : [{ id: habitEventId, questId: habitEventId, questTitle: `Habit: ${habit.title}`, attributeId: habit.attributeId, xp: 5, date: today, createdAt: new Date().toISOString(), minutes: 0 }, ...current.xpEvents],
          }))
    notify(existing ? 'Habit completion undone' : '+5 XP · habit completed')
  }
  const saveHabit = (event: FormEvent) => {
    event.preventDefault(); if (!habitDraft.title.trim()) return
    const habit: Habit = { id: uid(), title: habitDraft.title.trim(), attributeId: habitDraft.attributeId, schedule: habitDraft.schedule, createdAt: new Date().toISOString() }
    changeData((current) => ({ ...current, habits: [...current.habits, habit] }))
    setHabitDraft({ title: '', attributeId: 'discipline', schedule: 'daily' }); setHabitModal(false); notify('Habit created')
  }
  const deleteHabit = (habit: Habit) => {
    if (!window.confirm(`Delete habit "${habit.title}" and its completion history?`)) return
    changeData((current) => ({ ...current, habits: current.habits.filter((h) => h.id !== habit.id), habitLogs: current.habitLogs.filter((log) => log.habitId !== habit.id) })); notify('Habit deleted')
  }
  const openNewJournal = () => {
    setEditingJournal(null); setJournalDraft({ date: today, mood: 'Good', wins: '', challenges: '', lessons: '', gratitude: '', reflection: '' }); setJournalModal(true)
  }
  const openEditJournal = (entry: JournalEntry) => {
    setEditingJournal(entry); setJournalDraft({ date: entry.date, mood: entry.mood, wins: entry.wins, challenges: entry.challenges, lessons: entry.lessons, gratitude: entry.gratitude, reflection: entry.reflection }); setJournalModal(true)
  }
  const saveJournal = (event: FormEvent) => {
    event.preventDefault()
    const entry: JournalEntry = { ...journalDraft, id: editingJournal?.id || uid(), updatedAt: new Date().toISOString() }
    changeData((current) => ({ ...current, journal: editingJournal ? current.journal.map((j) => j.id === editingJournal.id ? entry : j) : [entry, ...current.journal] }))
    setJournalModal(false); notify('Journal entry saved privately on this device')
  }
  const deleteJournal = (entry: JournalEntry) => {
    if (!window.confirm('Delete this journal entry?')) return
    changeData((current) => ({ ...current, journal: current.journal.filter((j) => j.id !== entry.id) })); notify('Journal entry deleted')
  }
  const openAttribute = (attribute?: Attribute) => {
    setEditingAttribute(attribute || null)
    setAttributeDraft(attribute ? { name: attribute.name, short: attribute.short, description: attribute.description, icon: attribute.icon } : { name: '', short: '', description: '', icon: '✦' })
    setAttributeModal(true)
  }
  const saveAttribute = (event: FormEvent) => {
    event.preventDefault(); if (!attributeDraft.name.trim() || !attributeDraft.short.trim()) return
    const attr: Attribute = { ...attributeDraft, name: attributeDraft.name.trim(), short: attributeDraft.short.trim().toUpperCase().slice(0, 8), description: attributeDraft.description.trim(), id: editingAttribute?.id || `custom-${uid()}`, core: editingAttribute?.core }
    changeData((current) => ({ ...current, attributes: editingAttribute ? current.attributes.map((a) => a.id === editingAttribute.id ? attr : a) : [...current.attributes, attr] }))
    setAttributeModal(false); notify(editingAttribute ? 'Attribute updated' : 'Attribute added')
  }
  const deleteAttribute = (attribute: Attribute) => {
    if (attribute.core) { notify('Core attributes cannot be removed'); return }
    if (data.quests.some((q) => q.attributeId === attribute.id) || data.habits.some((h) => h.attributeId === attribute.id) || data.xpEvents.some((e) => e.attributeId === attribute.id)) { notify('Reassign or remove linked records before deleting this attribute'); return }
    if (!window.confirm(`Delete ${attribute.name}?`)) return
    changeData((current) => ({ ...current, attributes: current.attributes.filter((a) => a.id !== attribute.id) }))
  }
  const saveProfile = (event: FormEvent) => {
    event.preventDefault()
    changeData((current) => ({ ...current, profile: { ...current.profile, name: characterName.trim() || 'Adventurer', title: characterTitle.trim() || 'Adventurer', avatar: characterAvatar.trim() || '✦' } })); notify('Character profile updated')
  }
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `life-rpg-backup-${today}.json`; link.click(); URL.revokeObjectURL(url); notify('Backup downloaded')
  }
  const exportCalendar = () => {
    const calendar = buildLifeRpgCalendar(data)
    if (!calendar.eventCount) {
      notify('No dated quests, completed activities or habit check-ins to export yet')
      return
    }
    const blob = new Blob([calendar.content], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `life-rpg-calendar-${today}.ics`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    notify(`Calendar exported · ${calendar.eventCount} events`)
  }
  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as AppData
      if (parsed.version !== 1 || !parsed.profile || !Array.isArray(parsed.attributes) || !Array.isArray(parsed.quests) || !Array.isArray(parsed.xpEvents) || !Array.isArray(parsed.habits) || !Array.isArray(parsed.habitLogs) || !Array.isArray(parsed.journal)) throw new Error('Invalid backup')
      if (!window.confirm('Restore this backup? It will replace the progress currently stored in this browser.')) return
      setData({ ...createInitialData(false), ...parsed, isSampleData: false }); setCharacterName(parsed.profile.name); setCharacterTitle(parsed.profile.title); setCharacterAvatar(parsed.profile.avatar || parsed.profile.name.slice(0, 1).toUpperCase()); notify('Backup restored successfully')
    } catch { notify('That file is not a valid LIFE RPG backup') }
    finally { event.target.value = '' }
  }
  const removeSample = () => {
    if (!data.isSampleData) { notify('There is no sample data to remove'); return }
    if (!window.confirm('Remove all starter quests, habits and example activity? Your profile and attributes will remain.')) return
    setData((current) => {
      const sampleHabitIds = new Set(current.habits.filter((habit) => habit.id.startsWith('sample-')).map((habit) => habit.id))
      return {
        ...current,
        isSampleData: false,
        quests: current.quests.filter((quest) => !quest.id.startsWith('sample-')),
        xpEvents: current.xpEvents.filter((event) => !event.id.startsWith('sample-') && !event.questId.startsWith('sample-') && !event.questId.startsWith('habit:sample-')),
        habits: current.habits.filter((habit) => !sampleHabitIds.has(habit.id)),
        habitLogs: current.habitLogs.filter((log) => !sampleHabitIds.has(log.habitId) && !log.id.startsWith('sample-')),
      }
    }); notify('Starter data removed; your own records were kept')
  }
  const resetAll = () => {
    if (!window.confirm('Reset ALL LIFE RPG progress? This permanently clears quests, XP, habits, journal entries, and profile changes from this browser. Export a backup first if needed.')) return
    const fresh = createInitialData(false); setData(fresh); setCharacterName(fresh.profile.name); setCharacterTitle(fresh.profile.title); setCharacterAvatar(fresh.profile.avatar || '✦'); notify('Your adventure has been reset')
  }

  const renderDashboard = () => {
    const recent = [...data.xpEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)
    const todayQuests = data.quests.filter((q) => q.category === 'Daily' || q.category === 'Weekly' || q.category === 'Challenge')
    return <>
      <SectionHeader eyebrow="YOUR ADVENTURE / OVERVIEW" title={`Welcome back, ${data.profile.name}`} description="Small actions. Meaningful progression. Keep moving forward." action={<button className="button button-primary" onClick={openNewQuest}><Plus size={16} /> New quest</button>} />
      {data.isSampleData && <div className="sample-banner"><div><Sparkles size={16} /><span><b>Starter world loaded.</b> Example quests and activity are shown to help you explore.</span></div><button onClick={removeSample}>Remove sample data <X size={13} /></button></div>}
      <div className="hero-card">
        <div className="hero-top"><div><div className="eyebrow hero-eyebrow">CHARACTER STATUS <span>·</span> {data.profile.title.toUpperCase()}</div><h2>{data.profile.name}</h2><p>Your next level is built one action at a time.</p></div><div className="level-medallion"><span>LVL</span><strong>{level.level}</strong><small>ADVENTURER</small></div></div>
        <div className="hero-progress-label"><span>Experience</span><b>{fmt(xp)} / {fmt(xp + (level.required - level.current))} XP</b></div>
        <Progress value={level.progress} />
        <div className="hero-bottom"><span>{fmt(level.required - level.current)} XP to Level {level.level + 1}</span><span>{Math.round(level.progress)}% complete</span></div>
        <div className="hero-watermark">✧</div>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon"><Zap size={17} /></div><span>XP EARNED TODAY</span><strong>+{todayXp}</strong><small>Experience points</small></div>
        <div className="stat-card"><div className="stat-icon"><CheckCircle2 size={17} /></div><span>QUESTS COMPLETED</span><strong>{completedTodayCount}</strong><small>Today</small></div>
        <div className="stat-card"><div className="stat-icon"><Flame size={17} /></div><span>ACTIVE STREAK</span><strong>{currentStreak(data)} <em>days</em></strong><small>Days with XP activity</small></div>
        <div className="stat-card"><div className="stat-icon"><Clock3 size={17} /></div><span>FOCUSED TIME</span><strong>{eventMinutesToday(data)} <em>min</em></strong><small>Manually tracked quest time</small></div>
      </div>
      <div className="dashboard-grid">
        <section className="panel attribute-panel"><div className="panel-heading"><div><div className="eyebrow">CHARACTER BUILD</div><h2>Core attributes</h2></div><button className="text-button" onClick={() => setPage('attributes')}>View all <ChevronRight size={14} /></button></div>
          <div className="attribute-list">{data.attributes.slice(0, 8).map((attribute) => <AttributeRow key={attribute.id} attribute={attribute} xp={xpForAttribute(data, attribute.id)} count={data.xpEvents.filter((e) => e.attributeId === attribute.id).length} />)}</div>
        </section>
        <section className="panel quest-panel"><div className="panel-heading"><div><div className="eyebrow">TODAY'S OBJECTIVES</div><h2>Quest log</h2></div><button className="text-button" onClick={() => setPage('quests')}>View all <ChevronRight size={14} /></button></div>
          <div className="quest-summary"><div><strong>{dailyDone}<small> / {dailyQuests.length}</small></strong><span>daily & weekly cleared</span></div><div className="mini-ring" style={{ '--ring': `${questCompletion}%` } as CSSProperties}><b>{questCompletion}%</b></div></div>
          <Progress value={questCompletion} />
          <div className="compact-quests">{todayQuests.slice(0, 4).map((quest) => <QuestCompact key={quest.id} quest={quest} data={data} complete={completeQuest} edit={openEditQuest} />)}{!todayQuests.length && <Empty title="No active quests" body="Create a quest to give today a direction." action={<button className="button button-secondary" onClick={openNewQuest}><Plus size={14} /> Create quest</button>} />}</div>
        </section>
      </div>
      <section className="panel activity-panel"><div className="panel-heading"><div><div className="eyebrow">RECENT PROGRESS</div><h2>Activity feed</h2></div><button className="text-button" onClick={() => setPage('calendar')}>View history <ChevronRight size={14} /></button></div>
        {recent.length ? <div className="feed-list">{recent.map((event) => <div className="feed-item" key={event.id}><div className="feed-icon"><Zap size={15} /></div><div className="feed-copy"><b>{event.questTitle}</b><small>{data.attributes.find((a) => a.id === event.attributeId)?.short || 'STAT'} · {dateLabel(event.date)} · {event.minutes ? `${event.minutes} min` : 'Quest completed'}</small></div><strong>+{event.xp} XP</strong></div>)}</div> : <Empty title="Your story starts here" body="Complete a quest and your progress will appear here." />}
      </section>
    </>
  }

  const renderQuests = () => {
    const filtered = data.quests.filter((q) => `${q.title} ${q.description} ${q.category}`.toLowerCase().includes(search.toLowerCase()))
    return <>
      <SectionHeader eyebrow="MISSION CONTROL / QUESTS" title="Quest log" description="Turn your intentions into clear objectives and claim experience for the work you do." action={<button className="button button-primary" onClick={openNewQuest}><Plus size={16} /> Create quest</button>} />
      <div className="toolbar"><div className="search-box"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quests..." /></div><span className="muted-text">{data.quests.length} total quests</span></div>
      <div className="quest-category-grid">{CATEGORY_OPTIONS.map((category) => {
        const items = filtered.filter((q) => q.category === category)
        const completed = items.filter((q) => getQuestDone(data, q)).length
        return <section className="panel quest-category" key={category}><div className="panel-heading"><div><div className="eyebrow">{category.toUpperCase()} QUESTS</div><h2>{category}</h2></div><span className="count-pill">{completed}/{items.length}</span></div>
          {items.length ? <div className="quest-card-list">{items.map((quest) => <QuestCard key={quest.id} quest={quest} data={data} onComplete={completeQuest} onEdit={openEditQuest} onDelete={deleteQuest} />)}</div> : <div className="category-empty">No {category.toLowerCase()} quests yet.</div>}
        </section>
      })}</div>
    </>
  }

  const renderHabits = () => {
    const todayLogs = data.habits.filter((h) => habitIsDone(data, h))
    const percentage = data.habits.length ? Math.round(todayLogs.length / data.habits.length * 100) : 0
    const days = Array.from({ length: 28 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (27 - i)); const key = localDateKey(d); return { key, count: data.habitLogs.filter((l) => l.date === key).length } })
    return <>
      <SectionHeader eyebrow="CONSISTENCY / HABITS" title="Habit tracker" description="Build repeatable systems. A missed day is a pause, not a reset." action={<button className="button button-primary" onClick={() => setHabitModal(true)}><Plus size={16} /> New habit</button>} />
      <div className="habit-overview-grid"><div className="panel habit-score"><div className="eyebrow">TODAY'S CONSISTENCY</div><div className="habit-score-main"><div><strong>{percentage}%</strong><span>{todayLogs.length} of {data.habits.length} habits complete</span></div><div className="mini-ring big-ring" style={{ '--ring': `${percentage}%` } as CSSProperties}><b>{percentage}%</b></div></div><Progress value={percentage} /><p>Focus on returning to your routine. Progress is built over time.</p></div>
        <div className="panel"><div className="eyebrow">RECENT HABIT ACTIVITY</div><h2 className="panel-title">Last 28 days</h2><div className="heatmap">{days.map((day) => <div key={day.key} title={`${day.key}: ${day.count} completions`} className={`heat-cell heat-${Math.min(4, day.count)}`} />)}</div><div className="heat-legend"><span>Less</span>{[0,1,2,3,4].map((n) => <i key={n} className={`heat-cell heat-${n}`} />)}<span>More</span></div></div></div>
      <div className="panel"><div className="panel-heading"><div><div className="eyebrow">YOUR ROUTINES</div><h2>Active habits</h2></div><span className="count-pill">{data.habits.length} habits</span></div>
        {data.habits.length ? <div className="habit-list">{data.habits.map((habit) => <div className={`habit-item ${habitIsDone(data, habit) ? 'habit-done' : ''}`} key={habit.id}><button className="habit-check" onClick={() => toggleHabit(habit)} aria-label={`Toggle ${habit.title}`}>{habitIsDone(data, habit) ? <Check size={17} /> : null}</button><div className="habit-copy"><b>{habit.title}</b><small>{data.attributes.find((a) => a.id === habit.attributeId)?.name || 'Attribute'} · {titleCase(habit.schedule)} · {habit.schedule === 'daily' ? `${habitStreak(data, habit.id)} day streak` : 'Weekly cadence'}</small></div><span className="habit-status">{habitIsDone(data, habit) ? 'Completed' : 'Pending'}</span><button className="icon-button subtle-icon" onClick={() => deleteHabit(habit)} aria-label="Delete habit"><Trash2 size={15} /></button></div>)}</div> : <Empty title="Start a habit loop" body="Add a small recurring action that supports one of your attributes." action={<button className="button button-secondary" onClick={() => setHabitModal(true)}><Plus size={14} /> Add first habit</button>} />}
      </div>
    </>
  }

  const renderAttributes = () => <>
    <SectionHeader eyebrow="CHARACTER DEVELOPMENT / ATTRIBUTES" title="Your attributes" description="Every dimension of life grows through deliberate action." action={<button className="button button-primary" onClick={() => openAttribute()}><Plus size={16} /> Custom attribute</button>} />
    <div className="attribute-grid">{data.attributes.map((attribute) => {
      const attrXp = xpForAttribute(data, attribute.id); const attrLevel = levelFromXp(attrXp)
      return <div className="panel attribute-detail-card" key={attribute.id}><div className="attribute-detail-top"><div className="attribute-symbol">{attribute.icon}</div><div className="attribute-actions"><button className="icon-button subtle-icon" onClick={() => openAttribute(attribute)} aria-label="Edit attribute"><Pencil size={14} /></button>{!attribute.core && <button className="icon-button subtle-icon" onClick={() => deleteAttribute(attribute)} aria-label="Delete attribute"><Trash2 size={14} /></button>}</div></div><div className="eyebrow">{attribute.short}</div><h2>{attribute.name}</h2><p>{attribute.description}</p><div className="attribute-level"><strong>Level {attrLevel.level}</strong><span>{fmt(attrXp)} total XP</span></div><Progress value={attrLevel.progress} /><div className="attribute-foot"><span>{Math.round(attrLevel.progress)}% to next level</span><span>{data.xpEvents.filter((e) => e.attributeId === attribute.id).length} activities</span></div></div>
    })}</div>
  </>

  const renderCalendar = () => {
    const current = dateFromKey(selectedDate); const monthStart = new Date(current.getFullYear(), current.getMonth(), 1); const startOffset = (monthStart.getDay() + 6) % 7; const gridStart = new Date(monthStart); gridStart.setDate(1 - startOffset)
    const calendarDays = Array.from({ length: 42 }, (_, index) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + index); const key = localDateKey(d); return { date: d, key, inMonth: d.getMonth() === current.getMonth(), events: data.xpEvents.filter((e) => e.date === key), logs: data.habitLogs.filter((l) => l.date === key) } })
    const selectedEvents = data.xpEvents.filter((e) => e.date === selectedDate)
    const selectedLogs = data.habitLogs.filter((l) => l.date === selectedDate)
    const monthLabel = current.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    return <>
      <SectionHeader eyebrow="TIMELINE / HISTORY" title="Activity calendar" description="Look back at what you have built, one day at a time." action={<div className="section-actions"><button className="button button-secondary" onClick={exportCalendar}><ArrowDownToLine size={15} /> Export .ics</button><button className="button button-secondary" onClick={() => setSelectedDate(today)}><CalendarDays size={15} /> Today</button></div>} />
      <div className="calendar-layout"><section className="panel calendar-panel"><div className="calendar-heading"><button className="icon-button" onClick={() => { const d = new Date(current); d.setMonth(d.getMonth() - 1); setSelectedDate(localDateKey(d)) }}><ChevronLeft size={17} /></button><h2>{monthLabel}</h2><button className="icon-button" onClick={() => { const d = new Date(current); d.setMonth(d.getMonth() + 1); setSelectedDate(localDateKey(d)) }}><ChevronRight size={17} /></button></div><div className="calendar-grid calendar-weekdays">{['MON','TUE','WED','THU','FRI','SAT','SUN'].map((d) => <span key={d}>{d}</span>)}</div><div className="calendar-grid">{calendarDays.map((day) => <button key={day.key} className={`calendar-day ${!day.inMonth ? 'outside' : ''} ${selectedDate === day.key ? 'selected' : ''} ${day.key === today ? 'is-today' : ''}`} onClick={() => setSelectedDate(day.key)}><span>{day.date.getDate()}</span>{day.events.length > 0 && <i />}{day.logs.length > 0 && <i className="habit-dot" />}</button>)}</div><div className="calendar-legend"><span><i /> XP activity</span><span><i className="habit-dot" /> Habit completed</span></div></section>
        <section className="panel date-detail"><div className="eyebrow">DAY DETAILS</div><h2>{dateFromKey(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2><div className="date-summary"><div><strong>+{selectedEvents.reduce((sum, e) => sum + e.xp, 0)}</strong><span>XP earned</span></div><div><strong>{selectedEvents.length}</strong><span>Activities</span></div><div><strong>{selectedLogs.length}</strong><span>Habits</span></div></div><h3>Quest activity</h3>{selectedEvents.length ? <div className="feed-list">{selectedEvents.map((event) => <div className="feed-item" key={event.id}><div className="feed-icon"><Zap size={14} /></div><div className="feed-copy"><b>{event.questTitle}</b><small>{data.attributes.find((a) => a.id === event.attributeId)?.short || 'STAT'}</small></div><strong>+{event.xp}</strong></div>)}</div> : <p className="muted-paragraph">No XP recorded on this day.</p>}<h3>Habit activity</h3>{selectedLogs.length ? selectedLogs.map((log) => <div className="simple-row" key={log.id}><CheckCircle2 size={15} /><span>{data.habits.find((h) => h.id === log.habitId)?.title || 'Habit'}</span></div>) : <p className="muted-paragraph">No habit completions recorded.</p>}</section></div>
      <section className="panel calendar-integration"><div className="calendar-integration-head"><div className="integration-icon"><CalendarDays size={19} /></div><div><div className="eyebrow">CALENDAR INTEGRATION / ICALENDAR</div><h2>Take your progress beyond LIFE RPG</h2><p>Export quest deadlines, completed activities and habit check-ins as a calendar file.</p></div></div><div className="calendar-integration-actions"><button className="button button-primary" onClick={exportCalendar}><ArrowDownToLine size={15} /> Download calendar (.ics)</button><a className="button button-secondary" href="https://calendar.notion.so/" target="_blank" rel="noreferrer">Open Notion Calendar <ChevronRight size={14} /></a></div><div className="integration-guidance"><div><b>Apple Calendar</b><p>Import the downloaded .ics file into Apple Calendar. Choose an iCloud calendar so it can appear on your other Apple devices.</p></div><div><b>Notion Calendar</b><p>Connect the same Apple iCloud account in Notion Calendar under Settings → Calendar accounts → Add calendar account. Apple may require an app-specific password for this connection. Your imported iCloud events can then appear there.</p></div></div><p className="integration-caveat">This is a one-way snapshot export, not live two-way sync. Export again after changing LIFE RPG. Journal entries are never included.</p></section>
    </>
  }

  const achievements = useMemo(() => {
    const eventCount = data.xpEvents.length
    const knowledgeCount = data.xpEvents.filter((e) => e.attributeId === 'knowledge').length
    const vitalityCount = data.xpEvents.filter((e) => e.attributeId === 'vitality').length
    const contributionCount = data.xpEvents.filter((e) => e.attributeId === 'contribution').length
    const maxStreak = Math.max(0, ...data.habits.map((h) => habitStreak(data, h.id)))
    const allLevelTen = data.attributes.filter((a) => a.core).every((a) => levelFromXp(xpForAttribute(data, a.id)).level >= 10)
    return [
      { id: 'first', title: 'First Steps', description: 'Complete your first quest.', unlocked: eventCount >= 1, progress: Math.min(1, eventCount), target: 1 },
      { id: 'level5', title: 'Getting Started', description: 'Reach character Level 5.', unlocked: level.level >= 5, progress: Math.min(5, level.level), target: 5 },
      { id: 'knowledge30', title: 'Dedicated Learner', description: 'Complete 30 Knowledge activities.', unlocked: knowledgeCount >= 30, progress: Math.min(30, knowledgeCount), target: 30 },
      { id: 'streak7', title: 'Iron Discipline', description: 'Build a 7-day habit streak.', unlocked: maxStreak >= 7, progress: Math.min(7, maxStreak), target: 7 },
      { id: 'vitality50', title: 'Warrior', description: 'Complete 50 Vitality activities.', unlocked: vitalityCount >= 50, progress: Math.min(50, vitalityCount), target: 50 },
      { id: 'contribution10', title: 'Community Hero', description: 'Complete 10 Contribution activities.', unlocked: contributionCount >= 10, progress: Math.min(10, contributionCount), target: 10 },
      { id: 'quests100', title: 'Century of Progress', description: 'Complete 100 activities.', unlocked: eventCount >= 100, progress: Math.min(100, eventCount), target: 100 },
      { id: 'master', title: 'Master of All', description: 'Reach Level 10 in every core attribute.', unlocked: allLevelTen, progress: data.attributes.filter((a) => a.core && levelFromXp(xpForAttribute(data, a.id)).level >= 10).length, target: data.attributes.filter((a) => a.core).length },
    ]
  }, [data, level.level])
  const renderAchievements = () => <>
    <SectionHeader eyebrow="MILESTONES / REWARDS" title="Achievements" description="Recognize the effort behind your progress. Every milestone starts somewhere." />
    <div className="achievement-summary"><div className="achievement-emblem"><Trophy size={25} /></div><div><div className="eyebrow">UNLOCKED COLLECTION</div><strong>{achievements.filter((a) => a.unlocked).length} <span>/ {achievements.length}</span></strong><Progress value={achievements.filter((a) => a.unlocked).length / achievements.length * 100} /></div></div>
    <div className="achievement-grid">{achievements.map((achievement, index) => <div className={`panel achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`} key={achievement.id}><div className="achievement-icon">{achievement.unlocked ? <Award size={22} /> : <ShieldCheck size={22} />}</div><div className="achievement-info"><span className="eyebrow">{achievement.unlocked ? 'UNLOCKED' : 'LOCKED'} · {String(index + 1).padStart(2, '0')}</span><h2>{achievement.title}</h2><p>{achievement.description}</p><Progress value={achievement.progress / achievement.target * 100} subtle /><small>{achievement.progress} / {achievement.target} progress</small></div></div>)}</div>
  </>

  const renderAnalytics = () => {
    const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const key = localDateKey(d); return { day: d.toLocaleDateString(undefined, { weekday: 'short' }), xp: data.xpEvents.filter((e) => e.date === key).reduce((sum, e) => sum + e.xp, 0), date: key } })
    const last30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (29 - i)); const key = localDateKey(d); return { day: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), xp: data.xpEvents.filter((e) => e.date === key).reduce((sum, e) => sum + e.xp, 0) } })
    const habitTrend = last7.map((day) => ({ day: day.day, completions: data.habitLogs.filter((log) => log.date === day.date).length }))
    const byAttribute = data.attributes.map((a) => ({ name: a.short, value: xpForAttribute(data, a.id) })).filter((a) => a.value > 0)
    const total = totalXp(data); const avg = data.xpEvents.length ? Math.round(total / Math.max(1, new Set(data.xpEvents.map((e) => e.date)).size)) : 0
    const habitsDone = data.habitLogs.length; const recentWeekStart = localDateKey(weekStart(new Date())); const weeklyLogs = data.habitLogs.filter((l) => l.date >= recentWeekStart).length
    const most = [...byAttribute].sort((a,b) => b.value - a.value)[0]
    return <>
      <SectionHeader eyebrow="PERFORMANCE / ANALYTICS" title="Progress analytics" description="Understand where your effort is going. Every metric comes from your saved activity." />
      <div className="analytics-kpis"><div className="stat-card"><span>TOTAL XP</span><strong>{fmt(total)}</strong><small>Lifetime experience</small></div><div className="stat-card"><span>ACTIVITIES</span><strong>{data.xpEvents.length}</strong><small>Completed quests</small></div><div className="stat-card"><span>AVG. DAILY XP</span><strong>{avg}</strong><small>Across active days</small></div><div className="stat-card"><span>HABIT LOGS</span><strong>{habitsDone}</strong><small>{weeklyLogs} this week</small></div></div>
      <div className="analytics-grid"><section className="panel chart-panel"><div className="panel-heading"><div><div className="eyebrow">LAST 7 DAYS</div><h2>Weekly XP</h2></div><span className="chart-unit">XP</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={last7} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} /><Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--text)' }} /><Bar dataKey="xp" fill="var(--chart)" radius={[5,5,0,0]} /></BarChart></ResponsiveContainer></div></section>
        <section className="panel chart-panel"><div className="panel-heading"><div><div className="eyebrow">ATTRIBUTE DISTRIBUTION</div><h2>Where XP goes</h2></div></div>{byAttribute.length ? <><div className="chart-area pie-area"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={byAttribute} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>{byAttribute.map((entry, index) => <Cell key={entry.name} fill={`hsl(0 0% ${84 - index * 7}%)`} stroke="var(--panel)" />)}</Pie><Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--text)' }} /></PieChart></ResponsiveContainer><div className="pie-total"><strong>{fmt(total)}</strong><span>Total XP</span></div></div><div className="chart-legend">{byAttribute.slice(0, 5).map((a, i) => <span key={a.name}><i style={{ background: `hsl(0 0% ${84 - i * 7}%)` }} />{a.name}<b>{a.value}</b></span>)}</div></> : <Empty title="No XP distribution yet" body="Complete quests to see where your experience is growing." />}</section>
      </div>
      <div className="analytics-grid monthly-analytics"><section className="panel chart-panel"><div className="panel-heading"><div><div className="eyebrow">LAST 30 DAYS</div><h2>Monthly progression</h2></div><span className="chart-unit">XP / DAY</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={last30} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}><defs><linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--chart)" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" /><XAxis dataKey="day" interval={4} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 9 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} /><Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--text)' }} /><Area type="monotone" dataKey="xp" stroke="var(--chart)" strokeWidth={2} fill="url(#xpGradient)" /></AreaChart></ResponsiveContainer></div></section>
        <section className="panel chart-panel"><div className="panel-heading"><div><div className="eyebrow">LAST 7 DAYS</div><h2>Habit completion trend</h2></div></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={habitTrend} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} /><Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--text)' }} /><Bar dataKey="completions" fill="var(--chart)" radius={[5,5,0,0]} /></BarChart></ResponsiveContainer></div></section></div>
      <section className="panel"><div className="panel-heading"><div><div className="eyebrow">ATTRIBUTE LEADERBOARD</div><h2>Strongest attributes</h2></div>{most && <span className="count-pill">Top: {most.name}</span>}</div><div className="analytics-attributes">{[...data.attributes].sort((a,b) => xpForAttribute(data,b.id) - xpForAttribute(data,a.id)).map((a) => { const value = xpForAttribute(data,a.id); return <div className="analytics-attribute" key={a.id}><span>{a.name}</span><Progress value={total ? value / total * 100 : 0} /><b>{fmt(value)} XP</b></div> })}</div></section>
    </>
  }

  const renderJournal = () => <>
    <SectionHeader eyebrow="PRIVATE SPACE / REFLECTION" title="Journal" description="A quiet place to record wins, challenges, lessons and gratitude. Journal writing never awards XP." action={<button className="button button-primary" onClick={openNewJournal}><Plus size={16} /> New entry</button>} />
    <div className="journal-notice"><Heart size={16} /><span>Entries are stored locally in this browser. They are not uploaded to GitHub or synced to other devices.</span></div>
    {data.journal.length ? <div className="journal-grid">{[...data.journal].sort((a,b) => b.date.localeCompare(a.date)).map((entry) => <article className="panel journal-card" key={entry.id}><div className="journal-card-top"><span className="eyebrow">{dateLabel(entry.date, { month: 'long', day: 'numeric', year: 'numeric' })}</span><span className="mood-pill">{entry.mood}</span></div><h2>{entry.wins || 'Daily reflection'}</h2><p>{entry.reflection || entry.lessons || 'No reflection text added.'}</p><div className="journal-tags">{entry.challenges && <span>Challenge noted</span>}{entry.gratitude && <span>Gratitude</span>}{entry.lessons && <span>Lesson learned</span>}</div><div className="journal-actions"><button className="text-button" onClick={() => openEditJournal(entry)}><Pencil size={13} /> Edit</button><button className="text-button danger-text" onClick={() => deleteJournal(entry)}><Trash2 size={13} /> Delete</button></div></article>)}</div> : <div className="panel"><Empty title="Your journal is waiting" body="Capture what went well, what was difficult and what you want to remember." action={<button className="button button-secondary" onClick={openNewJournal}><Plus size={14} /> Write first entry</button>} /></div>}
  </>

  const renderProfile = () => <>
    <SectionHeader eyebrow="IDENTITY / CHARACTER" title="Character profile" description="Your character represents the person you are deliberately becoming." />
    <div className="profile-layout"><section className="panel profile-card"><div className="profile-avatar">{data.profile.avatar || data.profile.name.slice(0,1).toUpperCase() || 'A'}</div><h2>{data.profile.name}</h2><span className="profile-title">{data.profile.title}</span><div className="profile-level">LEVEL {level.level}</div><div className="profile-total"><strong>{fmt(xp)}</strong><span>Lifetime XP</span></div><div className="profile-meta"><span>Joined</span><b>{dateLabel(localDateKey(new Date(data.profile.createdAt)), { month: 'long', year: 'numeric' })}</b></div></section>
      <section className="panel profile-edit"><div className="eyebrow">CHARACTER CUSTOMIZATION</div><h2 className="panel-title">Edit identity</h2><form onSubmit={saveProfile} className="form-stack"><Field label="Character name"><input value={characterName} onChange={(e) => setCharacterName(e.target.value)} maxLength={32} required /></Field><Field label="Character title"><input value={characterTitle} onChange={(e) => setCharacterTitle(e.target.value)} maxLength={40} placeholder="e.g. The Persistent One" /></Field><Field label="Avatar symbol / emoji"><input value={characterAvatar} onChange={(e) => setCharacterAvatar(e.target.value)} maxLength={4} placeholder="✦" /></Field><button className="button button-primary" type="submit">Save profile <Check size={15} /></button></form><div className="divider-line" /><div className="eyebrow">VISUAL THEME</div><div className="theme-options"><button className={data.profile.theme === 'dark' ? 'theme-option active' : 'theme-option'} onClick={() => changeData((c) => ({ ...c, profile: { ...c.profile, theme: 'dark' } }))}><Moon size={17} />Dark</button><button className={data.profile.theme === 'light' ? 'theme-option active' : 'theme-option'} onClick={() => changeData((c) => ({ ...c, profile: { ...c.profile, theme: 'light' } }))}><Sun size={17} />Light</button></div></section></div>
    <section className="panel profile-attributes"><div className="panel-heading"><div><div className="eyebrow">CHARACTER BUILD</div><h2>Attribute summary</h2></div></div><div className="attribute-list">{data.attributes.map((a) => <AttributeRow key={a.id} attribute={a} xp={xpForAttribute(data,a.id)} count={data.xpEvents.filter((e) => e.attributeId === a.id).length} />)}</div></section>
  </>

  const renderSettings = () => <>
    <SectionHeader eyebrow="PREFERENCES / DATA" title="Settings" description="Manage your local progress, backups and application preferences." />
    <div className="settings-grid"><section className="panel settings-card"><div className="settings-icon"><ArrowDownToLine size={18} /></div><div><h2>Export your data</h2><p>Download a JSON backup containing your character, quests, XP history, habits and journal entries.</p><button className="button button-secondary" onClick={exportData}>Download backup <ArrowDownToLine size={15} /></button></div></section>
      <section className="panel settings-card"><div className="settings-icon"><ArrowUpFromLine size={18} /></div><div><h2>Import a backup</h2><p>Restore a previously exported LIFE RPG JSON file. The backup replaces current browser data.</p><input ref={importRef} type="file" accept="application/json,.json" className="hidden-input" onChange={importData} /><button className="button button-secondary" onClick={() => importRef.current?.click()}>Choose backup <ArrowUpFromLine size={15} /></button></div></section>
      <section className="panel settings-card"><div className="settings-icon"><Sparkles size={18} /></div><div><h2>Starter data</h2><p>{data.isSampleData ? 'Example quests, habits and activity are currently included.' : 'No starter sample data is currently active.'}</p><button className="button button-secondary" onClick={removeSample} disabled={!data.isSampleData}>Remove sample data <X size={14} /></button></div></section>
      <section className="panel settings-card"><div className="settings-icon"><RefreshCw size={18} /></div><div><h2>Reset progress</h2><p>Clear all locally stored progress and return to a blank character. This action cannot be undone.</p><button className="button button-danger" onClick={resetAll}>Reset application <Trash2 size={15} /></button></div></section></div>
    <section className="panel storage-note"><div className="settings-icon"><Bookmark size={18} /></div><div><h2>About your data</h2><p>LIFE RPG is a static application. Your data is stored in this browser using localStorage. It does not automatically synchronize between your laptop, phone or other browsers. Export a backup before clearing browser data or changing devices. Your journal and personal records should not be committed to the public GitHub repository.</p><div className="storage-status"><span className="status-dot" /> Local storage active <span>·</span> {fmt(new Blob([JSON.stringify(data)]).size / 1024)} KB estimated</div></div></section>
  </>

  const renderPage = () => {
    switch (page) {
      case 'quests': return renderQuests()
      case 'habits': return renderHabits()
      case 'attributes': return renderAttributes()
      case 'calendar': return renderCalendar()
      case 'achievements': return renderAchievements()
      case 'analytics': return renderAnalytics()
      case 'journal': return renderJournal()
      case 'profile': return renderProfile()
      case 'settings': return renderSettings()
      default: return renderDashboard()
    }
  }

  return <div className={`app-shell theme-${data.profile.theme}`}>
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark">L<span>✦</span></div><div><b>LIFE RPG</b><small>PERSONAL PROGRESSION</small></div><button className="mobile-close icon-button" onClick={() => setMobileNav(false)}><X size={17} /></button></div>
      <div className="sidebar-character"><div className="sidebar-avatar">{data.profile.avatar || data.profile.name.slice(0,1).toUpperCase() || 'A'}</div><div><b>{data.profile.name}</b><small>Level {level.level} · {data.profile.title}</small></div><ChevronDown size={14} /></div>
      <nav className="nav-list">{NAV.map((item, index) => <div key={item.id}>{item.group && <div className="nav-group-label">{item.group}</div>}<button className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); setMobileNav(false); setSearch('') }}><item.icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{item.id === 'quests' && data.quests.filter((q) => !getQuestDone(data,q)).length > 0 && <i className="nav-count">{data.quests.filter((q) => !getQuestDone(data,q)).length}</i>}</button></div>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-xp"><div className="sidebar-xp-top"><span>LEVEL {level.level}</span><b>{Math.round(level.progress)}%</b></div><Progress value={level.progress} /><small>{fmt(xp)} total XP</small></div><div className="sidebar-footer"><span className="online-dot" /> All progress saved locally <span className="version-label">v1.0</span></div></div>
    </aside>
    {mobileNav && <div className="sidebar-scrim" onClick={() => setMobileNav(false)} />}
    <main className="main-area"><header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)}><Menu size={19} /></button><div className="breadcrumb">LIFE RPG <span>/</span> <b>{activePage.toUpperCase()}</b></div></div><div className="topbar-right"><span className="today-label"><CalendarDays size={14} /> {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span><button className="topbar-avatar" onClick={() => setPage('profile')} title="Open profile">{data.profile.avatar || data.profile.name.slice(0,1).toUpperCase() || 'A'}</button></div></header>
      <div className="page-content">{renderPage()}</div><footer className="page-footer"><span>© {new Date().getFullYear()} LIFE RPG</span><span>Every action contributes to your character <b>✦</b></span></footer>
    </main>
    {questModal && <Modal title={editingQuest ? 'Edit quest' : 'Create a quest'} onClose={() => setQuestModal(false)}><form onSubmit={saveQuest} className="modal-form"><Field label="Quest title"><input autoFocus value={questDraft.title} onChange={(e) => setQuestDraft({ ...questDraft, title: e.target.value })} placeholder="e.g. Complete a study session" required maxLength={80} /></Field><Field label="Description"><textarea value={questDraft.description} onChange={(e) => setQuestDraft({ ...questDraft, description: e.target.value })} placeholder="What does completing this quest involve?" rows={3} /></Field><div className="form-row"><Field label="Attribute"><select value={questDraft.attributeId} onChange={(e) => setQuestDraft({ ...questDraft, attributeId: e.target.value })}>{data.attributes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field><Field label="Quest category"><select value={questDraft.category} onChange={(e) => setQuestDraft({ ...questDraft, category: e.target.value as QuestCategory, recurrence: e.target.value === 'Daily' ? 'daily' : e.target.value === 'Weekly' ? 'weekly' : 'none' })}>{CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}</select></Field></div><div className="form-row"><Field label="Difficulty"><select value={questDraft.difficulty} onChange={(e) => { const difficulty = e.target.value as Difficulty; setQuestDraft({ ...questDraft, difficulty, xp: DIFFICULTY_XP[difficulty] }) }}>{DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}</select></Field><Field label="XP reward"><input type="number" min={1} max={10000} value={questDraft.xp} onChange={(e) => setQuestDraft({ ...questDraft, xp: Math.max(1, Number(e.target.value)) })} /></Field></div><div className="form-row"><Field label="Minutes per completion (optional)"><input type="number" min={0} max={1440} value={questDraft.minutesPerCompletion} onChange={(e) => setQuestDraft({ ...questDraft, minutesPerCompletion: Math.max(0, Number(e.target.value)) })} /></Field><Field label="Deadline (optional)"><input type="date" value={questDraft.dueDate} onChange={(e) => setQuestDraft({ ...questDraft, dueDate: e.target.value })} /></Field></div><Field label="Recurrence"><select value={questDraft.recurrence} onChange={(e) => setQuestDraft({ ...questDraft, recurrence: e.target.value as Quest['recurrence'] })}><option value="none">One-time</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></Field><div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => setQuestModal(false)}>Cancel</button><button className="button button-primary" type="submit">{editingQuest ? 'Save changes' : 'Create quest'} <Check size={15} /></button></div></form></Modal>}
    {habitModal && <Modal title="Create a habit" onClose={() => setHabitModal(false)}><form onSubmit={saveHabit} className="modal-form"><Field label="Habit name"><input autoFocus value={habitDraft.title} onChange={(e) => setHabitDraft({ ...habitDraft, title: e.target.value })} placeholder="e.g. Read for 20 minutes" required maxLength={80} /></Field><Field label="Linked attribute"><select value={habitDraft.attributeId} onChange={(e) => setHabitDraft({ ...habitDraft, attributeId: e.target.value })}>{data.attributes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field><Field label="Schedule"><select value={habitDraft.schedule} onChange={(e) => setHabitDraft({ ...habitDraft, schedule: e.target.value as Habit['schedule'] })}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></Field><div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => setHabitModal(false)}>Cancel</button><button className="button button-primary" type="submit">Create habit <Check size={15} /></button></div></form></Modal>}
    {journalModal && <Modal title={editingJournal ? 'Edit journal entry' : 'New journal entry'} onClose={() => setJournalModal(false)} size="large"><form onSubmit={saveJournal} className="modal-form"><div className="form-row"><Field label="Date"><input type="date" value={journalDraft.date} onChange={(e) => setJournalDraft({ ...journalDraft, date: e.target.value })} required /></Field><Field label="Mood"><select value={journalDraft.mood} onChange={(e) => setJournalDraft({ ...journalDraft, mood: e.target.value })}>{['Great','Good','Okay','Low','Stressed','Grateful','Focused'].map((m) => <option key={m}>{m}</option>)}</select></Field></div><Field label="Today's wins"><textarea rows={2} value={journalDraft.wins} onChange={(e) => setJournalDraft({ ...journalDraft, wins: e.target.value })} placeholder="What went well today?" /></Field><Field label="Challenges"><textarea rows={2} value={journalDraft.challenges} onChange={(e) => setJournalDraft({ ...journalDraft, challenges: e.target.value })} placeholder="What felt difficult?" /></Field><Field label="Lessons learned"><textarea rows={2} value={journalDraft.lessons} onChange={(e) => setJournalDraft({ ...journalDraft, lessons: e.target.value })} placeholder="What did you learn?" /></Field><Field label="Gratitude"><textarea rows={2} value={journalDraft.gratitude} onChange={(e) => setJournalDraft({ ...journalDraft, gratitude: e.target.value })} placeholder="What are you grateful for?" /></Field><Field label="Personal reflection"><textarea rows={3} value={journalDraft.reflection} onChange={(e) => setJournalDraft({ ...journalDraft, reflection: e.target.value })} placeholder="Write anything you want to remember..." /></Field><div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => setJournalModal(false)}>Cancel</button><button className="button button-primary" type="submit">Save privately <Check size={15} /></button></div></form></Modal>}
    {attributeModal && <Modal title={editingAttribute ? 'Edit attribute' : 'Add custom attribute'} onClose={() => setAttributeModal(false)}><form onSubmit={saveAttribute} className="modal-form"><Field label="Attribute name"><input autoFocus value={attributeDraft.name} onChange={(e) => setAttributeDraft({ ...attributeDraft, name: e.target.value })} placeholder="e.g. Creativity" required maxLength={32} /></Field><div className="form-row"><Field label="Abbreviation"><input value={attributeDraft.short} onChange={(e) => setAttributeDraft({ ...attributeDraft, short: e.target.value })} placeholder="CRT" required maxLength={8} /></Field><Field label="Symbol / icon"><input value={attributeDraft.icon} onChange={(e) => setAttributeDraft({ ...attributeDraft, icon: e.target.value })} maxLength={4} /></Field></div><Field label="Description"><textarea rows={3} value={attributeDraft.description} onChange={(e) => setAttributeDraft({ ...attributeDraft, description: e.target.value })} placeholder="What does this attribute represent?" /></Field><div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => setAttributeModal(false)}>Cancel</button><button className="button button-primary" type="submit">Save attribute <Check size={15} /></button></div></form></Modal>}
    {toast && <div className="toast"><CheckCircle2 size={16} />{toast}</div>}
  </div>
}

function AttributeRow({ attribute, xp, count }: { attribute: Attribute; xp: number; count: number }) {
  const info = levelFromXp(xp)
  return <div className="attribute-row"><div className="attribute-row-symbol">{attribute.icon}</div><div className="attribute-row-main"><div className="attribute-row-title"><b>{attribute.name}</b><span>LVL {info.level}</span></div><Progress value={info.progress} subtle /><div className="attribute-row-meta"><span>{fmt(xp)} XP</span><small>{count} activities</small></div></div></div>
}
function QuestCompact({ quest, data, complete, edit }: { quest: Quest; data: AppData; complete: (q: Quest) => void; edit: (q: Quest) => void }) {
  const done = getQuestDone(data, quest)
  return <div className={`compact-quest ${done ? 'done' : ''}`}><button className="compact-check" onClick={() => complete(quest)} disabled={done} aria-label="Complete quest">{done ? <Check size={13} /> : null}</button><div className="compact-quest-copy"><b>{quest.title}</b><small>{quest.category} · {quest.xp} XP</small></div><button className="icon-button subtle-icon" onClick={() => edit(quest)} aria-label="Edit quest"><Pencil size={13} /></button></div>
}
function QuestCard({ quest, data, onComplete, onEdit, onDelete }: { quest: Quest; data: AppData; onComplete: (q: Quest) => void; onEdit: (q: Quest) => void; onDelete: (q: Quest) => void }) {
  const done = getQuestDone(data, quest); const attribute = data.attributes.find((a) => a.id === quest.attributeId)
  return <div className={`quest-card ${done ? 'quest-completed' : ''}`}><div className="quest-card-main"><div className="quest-card-icon">{done ? <Check size={16} /> : <Target size={16} />}</div><div className="quest-info"><h3>{quest.title}</h3><p>{quest.description || 'No description provided.'}</p><div className="quest-tags"><span>{attribute?.short || 'STAT'}</span><span>{quest.difficulty}</span>{quest.dueDate && <span>{dateLabel(quest.dueDate)}</span>}{quest.dueDate && quest.dueDate < todayKey() && !done && <span className="overdue-tag">Overdue</span>}{quest.dueDate && quest.dueDate > todayKey() && <span>Upcoming</span>}{quest.recurrence !== 'none' && <span>{quest.recurrence}</span>}</div></div></div><div className="quest-card-footer"><span className="quest-xp">+{quest.xp} XP</span><div className="quest-actions">{!done ? <button className="button button-small button-primary" onClick={() => onComplete(quest)}><Check size={13} /> Complete</button> : <span className="completed-label"><CheckCircle2 size={14} /> Completed</span>}<button className="icon-button subtle-icon" onClick={() => onEdit(quest)} aria-label="Edit"><Pencil size={14} /></button><button className="icon-button subtle-icon" onClick={() => onDelete(quest)} aria-label="Delete"><Trash2 size={14} /></button></div></div></div>
}
