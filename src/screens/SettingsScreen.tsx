import { ChevronRight, Dumbbell, Palette, Trash2, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

import { BackupCard } from '@/components/BackupCard'
import { ScreenHeader } from '@/components/ScreenHeader'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { complexes, deleteSampleData, hasSampleData, useLiveData } from '@/data'

export function SettingsScreen() {
  const showSampleData = useLiveData(hasSampleData)
  const activeComplexes = useLiveData(() => complexes.listActive())

  function removeSampleData() {
    if (confirm('Remove all sample entries? Anything you have logged yourself stays.')) void deleteSampleData()
  }

  return (
    <>
      <ScreenHeader title="Settings" />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Kettlebell complexes</CardTitle>
            <CardDescription>
              {activeComplexes === undefined
                ? '\u00a0'
                : activeComplexes.length
                  ? activeComplexes.map((c) => c.name).join(', ')
                  : 'None yet — add the routines you train.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsLink to="/settings/complexes" icon={Dumbbell} label="Manage complexes" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose light or dark, or follow your phone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ThemeToggle />
            <SettingsLink to="/settings/style" icon={Palette} label="Style preview" />
          </CardContent>
        </Card>
        {showSampleData && (
          <Card>
            <CardHeader>
              <CardTitle>Sample data</CardTitle>
              <CardDescription>
                Aura started with a few example entries so you can see how things look. Remove them
                whenever you're ready — your own entries won't be touched.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={removeSampleData}>
                <Trash2 /> Remove sample data
              </Button>
            </CardContent>
          </Card>
        )}
        <BackupCard />
      </div>
    </>
  )
}

function SettingsLink({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
    >
      <Icon className="size-4 text-primary" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  )
}
