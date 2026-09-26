import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { EntryIcon } from '@/components/EntryIcon'
import { Card, CardContent } from '@/components/ui/card'
import { entryKinds, type EntryKind } from '@/lib/entryTypes'
import { cn } from '@/lib/utils'

export function EntryCard({
  kind,
  title,
  meta,
  to,
  icon,
  children,
}: {
  kind: EntryKind
  /** Replaces the usual icon for this kind, e.g. the mood's own face. */
  icon?: ReactNode
  title: string
  meta?: string
  /** Where tapping the card goes (its edit screen). */
  to?: string
  children?: ReactNode
}) {
  const card = (
    <Card className={cn(to && 'transition-colors hover:bg-accent/40')}>
      <CardContent className="flex gap-4">
        {icon ?? <EntryIcon kind={kind} />}
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className={cn('text-xs font-medium tracking-wider uppercase', entryKinds[kind].text)}>
              {entryKinds[kind].label}
            </p>
            <p className="font-semibold">{title}</p>
            {meta && <p className="text-sm text-muted-foreground tabular-nums">{meta}</p>}
          </div>
          {children}
        </div>
        {to && <ChevronRight className="size-5 shrink-0 self-center text-muted-foreground/60" />}
      </CardContent>
    </Card>
  )
  return to ? (
    <Link to={to} className="block">
      {card}
    </Link>
  ) : (
    card
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="border-l-2 pl-3 text-sm text-muted-foreground italic">{children}</p>
}
