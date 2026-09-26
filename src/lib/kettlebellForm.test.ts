import { describe, expect, it } from 'vitest'

import type { Complex } from '@/data'

import { pickDefaultComplex, validateKettlebellForm, type KettlebellFormValues } from './kettlebellForm'
import { parseDecimal } from './numbers'

const complex = (id: string, name = id): Complex => ({
  id,
  name,
  movements: [{ name: 'Swing', reps: 20 }, { name: 'Goblet squat', reps: 12, eachArm: true }],
  format: 'amrap',
  durationMin: 20,
  archived: false,
  createdAt: '',
  updatedAt: '',
})

const values = (over: Partial<KettlebellFormValues> = {}): KettlebellFormValues => ({
  date: '2026-09-26',
  complexId: 'a',
  weightKg: '12',
  rounds: '6',
  durationMin: '20',
  notes: '',
  ...over,
})

describe('pickDefaultComplex', () => {
  const [a, b, c] = [complex('a'), complex('b'), complex('c')]

  it('picks the next one in rotation', () => {
    expect(pickDefaultComplex([a, b, c], 'a')).toBe(b)
    expect(pickDefaultComplex([a, b, c], 'c')).toBe(a)
  })

  it('falls back to the first, or the only one', () => {
    expect(pickDefaultComplex([a, b, c])).toBe(a)
    expect(pickDefaultComplex([a, b, c], 'archived-one')).toBe(a)
    expect(pickDefaultComplex([b], 'a')).toBe(b)
    expect(pickDefaultComplex([])).toBeUndefined()
  })
})

describe('validateKettlebellForm', () => {
  it('builds a session with a snapshot of the complex', () => {
    const a = complex('a', 'A')
    const { errors, session } = validateKettlebellForm(values({ weightKg: '12,5', notes: ' + swings ' }), a)
    expect(errors).toEqual({})
    expect(session).toEqual({
      date: '2026-09-26',
      complexId: 'a',
      complexSnapshot: {
        name: 'A',
        movements: [{ name: 'Swing', reps: 20 }, { name: 'Goblet squat', reps: 12, eachArm: true }],
      },
      weightKg: 12.5,
      rounds: 6,
      durationMin: 20,
      notes: '+ swings',
    })
    // The snapshot is a copy: editing the complex later must not change the session.
    a.movements.push({ name: 'Press' })
    expect(session!.complexSnapshot.movements).toHaveLength(2)
  })

  it('leaves blank optional fields out', () => {
    const { session } = validateKettlebellForm(values({ weightKg: '', rounds: '', durationMin: '' }), complex('a'))
    expect(session).not.toHaveProperty('weightKg')
    expect(session).not.toHaveProperty('rounds')
    expect(session).not.toHaveProperty('durationMin')
    expect(session).not.toHaveProperty('notes')
  })

  it('reports each problem', () => {
    const { errors, session } = validateKettlebellForm(
      values({ date: '', weightKg: '0', rounds: '6.5', durationMin: '500' }),
      undefined,
    )
    expect(session).toBeUndefined()
    expect(Object.keys(errors).sort()).toEqual(['complexId', 'date', 'durationMin', 'rounds', 'weightKg'])
  })
})

describe('parseDecimal', () => {
  it('accepts dots and commas', () => {
    expect(parseDecimal('16')).toBe(16)
    expect(parseDecimal('12.5')).toBe(12.5)
    expect(parseDecimal('12,5')).toBe(12.5)
    expect(parseDecimal('abc')).toBeUndefined()
    expect(parseDecimal('1.2.3')).toBeUndefined()
  })
})
