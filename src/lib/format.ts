import type { Complex, RunType } from '@/data'

/** 1665 → "27:45", 3920 → "1:05:20" */
export function formatDuration(totalSec: number): string {
  const sec = Math.round(totalSec)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

/** Minutes per km, e.g. "5:20/km". Undefined if either value is missing or zero. */
export function formatPace(distanceKm?: number, durationSec?: number): string | undefined {
  if (!distanceKm || !durationSec) return undefined
  return `${formatDuration(durationSec / distanceKm)}/km`
}

/** Clock time from an ISO timestamp, in the phone's own format. */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export const runTypeLabels: Record<RunType, string> = {
  intervals: 'Intervals',
  short: 'Short run',
  long: 'Long run',
}

/** Joins the parts that exist with a middle dot: "5.2 km · 27:40 · 5:19/km" */
export function joinMeta(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(' · ')
}

/** "5 movements · 20 min AMRAP · target 6 rounds" */
export function complexSummary(complex: Complex): string {
  return joinMeta(
    `${complex.movements.length} ${complex.movements.length === 1 ? 'movement' : 'movements'}`,
    `${complex.durationMin} min AMRAP`,
    complex.targetRounds !== undefined && `target ${complex.targetRounds} rounds`,
  )
}
