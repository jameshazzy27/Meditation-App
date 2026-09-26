// Days are stored as 'YYYY-MM-DD' in *local* time, so an entry logged at 11pm
// belongs to that evening, not to tomorrow in UTC.

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, days: number): string {
  const date = fromDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && toDateKey(fromDateKey(value)) === value
}
