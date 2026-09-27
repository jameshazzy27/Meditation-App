import type { ReactNode } from 'react'

/**
 * Screen title in carved capitals, with an optional rune and a thin rune-marked
 * rule underneath.
 */
export function ScreenHeader({
  title,
  subtitle,
  action,
  rune,
}: {
  title: string
  subtitle?: ReactNode
  action?: ReactNode
  /** An Elder Futhark rune for this screen, e.g. ᛞ (Dagaz, "day") for Today. */
  rune?: string
}) {
  return (
    <header className="mb-6">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {subtitle && <p className="mb-1 text-sm font-medium text-muted-foreground">{subtitle}</p>}
          <h1 className="text-[clamp(1.6rem,7.4vw,2rem)] leading-tight font-bold">{title}</h1>
        </div>
        {action}
      </div>
      <div aria-hidden className="mt-3 flex items-center gap-2 text-rune">
        <span className="h-px w-6 bg-current opacity-60" />
        {rune && <span className="font-rune text-base leading-none">{rune}</span>}
        <span className="h-px flex-1 bg-current opacity-25" />
      </div>
    </header>
  )
}
