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

/** One movement in a complex, e.g. "Renegade rows × 6 each arm". */
export interface Movement {
  name: string
  reps?: number
  /** True when the reps are done on each arm (so 6 means 6 left + 6 right). */
  eachArm?: boolean
}

/** A user-editable kettlebell routine (A, B, C, D...). */
export interface Complex extends Timestamps {
  name: string
  movements: Movement[]
  format: 'amrap'
  durationMin: number
  targetRounds?: number
  archived: boolean
}

export interface KettlebellSession extends DayEntry {
  complexId: string
  /** Copy of the complex at the time, so history stays accurate if the complex is edited later. */
  complexSnapshot: { name: string; movements: Movement[] }
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

/**
 * A fast. `date` is the day it ended (or, while still fasting, the day it began).
 * `endedAt` is missing while the fast is still going — there's at most one of those.
 */
export interface FastSession extends DayEntry {
  startedAt: string // ISO time
  endedAt?: string // ISO time
  goalHours: number
  notes?: string
}

/** Your usual fasting routine, used for reminders. There is one plan, id "plan". */
export interface FastingPlan extends Timestamps {
  goalHours: number
  /** Usual start time, 24-hour "HH:MM", e.g. "20:00". */
  startTime: string
  /** Days you usually fast, 0 = Sunday … 6 = Saturday. */
  days: number[]
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
  fasts: FastSession[]
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
  /** Hours fasted, for fasts that ended on this day. */
  fastHours: number
}
