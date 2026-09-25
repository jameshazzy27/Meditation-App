import type { ReactNode } from 'react'

export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4">
      <div>
        {subtitle && <p className="mb-1 text-sm font-medium text-muted-foreground">{subtitle}</p>}
        <h1 className="text-4xl font-medium tracking-tight">{title}</h1>
      </div>
      {action}
    </header>
  )
}
