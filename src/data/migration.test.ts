import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'

import { checkBackup, complexes, kettlebellSessions, movementFromText } from '@/data'
import { db } from '@/data/db'

describe('movementFromText (version 1 → 2)', () => {
  it('splits old text movements into name, reps and each arm', () => {
    expect(movementFromText('Kettlebell swings × 20')).toEqual({ name: 'Kettlebell swings', reps: 20 })
    expect(movementFromText('Single-arm clean & press × 8 per side')).toEqual({ name: 'Single-arm clean & press', reps: 8, eachArm: true })
    expect(movementFromText('Renegade rows x 6 each arm')).toEqual({ name: 'Renegade rows', reps: 6, eachArm: true })
    expect(movementFromText(' Halos ')).toEqual({ name: 'Halos' })
    expect(movementFromText('20 swings')).toEqual({ name: '20 swings' })
  })
})

describe('database upgrade', () => {
  it('converts complexes and session snapshots saved by version 1', async () => {
    db.close()
    await Dexie.delete('aura')
    // Save data the way version 1 of the app did.
    const old = new Dexie('aura')
    old.version(1).stores({ runs: 'id, date', complexes: 'id, name', kettlebellSessions: 'id, date, complexId', moods: 'id, date', meditations: 'id, date' })
    const stamp = { createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z' }
    await old.table('complexes').add({ id: 'c1', name: 'A', movements: ['Kettlebell swings × 20', 'Renegade rows × 6 per side', 'Halos'], format: 'amrap', durationMin: 20, archived: false, ...stamp })
    await old.table('kettlebellSessions').add({ id: 's1', date: '2026-09-01', complexId: 'c1', complexSnapshot: { name: 'A', movements: ['Kettlebell swings × 20'] }, rounds: 6, ...stamp })
    old.close()

    await db.open()
    expect((await complexes.get('c1'))?.movements).toEqual([
      { name: 'Kettlebell swings', reps: 20 },
      { name: 'Renegade rows', reps: 6, eachArm: true },
      { name: 'Halos' },
    ])
    expect((await kettlebellSessions.get('s1'))?.complexSnapshot.movements).toEqual([{ name: 'Kettlebell swings', reps: 20 }])
  })

  it('upgrades version 1 backup files on import', () => {
    const stamp = { createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z' }
    const result = checkBackup({
      app: 'aura',
      schemaVersion: 1,
      exportedAt: '',
      data: { complexes: [{ id: 'c1', name: 'A', movements: ['Goblet squats × 12'], format: 'amrap', durationMin: 20, archived: false, ...stamp }] },
    })
    expect(result.ok && result.backup.data.complexes[0].movements).toEqual([{ name: 'Goblet squats', reps: 12 }])
    expect(result.ok && result.backup.schemaVersion).toBe(2)
  })
})
