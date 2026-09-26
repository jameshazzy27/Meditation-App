import { describe, expect, it } from 'vitest'

import type { KettlebellSession, MoodEntry, Run } from '@/data'

import {
  dailyMood,
  kettlebellPoints,
  moodOnWorkoutDays,
  paceByType,
  rangeStart,
  sessionsBeatingTarget,
  streaks,
  summariseWeek,
  topTags,
  withWeeklyAverage,
  weekStart,
  weeklyRuns,
  weeksBetween,
} from './trends'

let n = 0
const stamp = () => {
  const t = new Date(Date.UTC(2026, 0, 1, 0, 0, n++)).toISOString()
  return { id: `id${n}`, createdAt: t, updatedAt: t }
}
const run = (date: string, runType: Run['runType'], distanceKm?: number, durationSec?: number): Run => ({ ...stamp(), date, runType, distanceKm, durationSec })
const kb = (date: string, complexId: string, rounds?: number, weightKg?: number): KettlebellSession => ({ ...stamp(), date, complexId, complexSnapshot: { name: complexId, movements: [] }, rounds, weightKg })
const mood = (date: string, rating: MoodEntry['rating'], tags: string[] = []): MoodEntry => ({ ...stamp(), date, rating, tags })

// 26 Sep 2026 is a Saturday; that week starts Monday 21 Sep.
const today = '2026-09-26'

describe('weeks and ranges', () => {
  it('finds the Monday of a week', () => {
    expect(weekStart('2026-09-26')).toBe('2026-09-21')
    expect(weekStart('2026-09-21')).toBe('2026-09-21')
    expect(weekStart('2026-09-27')).toBe('2026-09-21') // Sunday
  })

  it('covers whole weeks, including this one', () => {
    expect(rangeStart('4w', today)).toBe('2026-08-31')
    expect(weeksBetween(rangeStart('4w', today), today)).toEqual(['2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21'])
    expect(weeksBetween(rangeStart('3m', today), today)).toHaveLength(13)
    expect(rangeStart('all', today, '2026-01-07')).toBe('2026-01-05')
    expect(rangeStart('all', today)).toBe('2026-09-21')
  })
})

describe('kettlebell', () => {
  const sessions = [kb('2026-09-01', 'a', 5, 12), kb('2026-09-03', 'a', 7, 12), kb('2026-09-02', 'b', 4), kb('2026-09-05', 'a', 8, 12), kb('2026-09-08', 'a', 7, 12)]

  it('lists a complex’s sessions oldest first', () => {
    expect(kettlebellPoints(sessions, 'a', '2026-09-02').map((p) => p.rounds)).toEqual([7, 8, 7])
  })

  it('counts sessions in a row beating the target', () => {
    expect(sessionsBeatingTarget(sessions, 'a', 6)).toBe(3)
    expect(sessionsBeatingTarget(sessions, 'a', 7)).toBe(0) // latest was 7, not more than 7
    expect(sessionsBeatingTarget(sessions, 'a', undefined)).toBe(0)
  })
})

describe('running', () => {
  const runs = [run('2026-09-22', 'short', 5, 1500), run('2026-09-24', 'long', 12, 3960), run('2026-09-08', 'intervals', 6, 1800), run('2026-09-24', 'intervals')]

  it('totals distance and runs per week, including empty weeks', () => {
    expect(weeklyRuns(runs, weeksBetween(rangeStart('4w', today), today))).toEqual([
      { week: '2026-08-31', km: 0, runs: 0 },
      { week: '2026-09-07', km: 6, runs: 1 },
      { week: '2026-09-14', km: 0, runs: 0 },
      { week: '2026-09-21', km: 17, runs: 3 },
    ])
  })

  it('gives pace per run type, skipping runs without distance and time', () => {
    expect(paceByType(runs, '2026-09-01')).toEqual([
      { date: '2026-09-08', intervals: 300 },
      { date: '2026-09-22', short: 300 },
      { date: '2026-09-24', long: 330 },
    ])
  })
})

describe('mood', () => {
  const moods = [mood('2026-09-22', 2, ['work']), mood('2026-09-22', 4, ['sleep', 'work']), mood('2026-09-24', 5, ['sleep', 'coffee']), mood('2026-09-25', 3, ['work'])]

  it('averages each day', () => {
    expect(dailyMood(moods, '2026-09-01')).toEqual([
      { date: '2026-09-22', mood: 3 },
      { date: '2026-09-24', mood: 5 },
      { date: '2026-09-25', mood: 3 },
    ])
  })

  it('smooths mood with a 7-day average', () => {
    const days = [
      { date: '2026-09-01', mood: 2 },
      { date: '2026-09-02', mood: 4 },
      { date: '2026-09-08', mood: 5 }, // 1 Sep is now 7 days back, so it drops out
    ]
    expect(withWeeklyAverage(days).map((d) => d.average)).toEqual([2, 3, 4.5])
  })

  it('ranks tags', () => {
    expect(topTags(moods, '2026-09-01')).toEqual([
      { tag: 'work', count: 3 },
      { tag: 'sleep', count: 2 },
      { tag: 'coffee', count: 1 },
    ])
  })

  it('compares workout days with rest days', () => {
    const result = moodOnWorkoutDays(moods, [run('2026-09-24', 'long')], [kb('2026-09-22', 'a')], '2026-09-01')
    expect(result).toEqual({ workout: { average: 4, days: 2 }, rest: { average: 3, days: 1 } })
  })
})

describe('overview', () => {
  it('counts the current and best streak', () => {
    const days = ['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13', '2026-09-24', '2026-09-25']
    expect(streaks(days, today)).toEqual({ current: 2, best: 4 }) // today not logged yet — still counts
    expect(streaks([...days, today], today)).toEqual({ current: 3, best: 4 })
    expect(streaks(['2026-09-20'], today)).toEqual({ current: 0, best: 1 })
  })

  it('summarises a week', () => {
    const summary = summariseWeek('2026-09-21', {
      runs: [run('2026-09-22', 'short', 5.25), run('2026-09-28', 'long', 10)],
      sessions: [kb('2026-09-23', 'a')],
      moods: [mood('2026-09-22', 3), mood('2026-09-26', 4)],
      meditations: [{ date: '2026-09-27' }],
    })
    expect(summary).toEqual({ km: 5.3, runs: 1, kettlebell: 1, mood: 3.5, daysLogged: 4 })
  })
})
