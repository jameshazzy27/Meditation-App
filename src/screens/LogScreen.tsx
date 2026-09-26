import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

import { EntryIcon } from '@/components/EntryIcon'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Card, CardContent } from '@/components/ui/card'
import type { EntryKind } from '@/lib/entryTypes'

const options: { kind: EntryKind; title: string; description: string; to?: string }[] = [
  { kind: 'kettlebell', title: 'Kettlebell session', description: 'Complex, weight and rounds', to: '/log/kettlebell' },
  { kind: 'run', title: 'Run', description: 'Coming in Step 1.3' },
  { kind: 'mood', title: 'Mood', description: 'Coming in Step 1.4' },
]

export function LogScreen() {
  return (
    <>
      <ScreenHeader title="Log" subtitle="What would you like to add?" />
      <div className="space-y-3">
        {options.map(({ kind, title, description, to }) => {
          const content = (
            <Card className={to ? 'transition-colors hover:bg-accent/40' : 'bg-transparent opacity-60 shadow-none'}>
              <CardContent className="flex items-center gap-4">
                <EntryIcon kind={kind} className="size-12" />
                <div className="flex-1">
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                {to && <ChevronRight className="size-5 text-muted-foreground" />}
              </CardContent>
            </Card>
          )
          return to ? (
            <Link key={kind} to={to} className="block">
              {content}
            </Link>
          ) : (
            <div key={kind}>{content}</div>
          )
        })}
      </div>
    </>
  )
}
