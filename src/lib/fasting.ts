import type { FastingPlan } from '@/data'

// What's going on in the body at each point of a fast.
//
// Written to match the research, not the hype: timings are typical, vary from
// person to person (last meal, activity, metabolism) and are approximate.
// Not medical advice — anyone with diabetes, on medication, pregnant, or with a
// history of eating disorders should talk to a doctor before fasting.

export interface FastingStage {
  /** Hours into the fast when this stage typically begins. */
  fromHours: number
  name: string
  summary: string
  detail: string
  /** How solid the evidence is for this stage's description and timing. */
  evidence: 'Well established' | 'Good evidence' | 'Timing varies' | 'Mostly animal studies'
  sources: string[]
}

export const SOURCES = {
  cahill: 'Cahill GF. Fuel metabolism in starvation. Annual Review of Nutrition, 2006.',
  rothman:
    'Rothman DL et al. Quantitation of hepatic glycogenolysis and gluconeogenesis in fasting humans with 13C NMR. Science, 1991.',
  anton: 'Anton SD et al. Flipping the metabolic switch: understanding and applying the health benefits of fasting. Obesity, 2018.',
  ho: 'Ho KY et al. Fasting enhances growth hormone secretion and amplifies the complex rhythms of growth hormone secretion in man. Journal of Clinical Investigation, 1988.',
  deCabo: 'de Cabo R, Mattson MP. Effects of intermittent fasting on health, aging, and disease. New England Journal of Medicine, 2019.',
} as const

export const STAGES: FastingStage[] = [
  {
    fromHours: 0,
    name: 'Fed state',
    summary: 'Digesting your last meal',
    detail:
      'Your body is absorbing your last meal. Blood sugar and insulin are raised, food is the main fuel, and spare glucose is stored in the liver and muscles as glycogen.',
    evidence: 'Well established',
    sources: [SOURCES.cahill],
  },
  {
    fromHours: 4,
    name: 'Early fasting',
    summary: 'Running on stored glycogen',
    detail:
      'Insulin drops back to its resting level. Your liver releases stored glycogen to keep blood sugar steady, and fat stores start releasing more fatty acids for fuel.',
    evidence: 'Well established',
    sources: [SOURCES.cahill, SOURCES.rothman],
  },
  {
    fromHours: 12,
    name: 'Metabolic switch',
    summary: 'Shifting towards burning fat',
    detail:
      'With liver glycogen running lower, your body leans more on fat, and the liver begins turning fatty acids into ketones. Research places this "metabolic switch" somewhere around 12–36 hours after eating, depending on your last meal and how active you are.',
    evidence: 'Timing varies',
    sources: [SOURCES.anton, SOURCES.deCabo],
  },
  {
    fromHours: 18,
    name: 'Ketones rising',
    summary: 'Fat is a main fuel',
    detail:
      'Fat is now a major fuel and ketone levels are climbing, though still modest. Blood sugar stays steady, supplied by the liver.',
    evidence: 'Good evidence',
    sources: [SOURCES.anton, SOURCES.cahill],
  },
  {
    fromHours: 24,
    name: 'Glycogen low',
    summary: 'Making new glucose',
    detail:
      'Liver glycogen is largely used up, so the liver makes most of the glucose you still need from other sources (gluconeogenesis). Ketones are clearly raised, and growth hormone rises, which helps preserve muscle.',
    evidence: 'Good evidence',
    sources: [SOURCES.rothman, SOURCES.ho, SOURCES.cahill],
  },
  {
    fromHours: 48,
    name: 'Deep ketosis',
    summary: 'Ketones fuel much of the body',
    detail:
      'Ketones are now a major fuel, including for the brain, and growth hormone stays raised. Autophagy (cells recycling their worn parts) increases with fasting in animal studies, but in people its timing isn’t well established.',
    evidence: 'Mostly animal studies',
    sources: [SOURCES.cahill, SOURCES.ho, SOURCES.deCabo],
  },
  {
    fromHours: 72,
    name: 'Prolonged fast',
    summary: 'Fully adapted to fasting',
    detail:
      'Your body is well adapted to running on fat and ketones. Fasts this long carry real risks — they’re best done with medical advice.',
    evidence: 'Good evidence',
    sources: [SOURCES.cahill],
  },
]

export const GOAL_PRESETS = [12, 14, 16, 18, 20, 24, 36, 48]
export const DEFAULT_GOAL = 16

const HOUR = 3600 * 1000

export function hoursBetween(start: Date | string, end: Date | string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / HOUR
}

export function stageAt(hours: number): FastingStage {
  return [...STAGES].reverse().find((s) => hours >= s.fromHours) ?? STAGES[0]
}

export function nextStage(hours: number): FastingStage | undefined {
  return STAGES.find((s) => s.fromHours > hours)
}

