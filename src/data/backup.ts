import type { Table } from 'dexie'

import { SCHEMA_VERSION, db } from './db'
import { isDateKey } from './dates'
import { movementFromText } from './movements'
import type { Complex, KettlebellSession, MeditationSession, MoodEntry, Movement, Run } from './types'

// Export / import of everything, in the format described in CLAUDE.md:
// { app: 'aura', schemaVersion, exportedAt, data: { runs, complexes, kettlebellSessions, moods, meditations } }

export interface BackupData {
  runs: Run[]
  complexes: Complex[]
  kettlebellSessions: KettlebellSession[]
  moods: MoodEntry[]
  meditations: MeditationSession[]
}

export interface Backup {
  app: 'aura'
  schemaVersion: number
  exportedAt: string
  data: BackupData
}

export type BackupCounts = Record<keyof BackupData, number>
export type ImportMode = 'merge' | 'replace'

const tableNames = ['runs', 'complexes', 'kettlebellSessions', 'moods', 'meditations'] as const

function tables() {
  return {
    runs: db.runs,
    complexes: db.complexes,
    kettlebellSessions: db.kettlebellSessions,
    moods: db.moods,
    meditations: db.meditations,
  }
}

export async function exportBackup(): Promise<Backup> {
  const t = tables()
  const [runs, complexes, kettlebellSessions, moods, meditations] = await Promise.all(
    tableNames.map((name) => t[name].toArray()),
  )
  return {
    app: 'aura',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      runs: runs as Run[],
      complexes: complexes as Complex[],
      kettlebellSessions: kettlebellSessions as KettlebellSession[],
      moods: moods as MoodEntry[],
      meditations: meditations as MeditationSession[],
    },
  }
}

export function countBackup(data: BackupData): BackupCounts {
  return Object.fromEntries(tableNames.map((name) => [name, data[name].length])) as BackupCounts
}

// ---- Checking a file before import ---------------------------------------
// Every record is checked and rebuilt from its known fields only, so a
// damaged or hand-edited file can't put bad data into the app.

class BackupError extends Error {}

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

function fail(where: string, problem: string): never {
  throw new BackupError(`${where}: ${problem}`)
}

function str(o: Obj, key: string, where: string): string {
  const v = o[key]
  if (typeof v !== 'string' || !v) fail(where, `"${key}" is missing`)
  return v
}
function optStr(o: Obj, key: string, where: string): string | undefined {
  const v = o[key]
  if (v === undefined || v === null) return undefined
  if (typeof v !== 'string') fail(where, `"${key}" should be text`)
  return v
}
function num(o: Obj, key: string, where: string): number {
  const v = o[key]
  if (typeof v !== 'number' || !Number.isFinite(v)) fail(where, `"${key}" should be a number`)
  return v
}
function optNum(o: Obj, key: string, where: string): number | undefined {
  return o[key] === undefined || o[key] === null ? undefined : num(o, key, where)
}
function strList(o: Obj, key: string, where: string): string[] {
  const v = o[key]
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) fail(where, `"${key}" should be a list of text`)
  return [...v]
}
/** A list of movements. Version 1 backups stored them as text, which is upgraded here. */
function movementList(o: Obj, key: string, where: string): Movement[] {
  const v = o[key]
  if (!Array.isArray(v)) fail(where, `"${key}" should be a list`)
  return v.map((m, i) => {
    if (typeof m === 'string') return movementFromText(m)
    const at = `${where}, movement ${i + 1}`
    if (!isObj(m)) fail(at, 'is damaged')
    if (m.eachArm !== undefined && typeof m.eachArm !== 'boolean') fail(at, '"eachArm" should be true or false')
    return tidy({ name: str(m, 'name', at), reps: optNum(m, 'reps', at), eachArm: m.eachArm === true ? true : undefined })
  })
}
function timestamp(o: Obj, key: string, where: string): string {
  const v = str(o, key, where)
  if (Number.isNaN(Date.parse(v))) fail(where, `"${key}" isn't a valid date and time`)
  return v
}
function day(o: Obj, where: string): string {
  const v = str(o, 'date', where)
  if (!isDateKey(v)) fail(where, `"date" should look like 2026-09-26`)
  return v
}
/** Drops fields that are undefined, so records match what the app itself saves. */
function tidy<T extends object>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, v]) => v !== undefined)) as T
}
function base(o: Obj, where: string) {
  return { id: str(o, 'id', where), createdAt: timestamp(o, 'createdAt', where), updatedAt: timestamp(o, 'updatedAt', where) }
}

