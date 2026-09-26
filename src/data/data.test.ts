import { beforeEach, describe, expect, it } from 'vitest'

import {
  addDays,
  complexes,
  deleteSampleData,
  getEntriesForDay,
  hasSampleData,
  initData,
  isDateKey,
  kettlebellSessions,
  meditations,
  moods,
  runs,
  toDateKey,
  todayKey,
} from '@/data'

describe('sample data', () => {
  it('is added on first run and can be removed without touching real entries', async () => {
    await initData()
    expect(await hasSampleData()).toBe(true)
    const today = await getEntriesForDay(todayKey())
    expect(today.moods.length + today.runs.length + today.meditations.length).toBeGreaterThan(0)

    const mine = await moods.create({ date: todayKey(), rating: 2, tags: [] })
    await deleteSampleData()

    expect(await hasSampleData()).toBe(false)
    expect(await moods.list()).toEqual([mine])
    expect(await runs.list()).toEqual([])
    expect(await complexes.list()).toEqual([])
    await moods.remove(mine.id)
  })
})

describe('records', () => {
  beforeEach(async () => {
    await deleteSampleData()
  })

  it('create fills in id and timestamps', async () => {
    const run = await runs.create({ date: '2026-09-01', runType: 'long', distanceKm: 10, durationSec: 3000 })
    expect(run.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(run.createdAt).toBe(run.updatedAt)
    expect(await runs.get(run.id)).toEqual(run)
    await runs.remove(run.id)
  })

  it('update changes fields and updatedAt but never id or createdAt', async () => {
    const mood = await moods.create({ date: '2026-09-01', rating: 3, tags: ['work'] })
    await new Promise((r) => setTimeout(r, 5))
    const updated = await moods.update(mood.id, { rating: 5, notes: 'Better', id: 'x', createdAt: 'y' } as never)
    expect(updated).toMatchObject({ id: mood.id, createdAt: mood.createdAt, rating: 5, notes: 'Better', tags: ['work'] })
    expect(updated.updatedAt > mood.updatedAt).toBe(true)
    expect(await moods.get(mood.id)).toEqual(updated)
    await moods.remove(mood.id)
  })

  it('update of a missing record fails clearly', async () => {
    await expect(runs.update('nope', { notes: 'x' })).rejects.toThrow('No record')
  })

  it('remove deletes the record', async () => {
    const c = await complexes.create({ name: 'A', movements: ['Swing'], format: 'amrap', durationMin: 20, archived: false })
    await complexes.remove(c.id)
    expect(await complexes.get(c.id)).toBeUndefined()
  })

  it('getEntriesForDay returns only that day, oldest first', async () => {
    const day = '2026-09-10'
    const c = await complexes.create({ name: 'A', movements: ['Swing'], format: 'amrap', durationMin: 20, archived: false })
    const first = await moods.create({ date: day, rating: 2, tags: [] })
    await new Promise((r) => setTimeout(r, 5))
    const second = await moods.create({ date: day, rating: 4, tags: [] })
    await moods.create({ date: addDays(day, 1), rating: 5, tags: [] })
    await runs.create({ date: day, runType: 'intervals' })
    await kettlebellSessions.create({ date: day, complexId: c.id, complexSnapshot: { name: 'A', movements: ['Swing'] } })
    await meditations.create({ date: day, durationSec: 600, hrSamples: [] })

    const entries = await getEntriesForDay(day)
    expect(entries.date).toBe(day)
    expect(entries.moods.map((m) => m.id)).toEqual([first.id, second.id])
    expect(entries.runs).toHaveLength(1)
    expect(entries.kettlebellSessions).toHaveLength(1)
    expect(entries.meditations).toHaveLength(1)
    expect((await getEntriesForDay('2000-01-01')).moods).toEqual([])
  })
})

describe('dates', () => {
  it('uses local calendar days', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(isDateKey('2026-02-30')).toBe(false)
    expect(isDateKey('2026-02-28')).toBe(true)
  })
})
