import { isDateKey, type NewRecord, type Run, type RunType } from '@/data'
import { formatPace } from '@/lib/format'
import { parseDecimal, parseWholeNumber } from '@/lib/numbers'

/** What the run form holds while you type — numbers stay as text until saved. */
export interface RunFormValues {
  date: string
  runType: RunType
  distanceKm: string
  hours: string
  minutes: string
  seconds: string
  notes: string
}

export type RunFormErrors = Partial<Record<keyof RunFormValues | 'time', string>>

export function runToForm(run: Run): RunFormValues {
  const sec = run.durationSec
  return {
    date: run.date,
    runType: run.runType,
    distanceKm: run.distanceKm === undefined ? '' : String(run.distanceKm),
    hours: sec === undefined || sec < 3600 ? '' : String(Math.floor(sec / 3600)),
    minutes: sec === undefined ? '' : String(Math.floor((sec % 3600) / 60)),
    seconds: sec === undefined ? '' : String(sec % 60).padStart(2, '0'),
    notes: run.notes ?? '',
  }
}

/** h / min / sec boxes → total seconds. Undefined if all blank; null if something's wrong. */
export function parseTime(values: Pick<RunFormValues, 'hours' | 'minutes' | 'seconds'>): number | undefined | null {
  const parts = [values.hours, values.minutes, values.seconds]
  if (parts.every((p) => !p.trim())) return undefined
  const [h, m, s] = parts.map((p) => (p.trim() ? parseWholeNumber(p) : 0))
  if (h === undefined || m === undefined || s === undefined) return null
  if (m > 59 || s > 59 || h > 99) return null
  const total = h * 3600 + m * 60 + s
  return total > 0 ? total : null
}

/** Pace as you type, or undefined until there's enough to work it out. */
export function livePace(values: RunFormValues): string | undefined {
  const time = parseTime(values)
  return formatPace(parseDecimal(values.distanceKm), time ?? undefined)
}

export function validateRunForm(values: RunFormValues): { errors: RunFormErrors; run?: NewRecord<Run> } {
  const errors: RunFormErrors = {}
  if (!isDateKey(values.date)) errors.date = 'Pick a date.'

  let distanceKm: number | undefined
  if (values.distanceKm.trim()) {
    distanceKm = parseDecimal(values.distanceKm)
    if (distanceKm === undefined || distanceKm <= 0 || distanceKm > 500)
      errors.distanceKm = 'Enter the distance in km, like 5 or 5.2.'
  }

  const durationSec = parseTime(values)
  if (durationSec === null) errors.time = 'Check the time — minutes and seconds go up to 59.'

  if (Object.keys(errors).length) return { errors }
  const notes = values.notes.trim()
  return {
    errors,
    run: {
      date: values.date,
      runType: values.runType,
      ...(distanceKm !== undefined && { distanceKm }),
      ...(durationSec != null && { durationSec }),
      ...(notes && { notes }),
    },
  }
}
