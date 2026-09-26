import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** A labelled number, optionally with a comparison line underneath. */
export function StatTile({
  label,
  value,
  unit,
  detail,
  className,
}: {
  label: string
  value: ReactNode
  unit?: string
  detail?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-2xl border bg-card p-4 shadow-soft', className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">
        {value}
        {unit && <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span>}
      </p>
      {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
    </div>
  )
}
