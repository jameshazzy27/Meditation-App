import type { Complex, Movement, NewRecord } from '@/data'
import { parseWholeNumber } from '@/lib/numbers'

export const DEFAULT_DURATION_MIN = 20

/** One movement row while you type — reps stay as text until saved. */
export interface MovementFormValues {
  name: string
  reps: string
  eachArm: boolean
}

export const emptyMovement = (): MovementFormValues => ({ name: '', reps: '', eachArm: false })

/** What the form holds while you type — numbers stay as text until saved. */
export interface ComplexFormValues {
  name: string
  movements: MovementFormValues[]
  durationMin: string
  targetRounds: string
}

export type ComplexFormErrors = Partial<Record<keyof ComplexFormValues, string>>

export function emptyComplexForm(): ComplexFormValues {
  return { name: '', movements: [emptyMovement()], durationMin: String(DEFAULT_DURATION_MIN), targetRounds: '' }
}

export function complexToForm(complex: Complex): ComplexFormValues {
  return {
    name: complex.name,
    movements: complex.movements.length
      ? complex.movements.map((m) => ({
          name: m.name,
          reps: m.reps === undefined ? '' : String(m.reps),
          eachArm: m.eachArm === true,
        }))
      : [emptyMovement()],
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

  // Rows with no name are ignored (e.g. an empty last row).
  const movements: Movement[] = []
  values.movements.forEach((row, i) => {
    const movementName = row.name.trim()
    if (!movementName) return
    let reps: number | undefined
    if (row.reps.trim()) {
      reps = parseWholeNumber(row.reps)
      if (reps === undefined || reps < 1 || reps > 999) errors.movements = `Check the reps for movement ${i + 1} — a whole number, or leave it blank.`
    }
    movements.push({
      name: movementName,
      ...(reps !== undefined && { reps }),
      ...(row.eachArm && { eachArm: true }),
    })
  })
  if (!movements.length) errors.movements ??= 'Add at least one movement.'

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
