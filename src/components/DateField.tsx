import { CalendarDays } from 'lucide-react'
import { useRef, type ReactNode } from 'react'

import { addDays, fromDateKey, isDateKey, todayKey } from '@/data'
import { cn } from '@/lib/utils'

/**
 * Pick the day an entry belongs to: one tap for Today or Yesterday (what
 * you'll log most), or a third button that opens the phone's date picker.
 */
export function DateField({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string
  value: string
  onChange: (date: string) => void
  invalid?: boolean
}) {
  const picker = useRef<HTMLInputElement>(null)
  const today = todayKey()
  const yesterday = addDays(today, -1)
  const otherDay = isDateKey(value) && value !== today && value !== yesterday

  function openPicker() {
    const input = picker.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus() // Older browsers: focusing the field brings up the picker instead.
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <Chip selected={value === today} onClick={() => onChange(today)}>
        Today
      </Chip>
      <Chip selected={value === yesterday} onClick={() => onChange(yesterday)}>
        Yesterday
      </Chip>
      <div className="relative">
        <Chip selected={otherDay} invalid={invalid} onClick={openPicker} className="w-full">
          <CalendarDays className="size-4 shrink-0" />
          {otherDay
            ? fromDateKey(value).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
            : 'Other day'}
        </Chip>
        {/* The real date input, kept out of sight; the button above opens it. */}
        <input
          ref={picker}
          id={id}
          type="date"
          value={value}
          max={today}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0"
        />
      </div>
    </div>
  )
}

function Chip({
  selected,
  invalid,
  onClick,
  className,
  children,
}: {
  selected: boolean
  invalid?: boolean
  onClick: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium whitespace-nowrap transition-colors',
        selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
        invalid && 'ring-2 ring-destructive',
        className,
      )}
    >
      {children}
    </button>
  )
}