const checkers: { [K in keyof BackupData]: (o: Obj, where: string) => BackupData[K][number] } = {
  runs: (o, where) => {
    const runType = o.runType
    if (runType !== 'intervals' && runType !== 'short' && runType !== 'long')
      fail(where, '"runType" should be intervals, short or long')
    return tidy({
      ...base(o, where),
      date: day(o, where),
      runType,
      distanceKm: optNum(o, 'distanceKm', where),
      durationSec: optNum(o, 'durationSec', where),
      notes: optStr(o, 'notes', where),
    })
  },
  complexes: (o, where) => {
    if (o.format !== 'amrap') fail(where, '"format" should be amrap')
    if (typeof o.archived !== 'boolean') fail(where, '"archived" should be true or false')
    return tidy({
      ...base(o, where),
      name: str(o, 'name', where),
      movements: movementList(o, 'movements', where),
      format: 'amrap' as const,
      durationMin: num(o, 'durationMin', where),
      targetRounds: optNum(o, 'targetRounds', where),
      archived: o.archived,
    })
  },
  kettlebellSessions: (o, where) => {
    const snap = o.complexSnapshot
    if (!isObj(snap)) fail(where, '"complexSnapshot" is missing')
    return tidy({
      ...base(o, where),
      date: day(o, where),
      complexId: str(o, 'complexId', where),
      complexSnapshot: { name: str(snap, 'name', where), movements: movementList(snap, 'movements', where) },
      weightKg: optNum(o, 'weightKg', where),
      rounds: optNum(o, 'rounds', where),
      durationMin: optNum(o, 'durationMin', where),
      notes: optStr(o, 'notes', where),
    })
  },
  moods: (o, where) => {
    const rating = o.rating
    if (rating !== 1 && rating !== 2 && rating !== 3 && rating !== 4 && rating !== 5)
      fail(where, '"rating" should be 1 to 5')
    return tidy({
      ...base(o, where),
      date: day(o, where),
      rating,
      tags: strList(o, 'tags', where),
      notes: optStr(o, 'notes', where),
    })
  },
  meditations: (o, where) => {
    const samples = o.hrSamples
    if (!Array.isArray(samples)) fail(where, '"hrSamples" should be a list')
    return tidy({
      ...base(o, where),
      date: day(o, where),
      durationSec: num(o, 'durationSec', where),
      hrSamples: samples.map((s, i) => {
        if (!isObj(s)) fail(where, `heart-rate sample ${i + 1} is damaged`)
        return { t: num(s, 't', where), bpm: num(s, 'bpm', where) }
      }),
      avgBpm: optNum(o, 'avgBpm', where),
      minBpm: optNum(o, 'minBpm', where),
      maxBpm: optNum(o, 'maxBpm', where),
      deviceName: optStr(o, 'deviceName', where),
      notes: optStr(o, 'notes', where),
    })
  },
}

const labels: Record<keyof BackupData, string> = {
  runs: 'Run',
  complexes: 'Complex',
  kettlebellSessions: 'Kettlebell session',
  moods: 'Mood',
  meditations: 'Meditation',
}

/**
 * Checks a parsed backup file. Returns the cleaned backup, or a plain-English
 * reason it can't be imported.
 */
export function checkBackup(file: unknown): { ok: true; backup: Backup } | { ok: false; error: string } {
  try {
    if (!isObj(file) || file.app !== 'aura') throw new BackupError("This isn't an Aura backup file.")
    const version = file.schemaVersion
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 1)
      throw new BackupError('The backup file is damaged (no version number).')
    if (version > SCHEMA_VERSION)
      throw new BackupError('This backup was made by a newer version of Aura. Update the app, then try again.')
    // Older versions are upgraded as each record is checked (v1 → v2: text movements → { name, reps, eachArm }).
    if (!isObj(file.data)) throw new BackupError('The backup file is damaged (no data).')

    const data = {} as BackupData
    for (const name of tableNames) {
      const list = file.data[name] ?? []
      if (!Array.isArray(list)) throw new BackupError(`The backup file is damaged ("${name}" isn't a list).`)
      const seen = new Set<string>()
      data[name] = list.map((record, i) => {
        const where = `${labels[name]} ${i + 1}`
        if (!isObj(record)) fail(where, 'is damaged')
        const clean = checkers[name](record, where)
        if (seen.has(clean.id)) fail(where, 'appears twice')
        seen.add(clean.id)
        return clean
      }) as never
    }
    const exportedAt = typeof file.exportedAt === 'string' ? file.exportedAt : ''
    return { ok: true, backup: { app: 'aura', schemaVersion: SCHEMA_VERSION, exportedAt, data } }
  } catch (error) {
    if (error instanceof BackupError) return { ok: false, error: error.message }
    throw error
  }
}

/**
 * Brings a checked backup into the app, all or nothing.
 * - replace: everything currently in the app is removed first.
 * - merge: new records are added; where both have the same record, the one
 *   edited most recently wins.
 */
export async function importBackup(backup: Backup, mode: ImportMode): Promise<{ added: number; updated: number }> {
  const t = tables()
  let added = 0
  let updated = 0
  await db.transaction('rw', Object.values(t), async () => {
    for (const name of tableNames) {
      type Stored = { id: string; updatedAt: string }
      const table = t[name] as unknown as Table<Stored, string>
      const incoming = backup.data[name] as Stored[]
      if (mode === 'replace') {
        await table.clear()
        await table.bulkAdd(incoming)
        added += incoming.length
        continue
      }
      const existing = await table.bulkGet(incoming.map((r) => r.id))
      const toWrite = incoming.filter((record, i) => {
        const current = existing[i]
        if (!current) added += 1
        else if (record.updatedAt > current.updatedAt) updated += 1
        else return false
        return true
      })
      await table.bulkPut(toWrite)
    }
  })
  return { added, updated }
}

/** A file name like aura-backup-2026-09-26.json */
export function backupFileName(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `aura-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`
}