/** The moment a given number of hours into a fast is reached. */
export function timeAt(startedAt: Date | string, hours: number): Date {
  return new Date(new Date(startedAt).getTime() + hours * HOUR)
}

/** "16 h 20 m", "45 m", "2 d 3 h" */
export function formatFastDuration(hours: number): string {
  const totalMin = Math.max(0, Math.floor(hours * 60))
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  if (d > 0) return `${d} d ${h} h`
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} m`
  return `${m} m`
}

/** "14:05:09" — a running clock of hours:minutes:seconds. */
export function formatFastClock(hours: number): string {
  const totalSec = Math.max(0, Math.floor(hours * 3600))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * The points in a fast worth an alert: each new stage (after the first) and
 * the goal, sorted by time, with duplicates merged.
 */
export function milestones(goalHours: number): { hours: number; title: string; body: string }[] {
  const list = STAGES.filter((s) => s.fromHours > 0).map((s) => ({
    hours: s.fromHours,
    title: `${s.fromHours} h — ${s.name}`,
    body: s.summary + '.',
  }))
  const atGoal = list.find((m) => m.hours === goalHours)
  const goal = { hours: goalHours, title: `Goal reached: ${formatFastDuration(goalHours)} 🎯`, body: 'Skål! You can break your fast whenever you’re ready.' }
  if (atGoal) Object.assign(atGoal, { title: goal.title, body: `${goal.body} ${atGoal.body}` })
  else list.push(goal)
  return list.sort((a, b) => a.hours - b.hours)
}

// ---- Calendar reminders (.ics) --------------------------------------------
// A calendar file your phone's Calendar can import. Calendar then alerts you on
// time even when Aura is closed — web apps can't do that on their own.

const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function icsLocal(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}T${p(date.getHours())}${p(date.getMinutes())}00`
}

function icsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function icsText(text: string): string {
  return text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
}

function icsEvent(opts: { uid: string; start: Date; title: string; description: string; rrule?: string; now: Date }): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:${opts.uid}`,
    `DTSTAMP:${icsUtc(opts.now)}`,
    `DTSTART:${icsLocal(opts.start)}`, // "floating" local time: rings at this clock time wherever you are
    `DTEND:${icsLocal(new Date(opts.start.getTime() + 15 * 60 * 1000))}`,
    ...(opts.rrule ? [`RRULE:${opts.rrule}`] : []),
    `SUMMARY:${icsText(opts.title)}`,
    `DESCRIPTION:${icsText(opts.description)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(opts.title)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
  ]
}

function icsCalendar(events: string[][]): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aura//Fasting//EN',
    'CALSCALE:GREGORIAN',
    ...events.flat(),
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

/** One reminder, at the moment the current fast reaches its goal. */
export function goalReminderIcs(fast: { id: string; startedAt: string; goalHours: number }, now = new Date()): string {
  return icsCalendar([
    icsEvent({
      uid: `aura-fast-${fast.id}@aura`,
      start: timeAt(fast.startedAt, fast.goalHours),
      title: `Fast goal reached: ${formatFastDuration(fast.goalHours)}`,
      description: 'Skål! Your fasting goal is reached. Open Aura to end and record your fast.',
      now,
    }),
  ])
}

/**
 * Two repeating reminders for your plan: when to start fasting, and when you
 * reach your goal (the next day, if the fast runs past midnight).
 */
export function planRemindersIcs(plan: Pick<FastingPlan, 'startTime' | 'goalHours' | 'days'>, now = new Date()): string {
  const [hh, mm] = plan.startTime.split(':').map(Number)
  // First start: the next planned day at the usual time.
  const first = new Date(now)
  first.setHours(hh, mm, 0, 0)
  for (let i = 0; i < 8 && (first <= now || !plan.days.includes(first.getDay())); i++) first.setDate(first.getDate() + 1)
  const goal = timeAt(first, plan.goalHours)
  const shift = Math.round((new Date(goal).setHours(0, 0, 0, 0) - new Date(first).setHours(0, 0, 0, 0)) / 86400000)
  const days = (offset: number) =>
    plan.days
      .map((d) => WEEKDAY_CODES[(d + offset) % 7])
      .join(',')
  return icsCalendar([
    icsEvent({
      uid: 'aura-plan-start@aura',
      start: first,
      title: 'Start your fast',
      description: `Your fasting plan: ${formatFastDuration(plan.goalHours)} from ${plan.startTime}. Open Aura and tap Start fast.`,
      rrule: `FREQ=WEEKLY;BYDAY=${days(0)}`,
      now,
    }),
    icsEvent({
      uid: 'aura-plan-goal@aura',
      start: goal,
      title: `Fasting goal: ${formatFastDuration(plan.goalHours)}`,
      description: 'Skål! Your planned fast is complete. Open Aura to end and record it.',
      rrule: `FREQ=WEEKLY;BYDAY=${days(shift)}`,
      now,
    }),
  ])
}
