import type { ReactNode } from 'react'

import { EntryIcon } from '@/components/EntryIcon'
import { Card, CardContent } from '@/components/ui/card'
import { entryKinds, type EntryKind } from '@/lib/entryTypes'
import { cn } from '@/lib/utils'

export function EntryCard({
  kind,
  title,
  meta,
  children,
}: {
  kind: EntryKind
  title: string
  meta?: string
  children?: ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex gap-4">
        <EntryIcon kind={kind} />
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
      </CardContent>
    </Card>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="border-l-2 pl-3 text-sm text-muted-foreground italic">{children}</p>
}
