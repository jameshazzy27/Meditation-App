import { beforeEach, describe, expect, it } from 'vitest'

import {
  checkBackup,
  complexes,
  deleteSampleData,
  exportBackup,
  fastingPlan,
  fasts,
  importBackup,
  initData,
  kettlebellSessions,
  meditations,
  moods,
  runs,
  type Backup,
} from '@/data'
import { db } from '@/data/db'

async function clearAll() {
  await Promise.all([db.runs, db.complexes, db.kettlebellSessions, db.moods, db.meditations, db.fasts, db.fastingPlans].map((t) => t.clear()))
}

/** A realistic spread of data, including optional fields left out. */
async function fillWithData() {
  const a = await complexes.create({ name: 'A', movements: [{ name: 'Swing', reps: 20 }, { name: 'Goblet squat', reps: 12 }], format: 'amrap', durationMin: 20, targetRounds: 6, archived: false })
  await complexes.create({ name: 'Old', movements: [{ name: 'Halo', reps: 10, eachArm: true }], format: 'amrap', durationMin: 10, archived: true })
  await kettlebellSessions.create({ date: '2026-09-20', complexId: a.id, complexSnapshot: { name: 'A', movements: a.movements }, weightKg: 12, rounds: 6, durationMin: 20, notes: '+ swings' })
  await runs.create({ date: '2026-09-21', runType: 'long', distanceKm: 12.1, durationSec: 3920, notes: 'River' })
  await runs.create({ date: '2026-09-22', runType: 'intervals' })
  await moods.create({ date: '2026-09-22', rating: 4, tags: ['sleep', 'coffee'], notes: 'Good day' })
  const fast = await fasts.start(new Date('2026-09-20T19:30:00Z'), 16)
  await fasts.finish(fast.id, new Date('2026-09-21T11:45:00Z'), 'Easy one')
  await fasts.start(new Date('2026-09-22T20:00:00Z'), 18) // still running
  await fastingPlan.save({ goalHours: 16, startTime: '20:00', days: [1, 2, 3, 4, 5] })
  await meditations.create({ date: '2026-09-22', durationSec: 600, hrSamples: [{ t: 0, bpm: 64 }, { t: 600, bpm: 57 }], avgBpm: 60, minBpm: 57, maxBpm: 64, deviceName: 'Polar H10' })
}

const withoutExportTime = (b: Backup) => ({ ...b, exportedAt: '' })

describe('backup', () => {
  beforeEach(async () => {
    await initData()
    await deleteSampleData()
    await clearAll()
  })

  it('round-trips every table exactly: export → wipe → import', async () => {
    await fillWithData()
    const before = await exportBackup()
    expect(before).toMatchObject({ app: 'aura', schemaVersion: 3 })

    // Simulate saving the file and clearing the browser's data.
    const file = JSON.parse(JSON.stringify(before))
    await db.delete()
    await db.open()
    await clearAll() // a fresh database gets sample data — clear it so we compare only what we imported

    const checked = checkBackup(file)
    expect(checked.ok).toBe(true)
    if (!checked.ok) return
    await importBackup(checked.backup, 'replace')

    const after = await exportBackup()
    const sort = (b: Backup) =>
      Object.fromEntries(Object.entries(b.data).map(([k, v]) => [k, [...v].sort((x, y) => x.id.localeCompare(y.id))]))
    expect(sort(withoutExportTime(after) as Backup)).toEqual(sort(withoutExportTime(before) as Backup))
    expect(after.data.runs).toHaveLength(2)
    expect(after.data.fasts).toHaveLength(2)
    expect(after.data.fastingPlans).toEqual(before.data.fastingPlans)
  })

  it('merge adds new records and keeps whichever copy was edited last', async () => {
    await fillWithData()
    const file = await exportBackup()
    const [mood] = await moods.list()
    const run = (await runs.list()).find((r) => r.runType === 'long')!

    // After the backup: edit a mood (app copy is newer), add a new run.
    await new Promise((r) => setTimeout(r, 5))
    await moods.update(mood.id, { notes: 'edited after backup' })
    const extra = await runs.create({ date: '2026-09-25', runType: 'short' })
    // And make the backup's copy of a run newer than the app's.
    const newerRun = { ...file.data.runs.find((r) => r.id === run.id)!, notes: 'from backup', updatedAt: '2999-01-01T00:00:00.000Z' }
    file.data.runs = file.data.runs.map((r) => (r.id === run.id ? newerRun : r))
    await runs.remove((await runs.list()).find((r) => r.runType === 'intervals')!.id) // deleted since backup

    const checked = checkBackup(JSON.parse(JSON.stringify(file)))
    if (!checked.ok) throw new Error(checked.error)
    const result = await importBackup(checked.backup, 'merge')

    expect((await moods.get(mood.id))?.notes).toBe('edited after backup')
    expect((await runs.get(run.id))?.notes).toBe('from backup')
    expect(await runs.get(extra.id)).toBeDefined()
    expect((await runs.list()).some((r) => r.runType === 'intervals')).toBe(true) // came back from the backup
    expect(result).toEqual({ added: 1, updated: 1 })
  })

  it('replace removes anything not in the backup', async () => {
    await fillWithData()
    const file = await exportBackup()
    const extra = await runs.create({ date: '2026-09-25', runType: 'short' })
    const checked = checkBackup(JSON.parse(JSON.stringify(file)))
    if (!checked.ok) throw new Error(checked.error)
    await importBackup(checked.backup, 'replace')
    expect(await runs.get(extra.id)).toBeUndefined()
  })

  it('explains what is wrong with a bad file', () => {
    const good = { app: 'aura', schemaVersion: 1, exportedAt: '', data: { runs: [], complexes: [], kettlebellSessions: [], moods: [], meditations: [] } }
    const mood = { id: 'm1', date: '2026-09-01', createdAt: '2026-09-01T08:00:00Z', updatedAt: '2026-09-01T08:00:00Z', rating: 4, tags: [] }
    const check = (file: unknown) => {
      const r = checkBackup(file)
      return r.ok ? 'ok' : r.error
    }

    expect(check(good)).toBe('ok')
    expect(check('hello')).toMatch(/isn't an Aura backup/)
    expect(check({ ...good, app: 'other' })).toMatch(/isn't an Aura backup/)
    expect(check({ ...good, schemaVersion: 99 })).toMatch(/newer version/)
    expect(check({ ...good, data: { ...good.data, moods: [{ ...mood, rating: 9 }] } })).toBe('Mood 1: "rating" should be 1 to 5')
    expect(check({ ...good, data: { ...good.data, moods: [{ ...mood, date: '26/09/2026' }] } })).toMatch(/Mood 1: "date"/)
    expect(check({ ...good, data: { ...good.data, moods: [mood, mood] } })).toBe('Mood 2: appears twice')
    expect(check({ ...good, data: { ...good.data, runs: [{ ...mood, runType: 'sprint' }] } })).toMatch(/runType/)
    // A missing table is treated as empty; unknown extra fields are dropped.
    const partial = checkBackup({ app: 'aura', schemaVersion: 1, data: { moods: [{ ...mood, sneaky: true }] } })
    expect(partial.ok && partial.backup.data.moods[0]).toEqual(mood)
    expect(partial.ok && partial.backup.data.runs).toEqual([])
  })
})
