import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useRef } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'

import { BackupReminder } from '@/components/BackupReminder'
import { DayEntryList } from '@/components/DayEntryList'
import { QuickMood } from '@/components/QuickMood'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { addDays, fromDateKey, getEntriesForDay, isDateKey, isDayEmpty, todayKey, useLiveData } from '@/data'
import { dayPath } from '@/lib/routes'

/** Everything on one day: "/" is today, "/day/YYYY-MM-DD" any other day. */
export function DayScreen() {
  const { date: dateParam } = useParams()
  const today = todayKey()
  const date = dateParam ?? today
  const navigate = useNavigate()
  const day = useLiveData(() => getEntriesForDay(date), [date])
  const touchStartX = useRef<number | null>(null)

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
      <ScreenHeader
        title={title}
        subtitle={subtitle}
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
