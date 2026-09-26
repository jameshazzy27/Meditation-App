import { Plus } from 'lucide-react'
import { Link } from 'react-router'

import { DayEntryList } from '@/components/DayEntryList'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getEntriesForDay, isDayEmpty, todayKey, useLiveData } from '@/data'

export function TodayScreen() {
  const date = todayKey()
  const day = useLiveData(() => getEntriesForDay(date), [date])
  const heading = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <>
      <ScreenHeader title="Today" subtitle={heading} />
      {day && !isDayEmpty(day) && <DayEntryList day={day} />}
      {day && isDayEmpty(day) && (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardHeader className="text-center">
            <CardTitle>Nothing logged yet</CardTitle>
            <CardDescription>Your mood, runs and kettlebell sessions for today will show up here.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link to="/log">
                <Plus /> Log something
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  )
}
