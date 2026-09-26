import { describe, expect, it } from 'vitest'

import { livePace, parseTime, runToForm, validateRunForm, type RunFormValues } from './runForm'

const values = (over: Partial<RunFormValues> = {}): RunFormValues => ({
  date: '2026-09-26',
  runType: 'short',
  distanceKm: '5',
  hours: '',
  minutes: '25',
  seconds: '00',
  notes: '',
  ...over,
})

describe('run form', () => {
  it('parses h / min / sec', () => {
    expect(parseTime({ hours: '', minutes: '27', seconds: '40' })).toBe(27 * 60 + 40)
    expect(parseTime({ hours: '1', minutes: '5', seconds: '' })).toBe(3900)
    expect(parseTime({ hours: '', minutes: '', seconds: '' })).toBeUndefined()
    expect(parseTime({ hours: '', minutes: '75', seconds: '' })).toBeNull()
    expect(parseTime({ hours: '0', minutes: '0', seconds: '0' })).toBeNull()
  })

  it('works out pace as you type', () => {
    expect(livePace(values())).toBe('5:00/km')
    expect(livePace(values({ distanceKm: '5,2', minutes: '27', seconds: '40' }))).toBe('5:19/km')
    expect(livePace(values({ distanceKm: '' }))).toBeUndefined()
    expect(livePace(values({ minutes: '', seconds: '' }))).toBeUndefined()
  })

  it('builds a run, leaving blanks out', () => {
    expect(validateRunForm(values({ notes: ' easy ' })).run).toEqual({
      date: '2026-09-26',
      runType: 'short',
      distanceKm: 5,
      durationSec: 1500,
      notes: 'easy',
    })
    expect(validateRunForm(values({ distanceKm: '', minutes: '', seconds: '' })).run).toEqual({
      date: '2026-09-26',
      runType: 'short',
    })
  })

  it('reports problems', () => {
    const { errors, run } = validateRunForm(values({ date: 'x', distanceKm: '-1', seconds: '99' }))
    expect(run).toBeUndefined()
    expect(Object.keys(errors).sort()).toEqual(['date', 'distanceKm', 'time'])
  })

  it('round-trips an existing run', () => {
    const form = runToForm({
      id: '1', createdAt: '', updatedAt: '', date: '2026-09-01', runType: 'long', distanceKm: 12.1, durationSec: 3920,
    })
    expect(form).toMatchObject({ hours: '1', minutes: '5', seconds: '20', distanceKm: '12.1' })
    expect(validateRunForm(form).run).toMatchObject({ durationSec: 3920, distanceKm: 12.1 })
  })
})
