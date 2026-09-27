import { addDays, fromDateKey, type KettlebellSession, type MeditationSession, type MoodEntry, type Run, type RunType } from '@/data'
import { summariseHeartRate } from '@/lib/meditation'

// Pure calculations behind the Trends screen. They take plain lists of entries
// (already loaded through the data layer) so they're easy to test.

export type TimeRange = '4w' | '3m' | 'all'

/** The Monday of the week a day falls in. */
export function weekStart(date: string): string {
  const d = fromDateKey(date)
  return addDays(date, -((d.getDay() + 6) % 7))
}

/**
 * First day shown for a range. Ranges cover whole weeks (Monday to Sunday),
 * including the current one, so weekly bars are never half-empty.
 */
export function rangeStart(range: TimeRange, today: string, earliest?: string): string {
  const thisWeek = weekStart(today)
  if (range === '4w') return addDays(thisWeek, -3 * 7)
  if (range === '3m') return addDays(thisWeek, -12 * 7)
  return weekStart(earliest && earliest < today ? earliest : today)
}

/** Every Monday from `start`'s week up to `today`'s week. */
export function weeksBetween(start: string, today: string): string[] {
  const weeks: string[] = []
  for (let w = weekStart(start); w <= today; w = addDays(w, 7)) weeks.push(w)
  return weeks
}

export function since<T extends { date: string }>(entries: T[], start: string): T[] {
  return entries.filter((e) => e.date >= start)
}

const byDate = <T extends { date: string; createdAt: string }>(a: T, b: T) =>
  a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)

const average = (values: number[]) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : undefined)

// ---- Kettlebell ----------------------------------------------------------

export interface KettlebellPoint {
  date: string
  rounds?: number
  weightKg?: number
}

/** One point per session of a complex, oldest first. */
export function kettlebellPoints(sessions: KettlebellSession[], complexId: string, start: string): KettlebellPoint[] {
  return since(sessions, start)
    .filter((s) => s.complexId === complexId)
    .sort(byDate)
    .map((s) => ({ date: s.date, rounds: s.rounds, weightKg: s.weightKg }))
}

/** How many sessions in a row — most recent first — beat the target (more rounds than it). */
export function sessionsBeatingTarget(sessions: KettlebellSession[], complexId: string, target?: number): number {
  if (target === undefined) return 0
  const recent = sessions
    .filter((s) => s.complexId === complexId && s.rounds !== undefined)
    .sort(byDate)
    .reverse()
  let count = 0
  for (const s of recent) {
    if (s.rounds! > target) count += 1
    else break
  }
  return count
}

/** Beating the target this many sessions running is the nudge to size up the bell. */
export const SIZE_UP_AFTER = 3

// ---- Running --------------------------------------------------------------

export interface RunWeek {
  week: string
  km: number
  runs: number
}

export function weeklyRuns(runs: Run[], weeks: string[]): RunWeek[] {
  const rows = new Map(weeks.map((week) => [week, { week, km: 0, runs: 0 }]))
  for (const run of runs) {
    const row = rows.get(weekStart(run.date))
    if (!row) continue
    row.runs += 1
    row.km += run.distanceKm ?? 0
  }
  return [...rows.values()].map((r) => ({ ...r, km: Math.round(r.km * 10) / 10 }))
}

export type PaceRow = { date: string } & Partial<Record<RunType, number>>

/** Pace (seconds per km) for each run with distance and time, one row per day, a column per run type. */
export function paceByType(runs: Run[], start: string): PaceRow[] {
  const rows = new Map<string, PaceRow>()
  for (const run of since(runs, start).sort(byDate)) {
    if (!run.distanceKm || !run.durationSec) continue
    const row = rows.get(run.date) ?? { date: run.date }
    row[run.runType] = Math.round(run.durationSec / run.distanceKm)
    rows.set(run.date, row)
  }
  return [...rows.values()]
}

// ---- Mood -----------------------------------------------------------------

export function dailyMood(moods: MoodEntry[], start: string): { date: string; mood: number }[] {
  const days = new Map<string, number[]>()
  for (const m of since(moods, start)) days.set(m.date, [...(days.get(m.date) ?? []), m.rating])
  return [...days]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, ratings]) => ({ date, mood: Math.round(average(ratings)! * 10) / 10 }))
}

