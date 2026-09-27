import { ArrowDown, ArrowUp, Flame, Minus } from 'lucide-react'
import type { ReactNode } from 'react'

import { StatTile } from '@/components/charts/StatTile'
import { addDays } from '@/data'
import { sessionsBeatingTarget, SIZE_UP_AFTER, streaks, summariseWeek, weekStart } from '@/lib/trends'

import { SizeUpNotice } from './SizeUpNotice'
import type { TrendsData } from './useTrendsData'

/** "+3.2 km vs last week", with an arrow for the direction. */
function Change({ now, before, unit = '', decimals = 0 }: { now?: number; before?: number; unit?: string; decimals?: number }) {
  if (now === undefined || before === undefined) return <>Nothing to compare yet</>
  const diff = Math.round((now - before) * 10 ** decimals) / 10 ** decimals
  const Icon = diff > 0 ? ArrowUp : diff < 0 ? ArrowDown : Minus
  const text: ReactNode = diff === 0 ? 'Same as last week' : `${diff > 0 ? '+' : '−'}${Math.abs(diff)}${unit} vs last week`
  return (
    <span className="flex items-center gap-1">
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {text}
    </span>
  )
}

export function OverviewTrends({ data, today }: { data: TrendsData; today: string }) {
  const thisWeek = weekStart(today)
  const now = summariseWeek(thisWeek, data)
  const last = summariseWeek(addDays(thisWeek, -7), data)
  const logged = [...data.runs, ...data.sessions, ...data.moods, ...data.meditations].map((e) => e.date)
  const streak = streaks(logged, today)
  const nudges = data.complexes
    .filter((c) => !c.archived && c.targetRounds !== undefined)
    .map((c) => ({ c, beating: sessionsBeatingTarget(data.sessions, c.id, c.targetRounds) }))
    .filter(({ beating }) => beating >= SIZE_UP_AFTER)

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-soft">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-kettlebell/15 text-kettlebell">
          <Flame className="size-7" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">Current streak</p>
          <p className="text-5xl font-semibold tracking-tight">
            {streak.current}
            <span className="ml-1.5 text-lg font-normal text-muted-foreground">{streak.current === 1 ? 'day' : 'days'}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Best: {streak.best} {streak.best === 1 ? 'day' : 'days'} logged in a row
          </p>
        </div>
      </section>

      {nudges.map(({ c, beating }) => (
        <SizeUpNotice key={c.id} complexName={c.name} target={c.targetRounds!} sessions={beating} />
      ))}

      <section className="space-y-3">
        <h2 className="px-1 text-xl font-medium">This week</h2>
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            label="Running"
            value={now.km}
            unit="km"
            detail={<Change now={now.km} before={last.km} unit=" km" decimals={1} />}
            className="p-3"
          />
          <StatTile
            label="Kettlebell"
            value={now.kettlebell}
            unit={now.kettlebell === 1 ? 'session' : 'sessions'}
            detail={<Change now={now.kettlebell} before={last.kettlebell} />}
            className="p-3"
          />
          <StatTile
            label="Average mood"
            value={now.mood ?? '–'}
            detail={<Change now={now.mood} before={last.mood} decimals={1} />}
            className="p-3"
          />
          <StatTile
            label="Meditation"
            value={now.meditationMin}
            unit="min"
            detail={<Change now={now.meditationMin} before={last.meditationMin} unit=" min" />}
            className="p-3"
          />
          <StatTile
            label="Days logged"
            value={now.daysLogged}
            unit="of 7"
            detail={<Change now={now.daysLogged} before={last.daysLogged} />}
            className="p-3"
          />
        </div>
        <p className="px-1 text-xs text-muted-foreground">Weeks run Monday to Sunday.</p>
      </section>
    </div>
  )
}
