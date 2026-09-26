import type { Complex, NewRecord } from '@/data'
import { parseWholeNumber } from '@/lib/numbers'

export const DEFAULT_DURATION_MIN = 20

/** What the form holds while you type — numbers stay as text until saved. */
export interface ComplexFormValues {
  name: string
  movements: string[]
  durationMin: string
  targetRounds: string
}

export type ComplexFormErrors = Partial<Record<keyof ComplexFormValues, string>>

export function emptyComplexForm(): ComplexFormValues {
  return { name: '', movements: [''], durationMin: String(DEFAULT_DURATION_MIN), targetRounds: '' }
}

export function complexToForm(complex: Complex): ComplexFormValues {
  return {
    name: complex.name,
    movements: complex.movements.length ? [...complex.movements] : [''],
    durationMin: String(complex.durationMin),
    targetRounds: complex.targetRounds === undefined ? '' : String(complex.targetRounds),
  }
}

/**
 * Checks the form and turns it into a complex ready to save.
 * `otherNames` are the names of the other active complexes, to avoid two called "A".
 */
export function validateComplexForm(
  values: ComplexFormValues,
  otherNames: string[],
): { errors: ComplexFormErrors; complex?: Omit<NewRecord<Complex>, 'archived'> } {
  const errors: ComplexFormErrors = {}

  const name = values.name.trim()
  const clash = otherNames.find((other) => other.trim().toLowerCase() === name.toLowerCase())
  if (!name) errors.name = 'Give it a name, like "A".'
  else if (clash) errors.name = `You already have a complex called "${clash}".`

  const movements = values.movements.map((m) => m.trim()).filter(Boolean)
  if (!movements.length) errors.movements = 'Add at least one movement.'

  const durationMin = parseWholeNumber(values.durationMin)
  if (durationMin === undefined || durationMin < 1 || durationMin > 180)
    errors.durationMin = 'Enter minutes between 1 and 180.'

  let targetRounds: number | undefined
  if (values.targetRounds.trim()) {
    targetRounds = parseWholeNumber(values.targetRounds)
    if (targetRounds === undefined || targetRounds < 1 || targetRounds > 999)
      errors.targetRounds = 'Enter a whole number of rounds, or leave it blank.'
  }

  if (Object.keys(errors).length) return { errors }
  return {
    errors,
    complex: {
      name,
      movements,
      format: 'amrap',
      durationMin: durationMin!,
      ...(targetRounds !== undefined && { targetRounds }),
    },
  }
}
