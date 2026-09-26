import { Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { parseWholeNumber } from '@/lib/numbers'

/** A big number with − and + buttons either side; you can also type in it. */
export function NumberStepper({
  id,
  value,
  onChange,
  min = 0,
  invalid,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  min?: number
  invalid?: boolean
}) {
  const current = parseWholeNumber(value)
  const step = (by: number) => onChange(String(Math.max(min, (current ?? min) + by)))

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="size-14 shrink-0"
        aria-label="One fewer"
        disabled={current === undefined || current <= min}
        onClick={() => step(-1)}
      >
        <Minus className="size-6" />
      </Button>
      <input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="–"
        aria-invalid={invalid}
        className="h-14 w-full min-w-0 rounded-xl bg-transparent text-center font-display text-4xl font-medium tabular-nums outline-none placeholder:text-muted-foreground/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:text-destructive"
      />
      <Button
        type="button"
        size="icon"
        className="size-14 shrink-0"
        aria-label="One more"
        onClick={() => step(1)}
      >
        <Plus className="size-6" />
      </Button>
    </div>
  )
}
