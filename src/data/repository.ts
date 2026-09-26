import type { Table } from 'dexie'

import { db } from './db'
import { newId } from './ids'
import type {
  Complex,
  DayEntries,
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

export const moods = dayRepository<MoodEntry>(db.moods)
export const meditations = dayRepository<MeditationSession>(db.meditations)

/** Everything logged on one day ('YYYY-MM-DD'). */
export async function getEntriesForDay(date: string): Promise<DayEntries> {
  const [dayMoods, dayRuns, daySessions, dayMeditations] = await Promise.all([
    moods.listForDay(date),
    runs.listForDay(date),
    kettlebellSessions.listForDay(date),
    meditations.listForDay(date),
  ])
  return {
    date,
    moods: dayMoods,
    runs: dayRuns,
    kettlebellSessions: daySessions,
    meditations: dayMeditations,
  }
}

export function isDayEmpty(day: DayEntries): boolean {
  return !day.moods.length && !day.runs.length && !day.kettlebellSessions.length && !day.meditations.length
}
