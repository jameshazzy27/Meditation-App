import { cn } from '@/lib/utils'

/** A row of buttons where exactly one is chosen, e.g. run type. */
export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
  selectedClass = 'bg-primary text-primary-foreground',
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  selectedClass?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'h-11 rounded-xl px-2 text-sm font-medium transition-colors',
            value === option.value ? selectedClass : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
