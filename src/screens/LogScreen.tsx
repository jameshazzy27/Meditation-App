import { ScreenHeader } from '@/components/ScreenHeader'
import { Card, CardDescription, CardHeader } from '@/components/ui/card'

export function LogScreen() {
  return (
    <>
      <ScreenHeader title="Log" />
      <Card className="border-dashed bg-transparent shadow-none">
        <CardHeader>
          <CardDescription>Log a run, kettlebell session or mood. Coming in Steps 1.2–1.4.</CardDescription>
        </CardHeader>
      </Card>
    </>
  )
}
