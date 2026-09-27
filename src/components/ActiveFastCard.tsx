import { ChevronRight, Hourglass } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { fasts, useLiveData } from '@/data'
import { formatFastDuration, hoursBetween, stageAt } from '@/lib/fasting'

/** On Today while a fast is running: how long, which stage, and progress to the goal. */
export function ActiveFastCard() {
  const fast = useLiveData(() => fasts.active())
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])
  if (!fast) return null

  const hours = Math.max(0, hoursBetween(fast.startedAt, now))
  const progress = Math.min(1, hours / fast.goalHours)
  return (
    <Link to="/fast" className="block">
      <div className="space-y-3 rounded-lg border border-l-4 border-l-fast bg-card p-4 shadow-soft transition-colors hover:bg-accent/40">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-fast/12 text-fast">
            <Hourglass className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wider text-fast uppercase">Fasting</p>
            <p className="font-semibold">
              {formatFastDuration(hours)} <span className="font-normal text-muted-foreground">of {fast.goalHours} h</span>
            </p>
            <p className="text-sm text-muted-foreground">{stageAt(hours).name}</p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground/60" />
        </div>
        <div className="h-2 overflow-hidden rounded-sm bg-muted" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to fasting goal">
          <div className={progress >= 1 ? 'h-full bg-primary' : 'h-full bg-fast'} style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </Link>
  )
}
