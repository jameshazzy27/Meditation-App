import type { Table } from 'dexie'

import { toDateKey } from './dates'
import { db } from './db'
import { newId } from './ids'
import type {
  Complex,
  DayEntries,
  DaySummary,
  FastingPlan,
  FastSession,
  KettlebellSession,
  MeditationSession,
  MoodEntry,
  NewRecord,
  RecordChanges,
  Run,
} from './types'

type StoredRecord = { id: string; createdAt: string; updatedAt: string }

const byCreatedAt = (a: StoredRecord, b: StoredRecord) => a.createdAt.localeCompare(b.createdAt)
const newestFirst = (a: StoredRecord & { date: string }, b: StoredRecord & { date: string }) =>
  b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)

/** Create / read / update / delete for one kind of record. */
function repository<T extends StoredRecord>(table: Table<T, string>) {
  return {
    async create(input: NewRecord<T>): Promise<T> {
      const now = new Date().toISOString()
      const record = { ...input, id: newId(), createdAt: now, updatedAt: now } as T
      await table.add(record)
      return record
    },

    get(id: string): Promise<T | undefined> {
      return table.get(id)
    },

    async list(): Promise<T[]> {
      return (await table.toArray()).sort(byCreatedAt)
    },

    async update(id: string, changes: RecordChanges<T>): Promise<T> {
      const existing = await table.get(id)
      if (!existing) throw new Error(`No record with id ${id}`)
      // Never let a caller overwrite the id or creation time.
      const { id: _id, createdAt: _createdAt, ...safe } = changes as Partial<T>
      const updated = { ...existing, ...safe, updatedAt: new Date().toISOString() }
      await table.put(updated)
      return updated
    },

    /**
     * Saves an edited record exactly as given — fields you've cleared are
     * removed — keeping its id and creation time.
     */
    async replace(id: string, input: NewRecord<T>): Promise<T> {
      const existing = await table.get(id)
      if (!existing) throw new Error(`No record with id ${id}`)
      const record = { ...input, id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() } as T
      await table.put(record)
      return record
    },

    remove(id: string): Promise<void> {
      return table.delete(id)
    },
  }
}

/** Extra helper for tables whose records belong to a day. */
function dayRepository<T extends StoredRecord & { date: string }>(table: Table<T, string>) {
  return {
    ...repository(table),
    async listForDay(date: string): Promise<T[]> {
      return (await table.where('date').equals(date).toArray()).sort(byCreatedAt)
    },

    /** The most recently dated entry. */
    async latest(): Promise<T | undefined> {
      return (await table.toArray()).sort(newestFirst)[0]
    },
  }
}

// Complexes sort by name the way a person would: A, B, C … and "Complex 2" before "Complex 10".
const byName = (a: Complex, b: Complex) =>
  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })

export const runs = dayRepository<Run>(db.runs)

export const kettlebellSessions = {
  ...dayRepository<KettlebellSession>(db.kettlebellSessions),
  countForComplex(complexId: string): Promise<number> {
    return db.kettlebellSessions.where('complexId').equals(complexId).count()
  },

  /** The most recently dated session — optionally only for one complex. */
  async latest(complexId?: string): Promise<KettlebellSession | undefined> {
    const sessions = complexId
      ? await db.kettlebellSessions.where('complexId').equals(complexId).toArray()
      : await db.kettlebellSessions.toArray()
    return sessions.sort(newestFirst)[0]
  },
}

const complexRepository = repository<Complex>(db.complexes)
export const complexes = {
  ...complexRepository,

  /** Complexes shown when logging a session, sorted by name. */
  async listActive(): Promise<Complex[]> {
    return (await db.complexes.toArray()).filter((c) => !c.archived).sort(byName)
  },

  /** Hidden complexes, kept so past sessions still make sense. */
  async listArchived(): Promise<Complex[]> {
    return (await db.complexes.toArray()).filter((c) => c.archived).sort(byName)
  },

  archive(id: string): Promise<Complex> {
    return complexRepository.update(id, { archived: true })
  },

  restore(id: string): Promise<Complex> {
    return complexRepository.update(id, { archived: false })
  },

  /**
   * Deletes a complex only if no session has ever used it — otherwise it must
   * be archived instead, so history is never left pointing at nothing.
   */
  async remove(id: string): Promise<void> {
    const used = await kettlebellSessions.countForComplex(id)
    if (used > 0) throw new Error('This complex has logged sessions — archive it instead.')
    await complexRepository.remove(id)
  },
}

export const moods = {
  ...dayRepository<MoodEntry>(db.moods),

  /** Every tag you've used, most used first (ties alphabetical). */
  async tagsByUse(): Promise<string[]> {
    const counts = new Map<string, number>()
    for (const mood of await db.moods.toArray())
      for (const tag of mood.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag)
  },
}
export const meditations = dayRepository<MeditationSession>(db.meditations)

