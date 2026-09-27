import { Check, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

import { BackLink } from '@/components/BackLink'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { complexes, useLiveData } from '@/data'
import { complexLibrary } from '@/lib/complexLibrary'
import { formatMovement } from '@/lib/format'

/** Ready-made complexes. Tapping one opens a pre-filled form to add it to your own. */
export function ComplexLibraryScreen() {
  const yourNames = useLiveData(async () =>
    new Set((await complexes.list()).map((c) => c.name.trim().toLowerCase())),
  )

  return (
    <>
      <BackLink to="/settings/complexes" label="Complexes" />
      <ScreenHeader title="Library" subtitle="20 ready-made complexes" rune="ᚢ" />
      <p className="mb-5 px-1 text-sm text-muted-foreground">
        Single kettlebell, reps on each arm, unless marked. Tap one to add it — you can change the reps,
        name or minutes first. Too easy? Double the reps.
      </p>

      <div className="space-y-3">
        {complexLibrary.map((template) => {
          const added = yourNames?.has(template.name.toLowerCase())
          return (
            <Link
              key={template.name}
              to={`/settings/complexes/new?from=${encodeURIComponent(template.name)}`}
              className="block"
            >
              <Card className="py-4 transition-colors hover:bg-accent/40">
                <CardContent className="flex items-center gap-3 px-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{template.name}</p>
                      {template.equipment && <Badge variant="secondary">{template.equipment}</Badge>}
                      {added && (
                        <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
                          <Check className="size-3.5" /> Added
                        </span>
                      )}
                    </div>
                    <ul className="space-y-0.5 text-sm text-muted-foreground">
                      {template.movements.map((m, i) => (
                        <li key={i}>{formatMovement(m)}</li>
                      ))}
                    </ul>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground/60" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
      <p className="mt-6 px-1 text-xs text-muted-foreground">From “20 Best Kettlebell Complexes” (PD).</p>
    </>
  )
}
