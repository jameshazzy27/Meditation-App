import { moodLevels, type MoodRating } from '@/lib/mood'
import { cn } from '@/lib/utils'

const ratings: MoodRating[] = [1, 2, 3, 4, 5]

export function MoodScale({
  value,
  onChange,
}: {
  value?: MoodRating
  onChange?: (rating: MoodRating) => void
}) {
  return (
    <div role="radiogroup" aria-label="Mood" className="grid grid-cols-5 gap-2">
      {ratings.map((rating) => {
        const { label, icon: Icon, bg, text } = moodLevels[rating]
        const selected = value === rating
        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange?.(rating)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-2xl py-3 text-xs font-medium transition-all active:scale-95',
              selected ? cn(bg, 'text-white shadow-soft dark:text-background') : cn('bg-muted', text),
            )}
          >
            <Icon className="size-7" strokeWidth={1.75} />
            <span className={selected ? undefined : 'text-muted-foreground'}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