/**
 * Adds a 7-day average to each day: the mean of that day's mood and any other
 * moods in the 6 days before it. Smooths out day-to-day ups and downs.
 */
export function withWeeklyAverage(days: { date: string; mood: number }[]): { date: string; mood: number; average: number }[] {
  return days.map((day) => {
    const from = addDays(day.date, -6)
    const window = days.filter((d) => d.date >= from && d.date <= day.date).map((d) => d.mood)
    return { ...day, average: Math.round(average(window)! * 100) / 100 }
  })
}

export function topTags(moods: MoodEntry[], start: string, limit = 8): { tag: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const m of since(moods, start)) for (const tag of m.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }))
}

/** Average mood on days with a run or kettlebell session, vs days without. Only days with a mood count. */
export function moodOnWorkoutDays(moods: MoodEntry[], runs: Run[], sessions: KettlebellSession[], start: string) {
  const workoutDays = new Set([...runs, ...sessions].map((e) => e.date))
  const workout: number[] = []
  const rest: number[] = []
  for (const { date, mood } of dailyMood(moods, start)) (workoutDays.has(date) ? workout : rest).push(mood)
  return {
    workout: { average: average(workout), days: workout.length },
    rest: { average: average(rest), days: rest.length },
  }
}

// ---- Overview -------------------------------------------------------------

/** Days logged in a row. The current streak still counts if today isn't logged yet. */
export function streaks(loggedDates: Iterable<string>, today: string): { current: number; best: number } {
  const days = new Set(loggedDates)
  let current = 0
  for (let d = days.has(today) ? today : addDays(today, -1); days.has(d); d = addDays(d, -1)) current += 1
  let best = 0
  for (const d of days) {
    if (days.has(addDays(d, -1))) continue // only count from the start of each run of days
    let length = 0
    for (let x = d; days.has(x); x = addDays(x, 1)) length += 1
    best = Math.max(best, length)
  }
  return { current, best }
}

export interface WeekSummary {
  meditationMin: number
  km: number
  runs: number
  kettlebell: number
  mood?: number
  daysLogged: number
}

export function summariseWeek(
  week: string,
  data: { runs: Run[]; sessions: KettlebellSession[]; moods: MoodEntry[]; meditations: { date: string; durationSec?: number }[] },
): WeekSummary {
  const end = addDays(week, 6)
  const inWeek = <T extends { date: string }>(list: T[]) => list.filter((e) => e.date >= week && e.date <= end)
  const runs = inWeek(data.runs)
  const moods = inWeek(data.moods)
  const logged = new Set([...runs, ...inWeek(data.sessions), ...moods, ...inWeek(data.meditations)].map((e) => e.date))
  const mood = average(moods.map((m) => m.rating))
  return {
    meditationMin: Math.round(inWeek(data.meditations).reduce((s, m) => s + (m.durationSec ?? 0), 0) / 60),
    km: Math.round(runs.reduce((s, r) => s + (r.distanceKm ?? 0), 0) * 10) / 10,
    runs: runs.length,
    kettlebell: inWeek(data.sessions).length,
    mood: mood === undefined ? undefined : Math.round(mood * 10) / 10,
    daysLogged: logged.size,
  }
}

/** "12 Sep" — short dates for chart axes. */
export function shortDate(date: string): string {
  return fromDateKey(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

// ---- Meditation -----------------------------------------------------------

export function weeklyMeditation(sessions: MeditationSession[], weeks: string[]): { week: string; minutes: number; sessions: number }[] {
  const rows = new Map(weeks.map((week) => [week, { week, minutes: 0, sessions: 0 }]))
  for (const s of sessions) {
    const row = rows.get(weekStart(s.date))
    if (!row) continue
    row.sessions += 1
    row.minutes += s.durationSec / 60
  }
  return [...rows.values()].map((r) => ({ ...r, minutes: Math.round(r.minutes) }))
}

/** For each session with heart rate: how much it fell from the first to the last minute. */
export function heartRateDrops(sessions: MeditationSession[], start: string): { date: string; drop: number; avgBpm: number }[] {
  return since(sessions, start)
    .sort(byDate)
    .flatMap((s) => {
      const hr = summariseHeartRate(s.hrSamples)
      return hr && s.hrSamples.length > 1 ? [{ date: s.date, drop: hr.drop, avgBpm: hr.avgBpm }] : []
    })
}
