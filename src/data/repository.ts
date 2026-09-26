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
  }
}

export const runs = dayRepository<Run>(db.runs)
export const complexes = repository<Complex>(db.complexes)
export const kettlebellSessions = dayRepository<KettlebellSession>(db.kettlebellSessions)
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
