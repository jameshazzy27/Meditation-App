import { isDateKey, type Complex, type KettlebellSession, type NewRecord } from '@/data'
import { parseDecimal, parseWholeNumber } from '@/lib/numbers'

/** What the log form holds while you type — numbers stay as text until saved. */
export interface KettlebellFormValues {
  date: string
  complexId: string
  weightKg: string
  rounds: string
  durationMin: string
  notes: string
}

export type KettlebellFormErrors = Partial<Record<keyof KettlebellFormValues, string>>

/**
 * Which complex to pre-select: the only one if there's just one, otherwise the
 * one after the complex you did last (A → B → C → A), otherwise the first.
 */
export function pickDefaultComplex(active: Complex[], lastComplexId?: string): Complex | undefined {
  if (active.length <= 1) return active[0]
  const lastIndex = active.findIndex((c) => c.id === lastComplexId)
  return active[lastIndex === -1 ? 0 : (lastIndex + 1) % active.length]
}

/** Checks the form and turns it into a session (including the complex snapshot) ready to save. */
export function validateKettlebellForm(
  values: KettlebellFormValues,
  complex: Complex | undefined,
): { errors: KettlebellFormErrors; session?: NewRecord<KettlebellSession> } {
  const errors: KettlebellFormErrors = {}

  if (!isDateKey(values.date)) errors.date = 'Pick a date.'
  if (!complex) errors.complexId = 'Choose which complex you did.'

  let weightKg: number | undefined
  if (values.weightKg.trim()) {
    weightKg = parseDecimal(values.weightKg)
    if (weightKg === undefined || weightKg <= 0 || weightKg > 200)
      errors.weightKg = 'Enter the bell weight in kg, like 12 or 16.'
  }

  let rounds: number | undefined
  if (values.rounds.trim()) {
    rounds = parseWholeNumber(values.rounds)
    if (rounds === undefined || rounds > 999) errors.rounds = 'Enter whole rounds — put part-rounds in notes.'
  }

  let durationMin: number | undefined
  if (values.durationMin.trim()) {
    durationMin = parseWholeNumber(values.durationMin)
    if (durationMin === undefined || durationMin < 1 || durationMin > 180)
      errors.durationMin = 'Enter minutes between 1 and 180.'
  }

  if (Object.keys(errors).length || !complex) return { errors }
  const notes = values.notes.trim()
  return {
    errors,
    session: {
      date: values.date,
      complexId: complex.id,
      complexSnapshot: { name: complex.name, movements: [...complex.movements] },
      ...(weightKg !== undefined && { weightKg }),
      ...(rounds !== undefined && { rounds }),
      ...(durationMin !== undefined && { durationMin }),
      ...(notes && { notes }),
    },
  }
}
