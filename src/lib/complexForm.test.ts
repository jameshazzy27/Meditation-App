import { describe, expect, it } from 'vitest'

import { emptyComplexForm, validateComplexForm } from './complexForm'

const form = (over: Partial<ReturnType<typeof emptyComplexForm>>) => ({ ...emptyComplexForm(), ...over })

describe('validateComplexForm', () => {
  it('turns a valid form into a complex, trimming and dropping blank movements', () => {
    const { errors, complex } = validateComplexForm(
      form({ name: ' A ', movements: [' Kettlebell swings × 20', '', 'Goblet squats × 12  '], targetRounds: '6' }),
      [],
    )
    expect(errors).toEqual({})
    expect(complex).toEqual({
      name: 'A',
      movements: ['Kettlebell swings × 20', 'Goblet squats × 12'],
      format: 'amrap',
      durationMin: 20,
      targetRounds: 6,
    })
  })

  it('leaves target rounds out when blank', () => {
    const { complex } = validateComplexForm(form({ name: 'A', movements: ['Swing'] }), [])
    expect(complex).not.toHaveProperty('targetRounds')
  })

  it('reports each problem', () => {
    const { errors, complex } = validateComplexForm(
      form({ name: '  ', movements: ['', ' '], durationMin: '0', targetRounds: '2.5' }),
      [],
    )
    expect(complex).toBeUndefined()
    expect(Object.keys(errors).sort()).toEqual(['durationMin', 'movements', 'name', 'targetRounds'])
  })

  it('rejects a duplicate name regardless of case', () => {
    expect(validateComplexForm(form({ name: 'a', movements: ['Swing'] }), ['A']).errors.name).toBe(
      'You already have a complex called "A".',
    )
  })
})
