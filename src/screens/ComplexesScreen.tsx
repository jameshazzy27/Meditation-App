import { ChevronRight, Library, Plus, RotateCcw } from 'lucide-react'
import { Link } from 'react-router'

import { BackLink } from '@/components/BackLink'
import { ComplexBadge } from '@/components/ComplexBadge'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { complexes, useLiveData } from '@/data'
import { complexSummary, formatMovement } from '@/lib/format'

export function ComplexesScreen() {
  const active = useLiveData(() => complexes.listActive())
  const archived = useLiveData(() => complexes.listArchived())

  return (
    <>
      <BackLink to="/settings" label="Settings" />
      <ScreenHeader title="Complexes" subtitle="Your kettlebell routines" rune="ᚢ" />

      <div className="space-y-3">
        {active?.map((complex) => (
          <Link key={complex.id} to={`/settings/complexes/${complex.id}`} className="block">
            <Card className="transition-colors hover:bg-accent/40">
              <CardContent className="flex items-center gap-4">
                <ComplexBadge name={complex.name} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{complex.name}</p>
                  <p className="text-sm text-muted-foreground">{complexSummary(complex)}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground/80">
                    {complex.movements.map(formatMovement).join(' · ')}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}

        {active?.length === 0 && (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardHeader className="text-center">
              <CardTitle>No complexes yet</CardTitle>
              <CardDescription>
                Pick a ready-made complex from the library, or make your own — a list of movements you
                repeat for as many rounds as you can.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button asChild size="lg">
            <Link to="/settings/complexes/library">
              <Library /> From library
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/settings/complexes/new">
              <Plus /> Make your own
            </Link>
          </Button>
        </div>
      </div>

      {archived && archived.length > 0 && (
        <section className="mt-10 space-y-3">
          <div>
            <h2 className="text-2xl font-medium">Archived</h2>
            <p className="text-sm text-muted-foreground">
              Hidden when logging, but past sessions keep them.
            </p>
          </div>
          {archived.map((complex) => (
            <Card key={complex.id} className="bg-transparent shadow-none">
              <CardContent className="flex items-center gap-4">
                <ComplexBadge name={complex.name} muted />
                <Link to={`/settings/complexes/${complex.id}`} className="min-w-0 flex-1">
                  <p className="font-semibold text-muted-foreground">{complex.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{complexSummary(complex)}</p>
                </Link>
                <Button variant="outline" size="sm" onClick={() => void complexes.restore(complex.id)}>
                  <RotateCcw /> Restore
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </>
  )
}
