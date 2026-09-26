import { toDateKey } from '@/data'

/** 'YYYY-MM' for the month a date key falls in. */
export function monthKey(dateKey: string): string {
  return dateKey.slice(0, 7)
}

export function addMonths(month: string, by: number): string {
  const [y, m] = month.split('-').map(Number)
  return toDateKey(new Date(y, m - 1 + by, 1)).slice(0, 7)
}

/**
 * The days of a month laid out in weeks, Monday first. Blank cells before the
 * 1st and after the last day are null.
 */
export function monthGrid(month: string): (string | null)[][] {
  const [y, m] = month.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const daysInMonth = new Date(y, m, 0).getDate()
  const leading = (first.getDay() + 6) % 7 // Monday = 0
  const cells: (string | null)[] = Array(leading).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDateKey(new Date(y, m - 1, d)))
  while (cells.length % 7) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
