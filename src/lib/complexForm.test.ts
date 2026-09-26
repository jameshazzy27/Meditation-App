import { describe, expect, it } from 'vitest'

import { complexToForm, emptyComplexForm, validateComplexForm, type MovementFormValues } from './complexForm'
import { formatMovement } from './format'

const row = (name: string, reps = '', eachArm = false): MovementFormValues => ({ name, reps, eachArm })
const form = (over: Partial<ReturnType<typeof emptyComplexForm>>) => ({ ...emptyComplexForm(), ...over })

describe('validateComplexForm', () => {
  it('turns rows into movements, dropping empty rows', () => {
    const { errors, complex } = validateComplexForm(
      form({
        name: ' A ',
        movements: [row(' Kettlebell swings ', '20'), row('', '5'), row('Renegade rows', ' 6 ', true), row('Halos')],
        targetRounds: '6',
      }),
      [],
    )
    expect(errors).toEqual({})
    expect(complex).toEqual({
      name: 'A',
      movements: [
        { name: 'Kettlebell swings', reps: 20 },
        { name: 'Renegade rows', reps: 6, eachArm: true },
        { name: 'Halos' },
      ],
      format: 'amrap',
      durationMin: 20,
      targetRounds: 6,
    })
  })

  it('leaves target rounds out when blank', () => {
    const { complex } = validateComplexForm(form({ name: 'A', movements: [row('Swing')] }), [])
    expect(complex).not.toHaveProperty('targetRounds')
  })

  it('reports each problem', () => {
    const { errors, complex } = validateComplexForm(
      form({ name: '  ', movements: [row(''), row(' ')], durationMin: '0', targetRounds: '2.5' }),
      [],
    )
    expect(complex).toBeUndefined()
    expect(Object.keys(errors).sort()).toEqual(['durationMin', 'movements', 'name', 'targetRounds'])
  })

  it('checks reps', () => {
    const { errors } = validateComplexForm(form({ name: 'A', movements: [row('Swing', '20'), row('Row', 'six')] }), [])
    expect(errors.movements).toMatch(/reps for movement 2/)
  })

  it('rejects a duplicate name regardless of case', () => {
    expect(validateComplexForm(form({ name: 'a', movements: [row('Swing')] }), ['A']).errors.name).toBe(
      'You already have a complex called "A".',
    )
  })

  it('round-trips a saved complex through the form', () => {
    const movements = [{ name: 'Swing', reps: 20 }, { name: 'Row', reps: 6, eachArm: true }, { name: 'Halos' }]
    const values = complexToForm({ id: '1', name: 'A', movements, format: 'amrap', durationMin: 20, archived: false, createdAt: '', updatedAt: '' })
    expect(values.movements[1]).toEqual({ name: 'Row', reps: '6', eachArm: true })
    expect(validateComplexForm(values, []).complex?.movements).toEqual(movements)
  })
})

describe('formatMovement', () => {
  it('writes a movement out in full', () => {
    expect(formatMovement({ name: 'Kettlebell swings', reps: 20 })).toBe('Kettlebell swings × 20')
    expect(formatMovement({ name: 'Renegade rows', reps: 6, eachArm: true })).toBe('Renegade rows × 6 each arm')
    expect(formatMovement({ name: 'Halos' })).toBe('Halos')
    expect(formatMovement({ name: 'Halos', eachArm: true })).toBe('Halos (each arm)')
  })
})
