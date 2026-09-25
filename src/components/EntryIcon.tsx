import { entryKinds, type EntryKind } from '@/lib/entryTypes'
import { cn } from '@/lib/utils'

export function EntryIcon({ kind, className }: { kind: EntryKind; className?: string }) {
  const { icon: Icon, tile } = entryKinds[kind]
  return (
    <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', tile, className)}>
      <Icon className="size-5" strokeWidth={2} />
    </span>
  )
}
