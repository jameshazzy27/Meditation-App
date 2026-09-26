import Dexie, { type Table } from 'dexie'

import { movementFromText } from './movements'
import type { Complex, KettlebellSession, MeditationSession, MoodEntry, Run } from './types'

/**
 * Version of the data model. Goes into export files, and must be bumped
 * (with a Dexie migration below) whenever the shape of the data changes.
 */
export const SCHEMA_VERSION = 2

// The database lives in the browser (IndexedDB). Only files in src/data/ may
// import this — the rest of the app goes through the functions in index.ts.
export const db = new Dexie('aura') as Dexie & {
  runs: Table<Run, string>
  complexes: Table<Complex, string>
  kettlebellSessions: Table<KettlebellSession, string>
  moods: Table<MoodEntry, string>
  meditations: Table<MeditationSession, string>
}

// Listed fields are indexed for fast lookups; every other field is still saved.
const tables = {
  runs: 'id, date',
  complexes: 'id, name',
  kettlebellSessions: 'id, date, complexId',
  moods: 'id, date',
  meditations: 'id, date',
}

// Version history. Each new version keeps the old ones and says how to upgrade.
db.version(1).stores(tables)

// v2: movements became { name, reps, eachArm } instead of plain text.
db.version(2)
  .stores(tables)
  .upgrade(async (tx) => {
    const upgrade = (list: unknown[]) =>
      list.map((m) => (typeof m === 'string' ? movementFromText(m) : m))
    await tx
      .table('complexes')
      .toCollection()
      .modify((c: { movements: unknown[] }) => {
        c.movements = upgrade(c.movements)
      })
    await tx
      .table('kettlebellSessions')
      .toCollection()
      .modify((s: { complexSnapshot: { movements: unknown[] } }) => {
        s.complexSnapshot.movements = upgrade(s.complexSnapshot.movements)
      })
  })
