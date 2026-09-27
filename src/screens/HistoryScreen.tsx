import { ChevronLeft, ChevronRight, Dumbbell, Flower2, Footprints } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'

import { ChoiceChips } from '@/components/ChoiceChips'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fromDateKey, getDaySummaries, todayKey, useLiveData, type DaySummary } from '@/data'
import { addMonths, monthGrid, monthKey, monthLabel } from '@/lib/calendar'
import { moodLevels, type MoodRating } from '@/lib/mood'
import { dayPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

type View = 'list' | 'calendar'

// A day's calendar cell is tinted by its (last) mood.
const moodTint: Record<MoodRating, string> = {
  1: 'bg-mood-1/25',
  2: 'bg-mood-2/25',
  3: 'bg-mood-3/30',
  4: 'bg-mood-4/25',
  5: 'bg-mood-5/25',
}

export function HistoryScreen() {
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'calendar' ? 'calendar' : 'list'
  const days = useLiveData(() => getDaySummaries())

  return (
    <>
      <ScreenHeader title="History" subtitle={days ? daysLoggedLabel(days.length) : ' '} rune="ᛟ" />
      <div className="mb-5">
        <ChoiceChips<View>
          label="View"
          options={[
            { value: 'list', label: 'List' },
            { value: 'calendar', label: 'Calendar' },
          ]}
          value={view}
          onChange={(v) => setParams(v === 'list' ? {} : { view: v }, { replace: true })}
        />
      </div>
      {days && days.length === 0 && (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardHeader className="text-center">
            <CardTitle>Nothing here yet</CardTitle>
            <CardDescription>Every day you log something will appear here.</CardDescription>
          </CardHeader>
        </Card>
      )}
      {days && view === 'list' && <DayList days={days} />}
      {days && view === 'calendar' && <MonthCalendar days={days} />}
    </>
  )
}

function daysLoggedLabel(n: number) {
  return n === 1 ? '1 day logged' : `${n} days logged`
}

function DayList({ days }: { days: DaySummary[] }) {
  // Group by month, keeping newest first.
  const months: { month: string; days: DaySummary[] }[] = []
  for (const day of days) {
    const month = monthKey(day.date)
    if (months.at(-1)?.month !== month) months.push({ month, days: [] })
    months.at(-1)!.days.push(day)
  }

  return (
    <div className="space-y-8">
      {months.map(({ month, days }) => (
        <section key={month} className="space-y-2">
          <h2 className="px-1 text-xl font-medium">{monthLabel(month)}</h2>
          {days.map((day) => (
            <DayRow key={day.date} day={day} />
          ))}
        </section>
      ))}
    </div>
  )
}

function DayRow({ day }: { day: DaySummary }) {
  const date = fromDateKey(day.date)
  const isToday = day.date === todayKey()
  return (
    <Link to={dayPath(day.date)} className="block">
      <Card className="py-3 transition-colors hover:bg-accent/40">
        <CardContent className="flex items-center gap-4 px-4">
          <div
            className={cn(
              'flex w-12 shrink-0 flex-col items-center rounded-xl py-1.5',
              isToday ? 'bg-primary text-primary-foreground' : 'bg-muted',
            )}
          >
            <span className="text-[11px] font-medium uppercase opacity-80">
              {date.toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
            <span className="font-display text-xl leading-tight font-medium">{date.getDate()}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
            {day.moodRatings.length > 0 && (
              <span className="flex -space-x-1" aria-label={`Mood: ${day.moodRatings.map((r) => moodLevels[r].label).join(', ')}`}>
                {day.moodRatings.slice(-3).map((rating, i) => {
                  const { icon: Icon, bg } = moodLevels[rating]
                  return (
                    <span
                      key={i}
                      className={cn('grid size-6 place-items-center rounded-full text-white ring-2 ring-card dark:text-background', bg)}
                    >
                      <Icon className="size-4" strokeWidth={2.25} />
                    </span>
                  )
                })}
              </span>
            )}
            {day.runCount > 0 && (
              <Stat icon={<Footprints className="size-4 text-run" />}>
                {day.runKm > 0 ? `${Math.round(day.runKm * 10) / 10} km` : day.runCount === 1 ? 'Run' : `${day.runCount} runs`}
              </Stat>
            )}
            {day.kettlebell.map((kb, i) => (
              <Stat key={i} icon={<Dumbbell className="size-4 text-kettlebell" />}>
                {kb.name}
                {kb.rounds !== undefined && ` · ${kb.rounds} rds`}
              </Stat>
            ))}
            {day.meditationSec > 0 && (
              <Stat icon={<Flower2 className="size-4 text-meditation" />}>{Math.round(day.meditationSec / 60)} min</Stat>
            )}
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground/60" />
        </CardContent>
      </Card>
    </Link>
  )
}

function Stat({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1 whitespace-nowrap tabular-nums">
      {icon}
      {children}
    </span>
  )
}

function MonthCalendar({ days }: { days: DaySummary[] }) {
  const [params, setParams] = useSearchParams()
  const today = todayKey()
  const thisMonth = monthKey(today)
  const requested = params.get('month') ?? ''
  const month = /^\d{4}-\d{2}$/.test(requested) && requested <= thisMonth ? requested : thisMonth
  const byDate = new Map(days.map((d) => [d.date, d]))
  // Mon…Sun initials in the phone's language (1 Jan 2024 was a Monday).
  const weekdays = [0, 1, 2, 3, 4, 5, 6].map((i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(undefined, { weekday: 'narrow' }),
  )

  const goMonth = (by: number) => setParams({ view: 'calendar', month: addMonths(month, by) }, { replace: true })

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => goMonth(-1)}>
            <ChevronLeft />
          </Button>
          <h2 className="text-xl font-medium">{monthLabel(month)}</h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            disabled={month >= thisMonth}
            onClick={() => goMonth(1)}
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdays.map((w, i) => (
            <span key={i} className="pb-1 text-xs font-medium text-muted-foreground">
              {w}
            </span>
          ))}
          {monthGrid(month)
            .flat()
            .map((date, i) => {
              if (!date) return <span key={i} />
              const day = byDate.get(date)
              const lastMood = day?.moodRatings.at(-1)
              const future = date > today
              const cell = (
                <span
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm tabular-nums',
                    lastMood ? moodTint[lastMood] : day ? 'bg-muted' : '',
                    date === today && 'ring-2 ring-primary',
                    future && 'text-muted-foreground/40',
                  )}
                >
                  <span className={cn(day && 'font-semibold')}>{fromDateKey(date).getDate()}</span>
                  <span className="flex h-1.5 gap-0.5">
                    {day && day.runCount > 0 && <Dot className="bg-run" />}
                    {day && day.kettlebell.length > 0 && <Dot className="bg-kettlebell" />}
                    {day && day.meditationSec > 0 && <Dot className="bg-meditation" />}
                  </span>
                </span>
              )
              return future ? (
                <span key={date}>{cell}</span>
              ) : (
                <Link key={date} to={dayPath(date)} aria-label={fromDateKey(date).toDateString()}>
                  {cell}
                </Link>
              )
            })}
        </div>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
          <Legend className="bg-run">Run</Legend>
          <Legend className="bg-kettlebell">Kettlebell</Legend>
          <Legend className="bg-meditation">Meditation</Legend>
          <span className="flex items-center gap-1.5">
            <span className="flex h-2.5 overflow-hidden rounded-full">
              {([1, 2, 3, 4, 5] as MoodRating[]).map((r) => (
                <span key={r} className={cn('w-2', moodLevels[r].bg)} />
              ))}
            </span>
            Mood
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function Dot({ className }: { className: string }) {
  return <span className={cn('size-1.5 rounded-full', className)} />
}

function Legend({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <Dot className={className} />
      {children}
    </span>
  )
}
