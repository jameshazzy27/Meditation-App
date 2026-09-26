import Dexie, { type Table } from 'dexie'

import type { Complex, KettlebellSession, MeditationSession, MoodEntry, Run } from './types'

/**
 * Version of the data model. Goes into export files, and must be bumped
 * (with a Dexie migration below) whenever the shape of the data changes.
 */
export const SCHEMA_VERSION = 1

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
db.version(SCHEMA_VERSION).stores({
  runs: 'id, date',
  complexes: 'id, name',
  kettlebellSessions: 'id, date, complexId',
  moods: 'id, date',
  meditations: 'id, date',
})
