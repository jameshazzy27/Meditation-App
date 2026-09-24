import { ScreenHeader } from '@/components/ScreenHeader'
import { Card, CardDescription, CardHeader } from '@/components/ui/card'

export function SettingsScreen() {
  return (
    <>
      <ScreenHeader title="Settings" />
      <Card>
        <CardHeader>
          <CardDescription>Kettlebell complexes, export and import. Coming in Steps 1.1 and 1.7.</CardDescription>
        </CardHeader>
      </Card>
    </>
  )
}
