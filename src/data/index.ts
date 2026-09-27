// The one front door to Aura's data. Screens and components import from
// '@/data' only — never from Dexie — so the storage can be swapped later
// (e.g. to Supabase) by changing just this folder.
import './sampleData' // registers first-run sample data before the database opens

import { db } from './db'

export { SCHEMA_VERSION } from './db'
export {
  complexes,
  fastingPlan,
  fasts,
  getDaySummaries,
  getEntriesForDay,
  hasAnyEntries,
  isDayEmpty,
  kettlebellSessions,
  meditations,
  moods,
  normaliseTag,
  runs,
} from './repository'
export { deleteSampleData, hasSampleData } from './sampleData'
export {
  backupFileName,
  checkBackup,
  countBackup,
  exportBackup,
  importBackup,
  type Backup,
  type BackupCounts,
  type ImportMode,
} from './backup'
export { useLiveData } from './hooks'
export { movementFromText } from './movements'
export { addDays, fromDateKey, isDateKey, toDateKey, todayKey } from './dates'
export type * from './types'

/**
 * Opens the database and asks the browser to keep it permanently, so it isn't
 * cleared to free up space. Safe to call once at start-up.
 */
export async function initData(): Promise<void> {
  await db.open()
  try {
    await navigator.storage?.persist?.()
  } catch {
    // Not supported everywhere; data is still saved, just not guaranteed against clean-up.
  }
}
