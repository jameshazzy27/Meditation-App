import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'

import { BackupReminder } from '@/components/BackupReminder'
import { DayEntryList } from '@/components/DayEntryList'
import { QuickMood } from '@/components/QuickMood'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { addDays, fromDateKey, getEntriesForDay, isDateKey, isDayEmpty, todayKey, useLiveData } from '@/data'
import { norseDayName } from '@/lib/norse'
import { dayPath } from '@/lib/routes'

/** Everything on one day: "/" is today, "/day/YYYY-MM-DD" any other day. */
export function DayScreen() {
  const { date: dateParam } = useParams()
  const today = todayKey()
  const date = dateParam ?? today
  const navigate = useNavigate()
  const day = useLiveData(() => getEntriesForDay(date), [date])
  const touchStartX = useRef<number | null>(null)
  // After saving, the form sends us here with what was saved; show "Skål!" briefly.
  const location = useLocation()
  const [saved, setSaved] = useState<string | null>(() => (location.state as { saved?: string } | null)?.saved ?? null)
  useEffect(() => {
    if (!saved) return
    window.history.replaceState({ ...window.history.state, usr: null }, '') // don't show it again on refresh
    const timer = setTimeout(() => setSaved(null), 2600)
    return () => clearTimeout(timer)
  }, [saved])

  if (!isDateKey(date) || date > today) return <Navigate to="/" replace />
  if (dateParam === today) return <Navigate to="/" replace />

  const isToday = date === today
  const title = isToday
    ? 'Today'
    : date === addDays(today, -1)
      ? 'Yesterday'
      : fromDateKey(date).toLocaleDateString(undefined, { weekday: 'long' })
  const subtitle = fromDateKey(date).toLocaleDateString(undefined, {
    weekday: isToday ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: fromDateKey(date).getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })
  const go = (days: number) => {
    const next = addDays(date, days)
    if (next <= today) navigate(dayPath(next))
  }

  return (
    <div
      // Swipe right for the day before, left for the day after.
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        touchStartX.current = null
        if (Math.abs(dx) > 80) go(dx > 0 ? -1 : 1)
      }}
    >
      {saved && (
        <div
          role="status"
          className="fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-20 mx-auto max-w-sm animate-in fade-in slide-in-from-top-2 rounded-lg border-l-4 border-l-primary bg-card px-4 py-3 text-sm shadow-soft"
        >
          <span className="font-display font-bold">Skål!</span> {saved} saved.
        </div>
      )}
      <ScreenHeader
        title={title}
        rune="ᛞ"
        subtitle={
          <>
            <span className="italic" title={norseDayName(fromDateKey(date)).meaning}>
              {norseDayName(fromDateKey(date)).name}
            </span>{' '}
            · {subtitle}
          </>
        }
        action={
          <div className="flex gap-1">
            <Button variant="secondary" size="icon" aria-label="Previous day" onClick={() => go(-1)}>
              <ChevronLeft />
            </Button>
            <Button variant="secondary" size="icon" aria-label="Next day" disabled={isToday} onClick={() => go(1)}>
              <ChevronRight />
            </Button>
          </div>
        }
      />

      <div className="space-y-3">
        {isToday && <BackupReminder />}
        <QuickMood date={date} question={isToday ? 'How are you feeling?' : 'How was your mood?'} />

        {day && !isDayEmpty(day) && <DayEntryList day={day} />}
        {day && isDayEmpty(day) && (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardHeader className="text-center">
              <CardTitle>Nothing logged {isToday ? 'yet' : 'this day'}</CardTitle>
              <CardDescription>Moods, runs and kettlebell sessions show up here.</CardDescription>
            </CardHeader>
          </Card>
        )}

        <Button asChild variant={day && isDayEmpty(day) ? 'default' : 'secondary'} size="lg" className="w-full">
          <Link to={`/log?date=${date}`}>
            <Plus /> Add to {isToday ? 'today' : 'this day'}
          </Link>
        </Button>
        {!isToday && (
          <Button asChild variant="ghost" className="w-full text-muted-foreground">
            <Link to="/">Back to today</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
