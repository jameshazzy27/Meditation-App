import { beforeEach, describe, expect, it } from 'vitest'

import {
  addDays,
  complexes,
  deleteSampleData,
  fastingPlan,
  fasts,
  getDaySummaries,
  getEntriesForDay,
  hasSampleData,
  initData,
  isDayEmpty,
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
    const c = await complexes.create({ name: 'A', movements: [{ name: 'Swing' }], format: 'amrap', durationMin: 20, archived: false })
    await complexes.remove(c.id)
    expect(await complexes.get(c.id)).toBeUndefined()
  })

  it('getEntriesForDay returns only that day, oldest first', async () => {
    const day = '2026-09-10'
    const c = await complexes.create({ name: 'A', movements: [{ name: 'Swing' }], format: 'amrap', durationMin: 20, archived: false })
    const first = await moods.create({ date: day, rating: 2, tags: [] })
    await new Promise((r) => setTimeout(r, 5))
    const second = await moods.create({ date: day, rating: 4, tags: [] })
    await moods.create({ date: addDays(day, 1), rating: 5, tags: [] })
    await runs.create({ date: day, runType: 'intervals' })
    await kettlebellSessions.create({ date: day, complexId: c.id, complexSnapshot: { name: 'A', movements: [{ name: 'Swing' }] } })
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

describe('complexes', () => {
  beforeEach(async () => {
    await deleteSampleData()
    for (const c of await complexes.list()) {
      for (const s of await kettlebellSessions.list()) await kettlebellSessions.remove(s.id)
      await complexes.remove(c.id)
    }
  })

  const make = (name: string) =>
    complexes.create({ name, movements: [{ name: 'Swing' }], format: 'amrap', durationMin: 20, archived: false })

  it('lists active complexes by name and archived ones separately', async () => {
    const c = await make('C')
    await make('A')
    await make('Complex 10')
    await make('Complex 2')
    const b = await make('b')
    await complexes.archive(c.id)

    expect((await complexes.listActive()).map((x) => x.name)).toEqual(['A', 'b', 'Complex 2', 'Complex 10'])
    expect((await complexes.listArchived()).map((x) => x.name)).toEqual(['C'])

    await complexes.restore(c.id)
    await complexes.archive(b.id)
    expect((await complexes.listActive()).map((x) => x.name)).toEqual(['A', 'C', 'Complex 2', 'Complex 10'])
  })

  it('can only be deleted if no session uses it', async () => {
    const used = await make('A')
    const unused = await make('B')
    await kettlebellSessions.create({ date: '2026-09-01', complexId: used.id, complexSnapshot: { name: 'A', movements: [{ name: 'Swing' }] } })

    await expect(complexes.remove(used.id)).rejects.toThrow('archive it instead')
    expect(await complexes.get(used.id)).toBeDefined()
    await complexes.remove(unused.id)
    expect(await complexes.get(unused.id)).toBeUndefined()
    expect(await kettlebellSessions.countForComplex(used.id)).toBe(1)
  })
})

describe('kettlebellSessions.latest', () => {
  beforeEach(async () => {
    await deleteSampleData()
    for (const s of await kettlebellSessions.list()) await kettlebellSessions.remove(s.id)
  })

  it('finds the most recently dated session, overall or per complex', async () => {
    const snap = { name: 'A', movements: [{ name: 'Swing' }] }
    expect(await kettlebellSessions.latest()).toBeUndefined()
    await kettlebellSessions.create({ date: '2026-09-03', complexId: 'a', complexSnapshot: snap, weightKg: 12 })
    const newest = await kettlebellSessions.create({ date: '2026-09-05', complexId: 'b', complexSnapshot: snap })
    // Logged later, but for an earlier day — shouldn't count as the latest.
    await kettlebellSessions.create({ date: '2026-09-01', complexId: 'a', complexSnapshot: snap, weightKg: 16 })

    expect((await kettlebellSessions.latest())?.id).toBe(newest.id)
    expect((await kettlebellSessions.latest('a'))?.weightKg).toBe(12)
    expect(await kettlebellSessions.latest('zzz')).toBeUndefined()
  })
})

describe('moods.tagsByUse', () => {
  beforeEach(async () => {
    await deleteSampleData()
    for (const m of await moods.list()) await moods.remove(m.id)
  })

  it('orders tags by how often they are used', async () => {
    await moods.create({ date: '2026-09-01', rating: 3, tags: ['work', 'sleep'] })
    await moods.create({ date: '2026-09-02', rating: 4, tags: ['sleep'] })
    await moods.create({ date: '2026-09-03', rating: 4, tags: ['coffee', 'sleep', 'work'] })
    expect(await moods.tagsByUse()).toEqual(['sleep', 'work', 'coffee'])
  })
})

describe('replace', () => {
  it('saves an edit exactly, dropping cleared fields but keeping id and createdAt', async () => {
    const run = await runs.create({ date: '2026-09-01', runType: 'long', distanceKm: 10, notes: 'windy' })
    const replaced = await runs.replace(run.id, { date: '2026-09-02', runType: 'short' })
    expect(replaced).toEqual({ id: run.id, createdAt: run.createdAt, updatedAt: replaced.updatedAt, date: '2026-09-02', runType: 'short' })
    expect(await runs.get(run.id)).toEqual(replaced)
    await runs.remove(run.id)
  })
})

describe('getDaySummaries', () => {
  beforeEach(async () => {
    await deleteSampleData()
    for (const r of await runs.list()) await runs.remove(r.id)
    for (const m of await moods.list()) await moods.remove(m.id)
    for (const s of await kettlebellSessions.list()) await kettlebellSessions.remove(s.id)
    for (const m of await meditations.list()) await meditations.remove(m.id)
  })

  it('summarises each day with entries, newest first', async () => {
    await runs.create({ date: '2026-09-01', runType: 'short', distanceKm: 5 })
    await runs.create({ date: '2026-09-01', runType: 'intervals', distanceKm: 3.5 })
    await runs.create({ date: '2026-09-03', runType: 'long' })
    await moods.create({ date: '2026-09-01', rating: 2, tags: [] })
    await new Promise((r) => setTimeout(r, 5))
    await moods.create({ date: '2026-09-01', rating: 4, tags: [] })
    await kettlebellSessions.create({ date: '2026-09-02', complexId: 'x', complexSnapshot: { name: 'A', movements: [] }, rounds: 7 })
    await meditations.create({ date: '2026-09-02', durationSec: 600, hrSamples: [] })

    const days = await getDaySummaries()
    expect(days.map((d) => d.date)).toEqual(['2026-09-03', '2026-09-02', '2026-09-01'])
    expect(days[2]).toEqual({ date: '2026-09-01', moodRatings: [2, 4], runCount: 2, runKm: 8.5, kettlebell: [], meditationSec: 0, fastHours: 0 })
    expect(days[1]).toMatchObject({ kettlebell: [{ name: 'A', rounds: 7 }], meditationSec: 600, runCount: 0 })
    expect(days[0]).toMatchObject({ runCount: 1, runKm: 0 })
  })
})

describe('fasts', () => {
  beforeEach(async () => {
    for (const f of await fasts.list()) await fasts.remove(f.id)
  })

  it('runs one fast at a time and files it under the day it ended', async () => {
    const started = await fasts.start(new Date(2026, 8, 20, 20, 0), 16)
    expect(started).toMatchObject({ date: '2026-09-20', goalHours: 16 })
    expect((await fasts.active())?.id).toBe(started.id)
    await expect(fasts.start(new Date(), 12)).rejects.toThrow('already running')

    const done = await fasts.finish(started.id, new Date(2026, 8, 21, 12, 30), ' felt good ')
    expect(done).toMatchObject({ date: '2026-09-21', notes: 'felt good' })
    expect(await fasts.active()).toBeUndefined()
    expect((await fasts.listFinished()).map((f) => f.id)).toEqual([started.id])

    const day = await getEntriesForDay('2026-09-21')
    expect(day.fasts).toHaveLength(1)
    expect(isDayEmpty(day)).toBe(false)
    const summary = (await getDaySummaries()).find((d) => d.date === '2026-09-21')
    expect(summary?.fastHours).toBeCloseTo(16.5)
  })

  it('keeps one fasting plan', async () => {
    await fastingPlan.save({ goalHours: 16, startTime: '20:00', days: [1, 3, 5] })
    const updated = await fastingPlan.save({ goalHours: 18, startTime: '19:30', days: [0, 1, 2, 3, 4, 5, 6] })
    expect(await fastingPlan.get()).toEqual(updated)
    expect(updated.id).toBe('plan')
  })
})
