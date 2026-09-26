// Shared look for every Recharts chart: recessive hairline grid and axes in
// muted text, so the data is the only loud thing.

export const axisProps = {
  stroke: 'var(--border)',
  tick: { fill: 'var(--muted-foreground)', fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const

export const gridProps = {
  stroke: 'var(--border)',
  strokeDasharray: undefined,
  vertical: false,
} as const

/** Bar and line marks: thin bars with rounded ends, 2px lines, 8px dots ringed in the card colour. */
export const barProps = { maxBarSize: 24, radius: [4, 4, 0, 0] as [number, number, number, number] }
export const lineProps = { strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
export const dotProps = (color: string) => ({ r: 4, fill: color, stroke: 'var(--card)', strokeWidth: 2 })
export const activeDotProps = (color: string) => ({ r: 6, fill: color, stroke: 'var(--card)', strokeWidth: 2 })

export const CHART_HEIGHT = 200
