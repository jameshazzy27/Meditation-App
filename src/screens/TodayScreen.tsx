import { Link } from 'react-router'

import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function TodayScreen() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <>
      <ScreenHeader title="Today" subtitle={today} />
      <Card>
        <CardHeader>
          <CardTitle>Nothing logged yet</CardTitle>
          <CardDescription>Your mood, runs and kettlebell sessions for today will show up here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/log">Log something</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