// Mood tags are stored lower-case and trimmed, so "Sleep" and "sleep " are the same tag.
export function normaliseTag(tag: string): string {
  return tag.trim().replace(/\s+/g, ' ').toLowerCase()
}

const fastRepository = dayRepository<FastSession>(db.fasts)
export const fasts = {
  ...fastRepository,

  /** The fast you're in right now, if any. */
  async active(): Promise<FastSession | undefined> {
    return (await db.fasts.toArray()).find((f) => !f.endedAt)
  },

  /** Finished fasts, most recent first. */
  async listFinished(): Promise<FastSession[]> {
    return (await db.fasts.toArray())
      .filter((f) => f.endedAt)
      .sort((a, b) => b.endedAt!.localeCompare(a.endedAt!))
  },

  /** Starts a fast (only one can be running). */
  async start(startedAt: Date, goalHours: number): Promise<FastSession> {
    if (await fasts.active()) throw new Error('A fast is already running.')
    return fastRepository.create({ date: toDateKey(startedAt), startedAt: startedAt.toISOString(), goalHours })
  },

  /** Ends a fast; it then belongs to the day it ended. */
  async finish(id: string, endedAt: Date, notes?: string): Promise<FastSession> {
    const fast = await fastRepository.get(id)
    if (!fast) throw new Error(`No fast with id ${id}`)
    const { id: _id, createdAt: _c, updatedAt: _u, notes: _n, ...rest } = fast
    return fastRepository.replace(id, {
      ...rest,
      date: toDateKey(endedAt),
      endedAt: endedAt.toISOString(),
      ...(notes?.trim() && { notes: notes.trim() }),
    })
  },
}

const PLAN_ID = 'plan'
export const fastingPlan = {
  get(): Promise<FastingPlan | undefined> {
    return db.fastingPlans.get(PLAN_ID)
  },
  async save(plan: Omit<FastingPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<FastingPlan> {
    const existing = await db.fastingPlans.get(PLAN_ID)
    const now = new Date().toISOString()
    const record: FastingPlan = { ...plan, id: PLAN_ID, createdAt: existing?.createdAt ?? now, updatedAt: now }
    await db.fastingPlans.put(record)
    return record
  },
}

/** Everything logged on one day ('YYYY-MM-DD'). */
export async function getEntriesForDay(date: string): Promise<DayEntries> {
  const [dayMoods, dayRuns, daySessions, dayMeditations, dayFasts] = await Promise.all([
    moods.listForDay(date),
    runs.listForDay(date),
    kettlebellSessions.listForDay(date),
    meditations.listForDay(date),
    fasts.listForDay(date),
  ])
  return {
    date,
    moods: dayMoods,
    runs: dayRuns,
    kettlebellSessions: daySessions,
    meditations: dayMeditations,
    fasts: dayFasts.filter((f) => f.endedAt),
  }
}

export function isDayEmpty(day: DayEntries): boolean {
  return (
    !day.moods.length && !day.runs.length && !day.kettlebellSessions.length && !day.meditations.length && !day.fasts.length
  )
}

/** One summary per day that has anything logged, newest day first. */
export async function getDaySummaries(): Promise<DaySummary[]> {
  const [allMoods, allRuns, allSessions, allMeditations, allFasts] = await Promise.all([
    db.moods.toArray(),
    db.runs.toArray(),
    db.kettlebellSessions.toArray(),
    db.meditations.toArray(),
    db.fasts.toArray(),
  ])
  const days = new Map<string, DaySummary>()
  const day = (date: string) => {
    let summary = days.get(date)
    if (!summary) {
      summary = { date, moodRatings: [], runCount: 0, runKm: 0, kettlebell: [], meditationSec: 0, fastHours: 0 }
      days.set(date, summary)
    }
    return summary
  }
  for (const mood of allMoods.sort(byCreatedAt)) day(mood.date).moodRatings.push(mood.rating)
  for (const run of allRuns) {
    const summary = day(run.date)
    summary.runCount += 1
    summary.runKm += run.distanceKm ?? 0
  }
  for (const session of allSessions.sort(byCreatedAt))
    day(session.date).kettlebell.push({ name: session.complexSnapshot.name, rounds: session.rounds })
  for (const meditation of allMeditations) day(meditation.date).meditationSec += meditation.durationSec
  for (const fast of allFasts) {
    if (!fast.endedAt) continue
    day(fast.date).fastHours += (Date.parse(fast.endedAt) - Date.parse(fast.startedAt)) / 3600000
  }
  return [...days.values()].sort((a, b) => b.date.localeCompare(a.date))
}

/** True once anything at all has been logged (or a complex added). */
export async function hasAnyEntries(): Promise<boolean> {
  const counts = await Promise.all(
    [db.runs, db.complexes, db.kettlebellSessions, db.moods, db.meditations, db.fasts].map((t) => t.count()),
  )
  return counts.some((n) => n > 0)
}
