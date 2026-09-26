import { cn } from '@/lib/utils'

/** The complex's name in a kettlebell-coloured tile — "A", "B", or the first letters of a longer name. */
export function ComplexBadge({ name, muted, className }: { name: string; muted?: boolean; className?: string }) {
  const short = name.length <= 3 ? name : name.slice(0, 2)
  return (
    <span
      className={cn(
        'grid size-12 shrink-0 place-items-center rounded-xl font-display text-xl font-semibold',
        muted ? 'bg-muted text-muted-foreground' : 'bg-kettlebell/15 text-kettlebell',
        className,
      )}
    >
      {short}
    </span>
  )
}
