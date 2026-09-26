// Aura's data model — mirrors the "Data model" section of CLAUDE.md.
// If you change anything here, bump SCHEMA_VERSION in db.ts and add a migration.

export type RunType = 'intervals' | 'short' | 'long'
export type MoodRating = 1 | 2 | 3 | 4 | 5

interface Timestamps {
  id: string
  createdAt: string
  updatedAt: string
}

/** Every journal entry belongs to a day (YYYY-MM-DD). */
interface DayEntry extends Timestamps {
  date: string
}

export interface Run extends DayEntry {
  runType: RunType
  distanceKm?: number
  durationSec?: number
  // pace is calculated from distance + duration, not stored
  notes?: string
}

/** A user-editable kettlebell routine (A, B, C, D...). */
export interface Complex extends Timestamps {
  name: string
  movements: string[]
  format: 'amrap'
  durationMin: number
  targetRounds?: number
  archived: boolean
}

export interface KettlebellSession extends DayEntry {
  complexId: string
  /** Copy of the complex at the time, so history stays accurate if the complex is edited later. */
  complexSnapshot: { name: string; movements: string[] }
  weightKg?: number
  rounds?: number
  durationMin?: number
  notes?: string
}

export interface MoodEntry extends DayEntry {
  rating: MoodRating
  tags: string[]
  notes?: string
}

export interface MeditationSession extends DayEntry {
  durationSec: number
  hrSamples: { t: number; bpm: number }[] // t = seconds since start
  avgBpm?: number
  minBpm?: number
  maxBpm?: number
  deviceName?: string
  notes?: string
}

/** What you pass in when creating a record — id and timestamps are filled in for you. */
export type NewRecord<T extends Timestamps> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
/** What you can change on an existing record. */
export type RecordChanges<T extends Timestamps> = Partial<NewRecord<T>>

/** Everything logged on one day, each list oldest first. */
export interface DayEntries {
  date: string
  moods: MoodEntry[]
  runs: Run[]
  kettlebellSessions: KettlebellSession[]
  meditations: MeditationSession[]
}

/** A compact overview of one day, for the History list and calendar. */
export interface DaySummary {
  date: string
  /** Mood ratings logged that day, in order. */
  moodRatings: MoodRating[]
  runCount: number
  runKm: number
  kettlebell: { name: string; rounds?: number }[]
  meditationSec: number
}
