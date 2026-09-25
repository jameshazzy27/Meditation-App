import { ScreenHeader } from '@/components/ScreenHeader'
import { Card, CardDescription, CardHeader } from '@/components/ui/card'

export function HistoryScreen() {
  return (
    <>
      <ScreenHeader title="History" />
      <Card className="border-dashed bg-transparent shadow-none">
        <CardHeader>
          <CardDescription>Every day you've logged, newest first. Coming in Step 1.6.</CardDescription>
        </CardHeader>
      </Card>
    </>
  )
}
