import type { ReactNode } from 'react'

/**
 * The box shown when you touch or hover a chart. The value leads (bold); what
 * it is follows in quieter text. Each row is keyed by a short line in its series colour.
 */
export function ChartTooltip({
  heading,
  rows,
}: {
  heading: ReactNode
  rows: { color: string; value: ReactNode; label?: ReactNode }[]
}) {
  return (
    <div className="min-w-32 rounded-xl border bg-popover px-3 py-2 text-sm shadow-soft">
      <p className="mb-1 text-xs text-muted-foreground">{heading}</p>
      {rows.map((row, i) => (
        <p key={i} className="flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: row.color }} />
          <span className="font-semibold tabular-nums">{row.value}</span>
          {row.label && <span className="text-muted-foreground">{row.label}</span>}
        </p>
      ))}
    </div>
  )
}
