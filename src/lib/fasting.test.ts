import { describe, expect, it } from 'vitest'

import {
  formatFastClock,
  formatFastDuration,
  goalReminderIcs,
  hoursBetween,
  milestones,
  nextStage,
  planRemindersIcs,
  STAGES,
  stageAt,
  timeAt,
} from './fasting'

describe('stages', () => {
  it('are in order and each cites its evidence', () => {
    expect(STAGES.map((s) => s.fromHours)).toEqual([...STAGES.map((s) => s.fromHours)].sort((a, b) => a - b))
    for (const s of STAGES) expect(s.sources.length).toBeGreaterThan(0)
  })

  it('finds the current and next stage', () => {
    expect(stageAt(0).name).toBe('Fed state')
    expect(stageAt(13.5).name).toBe('Metabolic switch')
    expect(stageAt(100).name).toBe('Prolonged fast')
    expect(nextStage(13.5)?.fromHours).toBe(18)
    expect(nextStage(100)).toBeUndefined()
  })
})

describe('times and formatting', () => {
  it('measures and formats durations', () => {
    expect(hoursBetween('2026-09-20T20:00:00Z', '2026-09-21T12:30:00Z')).toBe(16.5)
    expect(timeAt('2026-09-20T20:00:00Z', 16).toISOString()).toBe('2026-09-21T12:00:00.000Z')
    expect(formatFastDuration(16.5)).toBe('16 h 30 m')
    expect(formatFastDuration(0.75)).toBe('45 m')
    expect(formatFastDuration(51)).toBe('2 d 3 h')
    expect(formatFastClock(14.0875)).toBe('14:05:15')
  })
})

describe('milestones', () => {
  it('alerts at each new stage and the goal, merging a goal that lands on a stage', () => {
    const m16 = milestones(16)
    expect(m16.map((m) => m.hours)).toEqual([4, 12, 16, 18, 24, 48, 72])
    expect(m16.find((m) => m.hours === 16)?.title).toMatch(/Goal reached/)
    const m18 = milestones(18)
    expect(m18.filter((m) => m.hours === 18)).toHaveLength(1)
    expect(m18.find((m) => m.hours === 18)?.title).toMatch(/Goal reached/)
  })
})

describe('calendar files', () => {
  const now = new Date(2026, 8, 27, 9, 0) // Sunday 27 Sep 2026, 09:00

  it('makes a one-off goal reminder with an alarm', () => {
    const ics = goalReminderIcs({ id: 'f1', startedAt: new Date(2026, 8, 26, 20, 0).toISOString(), goalHours: 16 }, now)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('DTSTART:20260927T120000')
    expect(ics).toContain('SUMMARY:Fast goal reached: 16 h 00 m')
    expect(ics).toContain('TRIGGER:PT0M')
    expect(ics.split('\r\n').every((line) => line.length <= 200)).toBe(true)
  })

  it('makes repeating start and goal reminders, shifting goal days past midnight', () => {
    // Weekdays at 20:00 for 16 h → goals land Tuesday–Saturday at 12:00.
    const ics = planRemindersIcs({ startTime: '20:00', goalHours: 16, days: [1, 2, 3, 4, 5] }, now)
    expect(ics).toContain('DTSTART:20260928T200000') // next Monday
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR')
    expect(ics).toContain('DTSTART:20260929T120000')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=TU,WE,TH,FR,SA')
  })
})

describe('calendar text', () => {
  it('escapes commas, semicolons and backslashes', () => {
    const ics = goalReminderIcs({ id: 'x', startedAt: new Date(2026, 8, 26, 20).toISOString(), goalHours: 16 }, new Date(2026, 8, 27))
    expect(ics).toContain('DESCRIPTION:Skål! Your fasting goal is reached. Open Aura to end and record your fast.')
    const plan = planRemindersIcs({ startTime: '20:00', goalHours: 16, days: [1] }, new Date(2026, 8, 27))
    expect(plan).toContain('DESCRIPTION:Your fasting plan: 16 h 00 m from 20:00. Open Aura and tap Start fast.')
  })
})
