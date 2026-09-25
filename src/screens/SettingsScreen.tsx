import { ChevronRight, Palette } from 'lucide-react'
import { Link } from 'react-router'

import { ScreenHeader } from '@/components/ScreenHeader'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SettingsScreen() {
  return (
    <>
      <ScreenHeader title="Settings" />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose light or dark, or follow your phone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ThemeToggle />
            <Link
              to="/settings/style"
              className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              <Palette className="size-4 text-primary" />
              <span className="flex-1">Style preview</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
        <Card className="border-dashed bg-transparent shadow-none">
          <CardHeader>
            <CardDescription>
              Kettlebell complexes, export and import are coming in Steps 1.1 and 1.7.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  )
}
