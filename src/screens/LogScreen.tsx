import { ChevronRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { EntryIcon } from '@/components/EntryIcon'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Card, CardContent } from '@/components/ui/card'
import { fromDateKey, isDateKey, todayKey } from '@/data'
import type { EntryKind } from '@/lib/entryTypes'

const options: { kind: EntryKind; title: string; description: string; to?: string }[] = [
  { kind: 'mood', title: 'Mood', description: 'A quick check-in', to: '/log/mood' },
  { kind: 'kettlebell', title: 'Kettlebell session', description: 'Complex, weight and rounds', to: '/log/kettlebell' },
  { kind: 'run', title: 'Run', description: 'Distance, time and pace', to: '/log/run' },
  { kind: 'meditation', title: 'Meditate', description: 'Timer, with heart rate if you like', to: '/meditate' },
]

export function LogScreen() {
  // Coming from a day's "Add" button: carry that day through to the form.
  const [params] = useSearchParams()
  const dateParam = params.get('date') ?? ''
  const date = isDateKey(dateParam) && dateParam !== todayKey() ? dateParam : undefined
  const withDate = (to: string) => (date ? `${to}?date=${date}` : to)

  return (
    <>
      <ScreenHeader
        title="Log"
        rune="ᚱ"
        subtitle={
          date
            ? `Adding to ${fromDateKey(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}`
            : 'What would you like to add?'
        }
      />
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
            <Link key={kind} to={withDate(to)} className="block">
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
